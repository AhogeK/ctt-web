/**
 * Privacy and cookie notice, in English.
 *
 * It describes what this build actually stores — every entry below is read from the code
 * (`src/stores/auth.ts`, `src/stores/theme.ts`, `src/stores/motion.ts`, `src/lib/utils/`,
 * `src/i18n/locale.ts`, and the server's cookie helper) rather than from a template. A storage
 * entry that is added or removed without a matching line here makes the notice wrong, which is
 * worse than having none.
 */
export type PrivacyStorageKind = 'cookie' | 'localStorage' | 'sessionStorage'

/** One thing the browser keeps for this site. */
export interface PrivacyStorageItem {
  /** The exact key or cookie name. */
  name: string
  kind: PrivacyStorageKind
  purpose: string
  /** How long it lives, in words a reader can act on. */
  lifetime: string
  /** True when the service cannot work without it; only those need no consent. */
  essential: boolean
}

export interface PrivacySection {
  id: string
  title: string
  paragraphs: string[]
}

export interface PrivacyContent {
  lastUpdated: string
  intro: string[]
  storageIntro: string
  /** Headers for the storage table. */
  storageHeaders: { name: string; store: string; purpose: string; lifetime: string; status: string }
  statusLabels: { essential: string; optional: string }
  storage: PrivacyStorageItem[]
  sections: PrivacySection[]
  disclaimer: string
  /** Rendered as the controller's contact; empty means the deployment has not published one. */
  contact: string
}

