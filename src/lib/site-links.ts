/**
 * External destinations this site links to.
 *
 * Single source of truth: the shell and the landing page both point at these,
 * and a second copy is how a link silently goes stale. The ecosystem is more
 * than one repository, so the footer lists them rather than promoting a single
 * URL — the plugin is where the data comes from, the server is where it lands,
 * and this dashboard is where it is read.
 */

export interface EcosystemRepo {
  /** Repository name, shown as the link label */
  name: string
  /** Canonical GitHub URL */
  url: string
  /** One-line role in the ecosystem */
  role: string
}

export const ECOSYSTEM_REPOS: readonly EcosystemRepo[] = [
  {
    name: 'code-time-tracker',
    url: 'https://github.com/AhogeK/code-time-tracker',
    role: 'JetBrains plugin — where the data comes from',
  },
  {
    name: 'ctt-server',
    url: 'https://github.com/AhogeK/ctt-server',
    role: 'Sync backend — where it lands',
  },
  {
    name: 'ctt-web',
    url: 'https://github.com/AhogeK/ctt-web',
    role: 'This dashboard — where it is read',
  },
]

/** This site's own source, for the shell's top-bar shortcut. */
export const SITE_REPO_URL = 'https://github.com/AhogeK/ctt-web'

/**
 * The plugin's JetBrains Marketplace listing — the product's install entry.
 * Verified against the Marketplace API (`searchPlugins?search=Code Time Tracker`
 * → xmlId `com.ahogek.code-time-tracker`).
 */
export const PLUGIN_INSTALL_URL = 'https://plugins.jetbrains.com/plugin/29379'
