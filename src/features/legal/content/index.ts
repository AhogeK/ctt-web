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

import { privacyContent as privacyEn } from './privacy-en'
import { privacyContent as privacyZh } from './privacy-zh'
import { termsContent as termsEn } from './terms-en'
import { termsContent as termsZh } from './terms-zh'

export type { TermsContent, TermsSection } from './terms-en'
export type { PrivacyContent } from './privacy-en'

const isChinese = () => currentLocale.value === 'zh-CN'

/** The terms of service, in the language the reader is using. */
export const termsContent = computed(() => (isChinese() ? termsZh : termsEn))

/** The privacy and cookie notice, in the language the reader is using. */
export const privacyContent = computed(() => (isChinese() ? privacyZh : privacyEn))

export default termsContent
