/// <reference types="vite-plus/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Contact address a deployment publishes in its privacy notice; unset means "not published". */
  readonly VITE_OPERATOR_CONTACT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
