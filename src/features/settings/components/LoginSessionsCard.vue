<script setup lang="ts">
/**
 * Login sessions card for the security page.
 *
 * One server row is one **login**, so an account that signs in repeatedly — or clears its cookies
 * without signing out — accumulates rows that all read "Chrome · macOS". Rendering that list
 * literally buries the page under identical rows with identical buttons: the entries are truthful,
 * but they are not all worth the same amount of space.
 *
 * So the card shows the current sign-in on its own, and folds the rest into one row per client
 * with a count. Individual sign-ins appear only when that client is expanded, and only then is
 * each one revocable. The server's order and its `current` flag are used as they arrive: it sorts
 * by last use and decides which row is the caller's own — re-deriving either here would replace
 * the server's answer with a guess.
 *
 * A browser session carries no device name, only a user agent string, so its title is derived
 * through the catalogue. A plugin session is a device, and shows the names the plugin registered.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronRight, Globe, Monitor } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SETTINGS_ACTION_BUTTON_CLASS } from './action-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils'
import { extractErrorCode, isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { parseUserAgent } from '@/lib/utils/user-agent'
import { useAuthStore } from '@/stores/auth'
import type { LoginSession } from '@/lib/api'
import { useLoginSessions } from '../composables/useLoginSessions'

const { t } = useI18n()
const authStore = useAuthStore()
const { sessions, isPending, isError, refetch, revokeMutation } = useLoginSessions()

/** The session the confirmation dialog is asking about, or null when it is closed. */
const target = ref<LoginSession | null>(null)

/** Clients whose individual sign-ins are shown. Everything else stays folded. */
const expandedKeys = ref<Set<string>>(new Set())

const labelClass = 'text-sm font-medium text-muted-foreground dark:text-muted-foreground'
const metaClass = 'text-xs text-muted-foreground dark:text-muted-foreground'

/**
 * The row's heading.
 *
 * Browser and system names are keys resolved through the catalogue — the agent string itself is
 * never the title, because it is English in every locale and says more than a reader needs. It
 * stays available as the row's tooltip.
 */
function rowTitle(session: LoginSession): string {
  if (session.kind === 'PLUGIN') {
    return session.deviceName ?? t('settings.security.sessions.unnamed')
  }

  const agent = parseUserAgent(session.userAgent)
  const parts = [
    agent.browser ? t(`settings.security.agent.browser.${agent.browser}`) : null,
    agent.system ? t(`settings.security.agent.system.${agent.system}`) : null,
  ].filter((part): part is string => part !== null)

  if (parts.length > 0) return parts.join(' · ')

  // Nothing recognised: the agent string itself is the only thing that tells two such clients
  // apart, so it becomes the title — already truncated by the parser — rather than one shared
  // "unnamed" row that would hide a different client's revoke behind a stranger's.
  return agent.raw || t('settings.security.sessions.unnamed')
}

/**
 * What kind of client the session belongs to, plus the IDE a plugin registered.
 *
 * The IDE belongs here rather than beside the device name because a machine can run several of
 * them: "workstation · IntelliJ IDEA" and "workstation · PyCharm" are two different rows.
 */
function rowKind(session: LoginSession): string {
  if (session.kind !== 'PLUGIN') return t('settings.security.sessions.browser')
  const plugin = t('settings.security.sessions.plugin')
  return session.ideName ? `${plugin} · ${session.ideName}` : plugin
}

/** The agent string, kept as a tooltip for the browser rows that were recognised. */
function rowAgentTooltip(session: LoginSession): string | undefined {
  return session.kind === 'PLUGIN' ? undefined : (session.userAgent ?? undefined)
}

/** When the session last asked for a token, or the fact that it never did. */
function lastUsedLabel(session: LoginSession): string {
  return session.lastUsedAt
    ? t('settings.security.sessions.lastUsed', { time: formatRelativeTime(session.lastUsedAt) })
    : t('settings.security.sessions.neverUsed')
}

/**
 * Everything a reader needs when deciding whether to keep one sign-in.
 *
 * It stays in the tooltip of the folded rows and becomes the row's own line once the client is
 * expanded — the moment the choice is actually being made.
 */
function detailTitle(session: LoginSession): string {
  const lines = [
    t('settings.security.sessions.created', { time: formatDateTime(session.createdAt) }),
    lastUsedLabel(session),
  ]
  if (session.expiresAt) {
    lines.push(t('settings.security.sessions.expires', { time: formatDateTime(session.expiresAt) }))
  }
  return lines.join(' · ')
}

