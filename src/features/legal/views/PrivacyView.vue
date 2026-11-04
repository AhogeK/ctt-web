<script setup lang="ts">
/**
 * Privacy and cookie notice.
 *
 * A real page rather than a dialog: the notice has to be linkable, readable without signing in, and
 * quotable in a request to the operator. Every entry in its storage table comes from the code, so a
 * change that adds storage without touching the notice is caught by the content test.
 */
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@lucide/vue'
import { privacyContent } from '@/features/legal/content'
import { RouteNames } from '@/router/route-names'

const { t } = useI18n()
</script>

<template>
  <main class="min-h-screen bg-background px-4 py-12 sm:px-6 sm:py-16">
    <article class="mx-auto flex w-full max-w-[72ch] flex-col gap-8">
      <header class="flex flex-col gap-3">
        <RouterLink
          :to="{ name: RouteNames.LANDING }"
          class="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          data-testid="privacy-back"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          {{ t('legal.privacy.back') }}
        </RouterLink>
        <h1 class="text-3xl font-semibold text-foreground">{{ t('legal.privacy.title') }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ t('legal.privacy.lastUpdated', { date: privacyContent.lastUpdated }) }}
        </p>
        <p class="text-sm text-muted-foreground" data-testid="privacy-contact">
          {{ privacyContent.contact || t('legal.privacy.contactUnset') }}
        </p>
        <p
          v-for="(paragraph, index) in privacyContent.intro"
          :key="`intro-${index}`"
          class="text-sm leading-6 text-foreground"
        >
          {{ paragraph }}
        </p>
      </header>

      <section class="flex flex-col gap-3" aria-labelledby="privacy-storage">
        <h2 id="privacy-storage" class="text-xl font-semibold text-foreground">
          {{ t('legal.privacy.storageTitle') }}
        </h2>
        <p class="text-sm leading-6 text-muted-foreground">{{ privacyContent.storageIntro }}</p>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-sm" data-testid="privacy-storage-table">
            <thead>
              <tr class="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" class="py-2 pr-3 font-medium">{{ privacyContent.storageHeaders.name }}</th>
                <th scope="col" class="py-2 pr-3 font-medium">{{ privacyContent.storageHeaders.store }}</th>
                <th scope="col" class="py-2 pr-3 font-medium">{{ privacyContent.storageHeaders.purpose }}</th>
                <th scope="col" class="py-2 pr-3 font-medium">{{ privacyContent.storageHeaders.lifetime }}</th>
                <th scope="col" class="py-2 font-medium">{{ privacyContent.storageHeaders.status }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in privacyContent.storage"
                :key="`${item.name}-${item.kind}`"
                class="border-b border-border/60 align-top"
              >
                <th scope="row" class="py-3 pr-3 font-mono text-xs font-normal text-foreground">{{ item.name }}</th>
                <td class="py-3 pr-3 text-muted-foreground">{{ t(`legal.privacy.store.${item.kind}`) }}</td>
                <td class="py-3 pr-3 leading-6 text-muted-foreground">{{ item.purpose }}</td>
                <td class="py-3 pr-3 leading-6 text-muted-foreground">{{ item.lifetime }}</td>
                <td class="py-3 leading-6 text-muted-foreground">
                  {{ item.essential ? privacyContent.statusLabels.essential : privacyContent.statusLabels.optional }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-for="section in privacyContent.sections" :key="section.id" class="flex flex-col gap-2">
        <h2 class="text-xl font-semibold text-foreground">{{ section.title }}</h2>
        <p
          v-for="(paragraph, index) in section.paragraphs"
          :key="`${section.id}-${index}`"
          class="text-sm leading-6 text-foreground"
        >
          {{ paragraph }}
        </p>
      </section>

      <footer class="border-t border-border pt-6 text-sm text-muted-foreground">
        {{ privacyContent.disclaimer }}
      </footer>
    </article>
  </main>
</template>
