<script setup lang="ts">
/**
 * The open-source block — the page's answer to "where does my data live".
 *
 * The claim is the deployment model: the plugin tracks locally, and sync lands on a server the user
 * runs. The evidence is the three repositories with their licences and one command that brings the
 * server up; the command is the server repository's own README quick start, verbatim.
 */
import { Check, Copy } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/composables/useCopyToClipboard'
import { ECOSYSTEM_REPOS } from '@/lib/site-links'

const DEPLOY_COMMAND = `git clone https://github.com/AhogeK/ctt-server && cd ctt-server
cp .env.example .env    # your database and Redis passwords
docker compose up -d --build`

const { copied, copy } = useCopyToClipboard()

async function handleCopy() {
  await copy(DEPLOY_COMMAND)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-3">
      <h2 class="text-heading-2">Open source, end to end</h2>
      <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
        Your sessions live on a server you run. The whole stack is public — read it, fork it, or host it yourself.
      </p>
    </header>

    <ul class="grid gap-x-8 gap-y-6 sm:grid-cols-3">
      <li v-for="repo in ECOSYSTEM_REPOS" :key="repo.url" class="flex flex-col gap-1.5 border-t border-border/60 pt-4">
        <a
          :href="repo.url"
          target="_blank"
          rel="noopener noreferrer"
          class="w-fit rounded-sm font-emphasis text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {{ repo.name }}
        </a>
        <p class="text-sm leading-relaxed text-muted-foreground">{{ repo.role }}</p>
        <p class="font-mono text-xs text-muted-foreground">{{ repo.licence }}</p>
      </li>
    </ul>

    <div class="flex flex-col gap-3">
      <div class="overflow-hidden rounded-lg border border-border/60 bg-muted">
        <pre
          class="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-foreground/90"
        ><code>{{ DEPLOY_COMMAND }}</code></pre>
        <!-- The action sits in its own row rather than floating over the code: an overlaying button
             covers the first line's tail at phone widths. -->
        <div class="flex justify-end border-t border-border/60 px-2 py-1.5">
          <Button type="button" variant="ghost" size="sm" @click="handleCopy">
            <Check v-if="copied" />
            <Copy v-else />
            {{ copied ? 'Copied' : 'Copy' }}
          </Button>
        </div>
      </div>
      <p class="text-sm leading-relaxed text-muted-foreground">
        Brings the server up with PostgreSQL, Redis and a local mail sandbox. Then create an API key and paste it into
        the plugin's sync settings.
      </p>
    </div>
  </div>
</template>