interface SessionGroup {
  /** Client identity: two sign-ins share a group when the row would read the same. */
  key: string
  title: string
  /** The kind of client, already resolved through the catalogue. */
  kindLabel: string
  /** Whether the client is a tracker rather than a browser — decides the icon. */
  isPlugin: boolean
  /** The server's order, most recently used first. */
  sessions: LoginSession[]
}

/** The caller's own sign-in: shown on its own, never folded into a group. */
const currentSession = computed<LoginSession | null>(() => sessions.value?.find((s) => s.current) ?? null)

/**
 * The remaining sign-ins, folded by client.
 *
 * The first occurrence decides the group's position, so the groups are ordered by their most
 * recent use — the same order the server chose for the rows inside them.
 */
const groups = computed<SessionGroup[]>(() => {
  const folded = new Map<string, SessionGroup>()
  for (const session of sessions.value ?? []) {
    if (session.current) continue
    const title = rowTitle(session)
    const kindLabel = rowKind(session)
    const key = `${session.kind}|${title}|${kindLabel}`
    const group = folded.get(key)
    if (group) {
      group.sessions.push(session)
    } else {
      folded.set(key, { key, title, kindLabel, isPlugin: session.kind === 'PLUGIN', sessions: [session] })
    }
  }
  return [...folded.values()]
})

/** How many sign-ins are folded away — the number the description does not have to explain. */
const foldedCount = computed(() => groups.value.reduce((total, group) => total + group.sessions.length, 0))

function isExpanded(key: string): boolean {
  return expandedKeys.value.has(key)
}