export const privacyContent: PrivacyContent = {
  lastUpdated: '2026-11-05',
  intro: [
    'This page lists everything this site keeps in your browser, why it is there, and how long it stays. It covers cookies and the browser storage that the same rules apply to.',
    'The site runs on Code Time Tracker, which you can host yourself. The person or organisation operating this deployment is the data controller; this page describes what the software does, and the operator is responsible for the contact details in the "Who is responsible" section.',
  ],
  storageIntro:
    'Everything below is first-party: it is set by this site, not by an advertising or analytics network. None of it is shared or sold.',
  storageHeaders: { name: 'Name', store: 'Stored in', purpose: 'Purpose', lifetime: 'Lifetime', status: 'Consent' },
  statusLabels: { essential: 'Not required — strictly necessary', optional: 'Required' },
  storage: [
    {
      name: 'ctt_refresh_token',
      kind: 'cookie',
      purpose:
        'Keeps you signed in between visits. The server reads it from this browser only, to issue a new short-lived access token.',
      lifetime: '14 days, and each refresh reissues it — an active session keeps sliding — removed when you sign out',
      essential: true,
    },
    {
      name: 'XSRF-TOKEN',
      kind: 'cookie',
      purpose:
        'Proves a state-changing request came from this site rather than from another page you happened to have open.',
      lifetime: 'Until the browser session ends',
      essential: true,
    },
    {
      name: 'ctt_access_token',
      kind: 'cookie',
      purpose: 'The short-lived credential itself, set by the server so a request can identify your session.',
      lifetime: '15 minutes, replaced by each refresh',
      essential: true,
    },
    {
      name: 'ctt_access_token',
      kind: 'localStorage',
      purpose:
        'The page keeps the same access token locally so it can attach it to requests and survive a reload without a round trip.',
      lifetime: '15 minutes, replaced by each refresh',
      essential: true,
    },
    {
      name: 'ctt_oauth_state',
      kind: 'cookie',
      purpose:
        'Set by the server when you start a GitHub sign-in and read back on return, so a callback that this browser did not begin is refused.',
      lifetime: '10 minutes, or until the sign-in finishes',
      essential: true,
    },
    {
      name: 'sidebar_state',
      kind: 'cookie',
      purpose: 'Whether the navigation sidebar was expanded or collapsed, so it looks the same next time.',
      lifetime: '7 days',
      essential: true,
    },
    {
      name: 'ctt_user_id, ctt_session',
      kind: 'localStorage',
      purpose:
        'Remember which account this browser is signed in as, so the interface can show the right shell before the first response arrives. Neither carries a credential.',
      lifetime: 'Until you sign out',
      essential: true,
    },
    {
      name: 'ctt-device-id',
      kind: 'localStorage',
      purpose:
        'A random identifier for this browser, sent with a sign-in so the server can list and revoke that session as one device. It is not derived from your hardware and is not cleared when you sign out — clearing this site’s data removes it.',
      lifetime: 'Until you clear this site’s data',
      essential: true,
    },
    {
      name: 'ctt.settings.sessions.bulk-cooldown',
      kind: 'sessionStorage',
      purpose:
        'Remembers, for this tab only, that the server asked you to wait before revoking more sessions, so the button stays disabled for that long instead of failing.',
      lifetime: 'Until the tab closes, or the wait the server gave runs out',
      essential: true,
    },
    {
      name: 'ctt.passkey-used',
      kind: 'localStorage',
      purpose:
        'Remembers that a passkey was set up or used here, so the sign-in page may offer it without being asked. Removed when the last passkey is deleted.',
      lifetime: 'Until you delete your last passkey or clear this site’s data',
      essential: true,
    },
    {
      name: 'vueuse-color-scheme, theme-appearance, ctt.motion',
      kind: 'localStorage',
      purpose: 'Your choice of light or dark theme, and whether motion is reduced. Nothing else.',
      lifetime: 'Until you change it or clear this site’s data',
      essential: true,
    },
    {
      name: 'ctt.locale',
      kind: 'localStorage',
      purpose: 'The interface language you picked.',
      lifetime: 'Until you change it or clear this site’s data',
      essential: true,
    },
    {
      name: 'ctt.oauth-flow, oauth_redirect',
      kind: 'sessionStorage',
      purpose:
        'Keeps a sign-in through GitHub inside the tab that started it, so a link someone sends cannot sign you into their account.',
      lifetime: 'Until the tab closes; a sign-in consumes it',
      essential: true,
    },
    {
      name: 'ctt_pending_verification_email',
      kind: 'sessionStorage',
      purpose: 'Remembers which address the verification screen is about, so it survives a reload of that tab.',
      lifetime: 'Until you leave that screen or close the tab',
      essential: true,
    },
  ],
  sections: [
    {
      id: 'no-tracking',
      title: 'What this site does not do',
      paragraphs: [
        'There is no analytics, no advertising, no affiliate or social tracking, and no session recording in this build. Every icon ships with the bundle, so no page asks another server for one. No third-party script runs anywhere except the bot challenge described below, and that one loads only on the pages that need it.',
        'Because nothing here is optional, you are not shown a consent banner. That is a consequence of the design, not an exemption taken on trust: any storage added later for measurement or marketing would have to be switched off until you agree to it.',
      ],
    },
    {
      id: 'who-is-responsible',
      title: 'Who is responsible',
      paragraphs: [
        'The operator of this deployment decides what happens to your data. If you are running it yourself, that is you.',
        'The software project publishes its code and issue tracker at github.com/AhogeK/ctt-web; a self-hosted deployment should state its own contact address here. Requests about your account — access, correction, deletion — go to whoever operates the deployment you signed up to.',
      ],
    },
    {
      id: 'third-parties',
      title: 'Third parties that see your request',
      paragraphs: [
        'hCaptcha runs a challenge on the sign-in, registration and password-reset pages, to stop automated attempts at guessing credentials. It sees the request’s IP address and the signals its own challenge collects, and it may set its own storage. It handles that as a processor, under the standard data-processing terms of its service, with the EU and UK transfer safeguards those terms carry, and inherits nothing else about you. It is the only third-party code this site loads, and an operator who does not configure a site key never loads it at all.',
        'Signing in with GitHub is an ordinary redirect: GitHub authenticates you on its own site, under its own privacy policy, and hands this site an access token and your GitHub username. No GitHub script runs on these pages.',
      ],
    },
    {
      id: 'your-controls',
      title: 'What you can do about it',
      paragraphs: [
        'Export everything the site holds about you from Settings → Security → Data export. It arrives as one JSON file.',
        'Correct your display name or password in Settings → Profile; delete the account and everything attached to it in Settings → Profile → Danger zone. Revoke a single session, or every session, in Settings → Security.',
        'Withdrawing is the same as leaving: signing out ends the session server-side, and clearing this site’s data in your browser removes the local storage described above. Deleting the account removes the record itself.',
      ],
    },
    {
      id: 'retention',
      title: 'How long records stay',
      paragraphs: [
        'The refresh cookie keeps a session alive for 14 days, and each refresh reissues it, so a session in use keeps sliding. The server keeps the record behind that cookie for up to 30 days after it stops being used. An access token lives 15 minutes. Sign-in history is listed in Settings → Security and can be revoked there; deleting the account removes it.',
        'The operator of a deployment may keep backups for a limited period, as any hosted service does. Ask them for that period if you need it in writing.',
      ],
    },
    {
      id: 'security',
      title: 'How the storage is protected',
      paragraphs: [
        'The refresh token is an httpOnly, Secure, SameSite=Strict cookie, limited to the refresh endpoint: no script on the page can read it. The CSRF token is readable by design — it is a value the page must echo back — and contains nothing about you.',
        'In production the site must be served over HTTPS; the refresh cookie is marked Secure, so it is never sent over a plain connection.',
      ],
    },
    {
      id: 'changes',
      title: 'When this page changes',
      paragraphs: [
        'The date at the top moves whenever the list of storage changes. Substantial changes are announced in the interface before they take effect, and a change that adds optional storage would arrive with a choice, not with a banner already switched on.',
      ],
    },
  ],
  // A deployment publishes its own contact here; the page says so plainly when it is empty.
  contact: (import.meta.env.VITE_OPERATOR_CONTACT ?? '').trim(),
  disclaimer:
    'This notice describes the software’s behaviour. It is not legal advice: an operator deploying it publicly should have their own counsel review it against the law that applies to them.',
}
