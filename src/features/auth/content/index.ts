/**
 * Terms content follows the active interface language.
 *
 * Both catalogues are plain modules; this module exposes the one matching the
 * language the user is currently viewing, so the legal text and the interface
 * around it never disagree. Consumers read `termsContent` like a plain object
 * (templates unwrap the ref automatically).
 */
import { computed } from 'vue'

import { currentLocale } from '@/i18n'

import { termsContent as termsEn } from './terms-en'
import { termsContent as termsZh } from './terms-zh'

export type { TermsContent, TermsSection } from './terms-en'

export const termsContent = computed(() => (currentLocale.value === 'zh-CN' ? termsZh : termsEn))

export default termsContent