function toggle(key: string): void {
  const next = new Set(expandedKeys.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  expandedKeys.value = next
}

function askToRevoke(session: LoginSession): void {
  target.value = session
}

async function confirmRevoke(): Promise<void> {
  const session = target.value
  if (!session) return
  target.value = null

  try {
    await revokeMutation.mutateAsync(session.id)
    if (session.current) {
      // The session the user is standing on is gone, so the local teardown is the one every
      // other sign-out path performs.
      authStore.signOutLocally()
      return
    }
    toast.success(t('settings.security.sessions.revoked'))
  } catch (error) {
    // A 401 means the session behind this request is gone — the interceptor has already cleared
    // it and redirected. Its message table belongs to the reset-link flow, so mapping the code
    // here would show the wrong copy on top of a redirect that is already under way.
    if (isApiError(error) && error.statusCode === 401) return

    const code = extractErrorCode(error)
    toast.error(t('settings.security.sessions.revokeFailed'), {
      description: code ? mapApiErrorCode(code) : undefined,
    })
  }
}

/** Whether any revocation is in flight — the actions stay disabled while one is. */
const isRevoking = computed(() => revokeMutation.isPending.value)
</script>

<template>
  <div data-surface="card" class="rounded-lg border border-border dark:border-white/8 bg-muted dark:bg-card p-6">
    <h2 class="text-lg font-medium text-foreground dark:text-foreground">
      {{ t('settings.security.sessions.title') }}
    </h2>
    <p class="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
      {{ t('settings.security.sessions.description') }}
    </p>

    <div v-if="isPending" class="mt-4 flex flex-col gap-3" data-testid="login-sessions-loading">
      <div v-for="row in 2" :key="row" class="h-9 animate-pulse rounded-md bg-foreground/5 dark:bg-white/5" />
    </div>

    <div v-else-if="isError" class="mt-4 flex items-center justify-between gap-4">
      <p :class="labelClass">{{ t('settings.security.sessions.loadFailed') }}</p>
      <Button
        variant="outline"
        :class="SETTINGS_ACTION_BUTTON_CLASS"
        data-testid="login-sessions-retry"
        @click="refetch()"
      >
        {{ t('settings.common.retry') }}
      </Button>
    </div>

    <p v-else-if="!sessions || sessions.length === 0" class="mt-4" :class="labelClass">
      {{ t('settings.security.sessions.empty') }}
    </p>

    <ul v-else class="mt-4 flex flex-col divide-y divide-border dark:divide-white/8" data-testid="login-sessions">
      <!-- The sign-in the reader is using: one row, always open, with the way out. -->
      <li
        v-if="currentSession"
        class="flex flex-col gap-2 py-2 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        data-testid="login-session-row"
        data-current="true"
      >
        <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Monitor v-if="currentSession.kind === 'PLUGIN'" class="size-[18px] shrink-0 text-muted-foreground" />
          <Globe v-else class="size-[18px] shrink-0 text-muted-foreground" />
          <span class="truncate text-sm text-foreground dark:text-foreground" :title="rowAgentTooltip(currentSession)">
            {{ rowTitle(currentSession) }}
          </span>
          <Badge
            variant="secondary"
            class="bg-success/15 text-success dark:bg-success/15 dark:text-success"
            data-testid="login-session-current"
          >
            {{ t('settings.security.sessions.current') }}
          </Badge>
          <span :class="metaClass">{{ rowKind(currentSession) }}</span>
          <span :class="metaClass" :title="detailTitle(currentSession)">{{ lastUsedLabel(currentSession) }}</span>
        </div>

        <Button
          variant="outline"
          :class="cn(SETTINGS_ACTION_BUTTON_CLASS, 'shrink-0 self-start sm:self-auto')"
          :disabled="isRevoking"
          data-testid="login-session-revoke"
          @click="askToRevoke(currentSession)"
        >
          {{ t('settings.security.sessions.signOut') }}
        </Button>
      </li>

      <!-- Every other client: one row, folded, until the reader asks for the individual sign-ins. -->
      <template v-for="group in groups" :key="group.key">
        <li
          class="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          data-testid="login-session-group"
        >
          <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Monitor v-if="group.isPlugin" class="size-[18px] shrink-0 text-muted-foreground" />
            <Globe v-else class="size-[18px] shrink-0 text-muted-foreground" />
            <span class="truncate text-sm text-foreground dark:text-foreground">{{ group.title }}</span>
            <span :class="metaClass">{{ group.kindLabel }}</span>
            <Badge
              v-if="group.sessions.length > 1"
              variant="secondary"
              class="bg-foreground/5 text-muted-foreground dark:bg-white/5"
              data-testid="login-session-count"
            >
              {{ t('settings.security.sessions.count', { count: group.sessions.length }) }}
            </Badge>
            <span :class="metaClass" :title="detailTitle(group.sessions[0]!)">{{
              lastUsedLabel(group.sessions[0]!)
            }}</span>
          </div>

          <div class="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            <!-- One sign-in needs no expander: it is already one line. -->
            <Button
              v-if="group.sessions.length === 1"
              variant="outline"
              :class="SETTINGS_ACTION_BUTTON_CLASS"
              :disabled="isRevoking"
              data-testid="login-session-revoke"
              @click="askToRevoke(group.sessions[0]!)"
            >
              {{ t('settings.security.sessions.revoke') }}
            </Button>
            <Button
              v-else
              variant="outline"
              :class="SETTINGS_ACTION_BUTTON_CLASS"
              :aria-expanded="isExpanded(group.key)"
              data-testid="login-session-toggle"
              @click="toggle(group.key)"
            >
              <component :is="isExpanded(group.key) ? ChevronDown : ChevronRight" class="size-4" />
              {{
                isExpanded(group.key)
                  ? t('settings.security.sessions.collapse')
                  : t('settings.security.sessions.expand')
              }}
            </Button>
          </div>
        </li>

        <template v-if="isExpanded(group.key)">
          <li
            v-for="session in group.sessions"
            :key="session.id"
            class="flex items-center justify-between gap-4 py-2 pl-8"
            data-testid="login-session-child"
          >
            <span :class="metaClass">{{ detailTitle(session) }}</span>
            <Button
              variant="outline"
              :class="SETTINGS_ACTION_BUTTON_CLASS"
              :disabled="isRevoking"
              data-testid="login-session-revoke"
              @click="askToRevoke(session)"
            >
              {{ t('settings.security.sessions.revoke') }}
            </Button>
          </li>
        </template>
      </template>
    </ul>

    <p v-if="!isPending && !isError && foldedCount > 1" class="mt-3" :class="metaClass">
      {{ t('settings.security.sessions.footnote') }}
    </p>

    <Dialog :open="target !== null" @update:open="(open) => !open && (target = null)">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('settings.security.sessions.revokeTitle') }}</DialogTitle>
          <DialogDescription>
            {{
              target?.current
                ? t('settings.security.sessions.revokeCurrentDescription')
                : t('settings.security.sessions.revokeDescription')
            }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-2">
          <Button variant="ghost" :disabled="isRevoking" @click="target = null">
            {{ t('settings.common.cancel') }}
          </Button>
          <Button
            variant="destructive"
            :disabled="isRevoking"
            data-testid="login-session-confirm"
            @click="confirmRevoke"
          >
            {{ isRevoking ? t('settings.security.sessions.revoking') : t('settings.security.sessions.revokeConfirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
