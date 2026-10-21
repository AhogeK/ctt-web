/**
 * Simplified Chinese messages.
 *
 * Typed as `Messages`, so a key added to English without a translation (or one
 * whose path drifted) is a compile error here rather than a runtime fallback.
 */
import type { Messages } from './en'

const zhCN: Messages = {
  nav: {
    groupNavigation: '导航',
    groupSettings: '设置',
    dashboard: '统计看板',
    achievements: '成就',
    leaderboard: '排行榜',
    settings: '设置',
  },
  header: {
    openUserMenu: '打开用户菜单',
    appearance: '外观',
    language: '语言',
    settings: '设置',
    logout: '退出登录',
    loggingOut: '正在退出…',
    fallbackUser: '用户',
  },
  language: {
    english: 'English',
    chineseSimplified: '简体中文',
  },
  theme: {
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
    systemDark: '跟随系统（深色）',
    systemLight: '跟随系统（浅色）',
  },
  auth: {
    common: {
      email: '邮箱',
      emailPlaceholder: "you{'@'}example.com",
      password: '密码',
      passwordPlaceholder: '请输入密码',
      captchaRequired: '请先完成人机验证',
      or: '或',
      close: '关闭',
      backToSignIn: '返回登录',
      tryAgain: '重试',
    },
    validation: {
      invalidEmail: '邮箱格式不正确',
      emailRequired: '请输入邮箱',
    },
    login: {
      signIn: '登录',
      signingIn: '正在登录…',
      forgotPassword: '忘记密码？',
      continueWithGithub: '使用 GitHub 登录',
      connectingToGithub: '正在连接 GitHub…',
    },
  },
  settings: {
    sections: {
      navLabel: '设置分区',
      profile: '个人资料',
      profileDescription: '账号、邮箱与登录方式',
      devices: '设备',
      devicesDescription: '同步编码时长的设备',
      preferences: '偏好设置',
      preferencesDescription: '外观与语言',
      apiKeys: 'API 密钥',
      apiKeysDescription: '插件与 API 的凭据',
    },
    preferences: {
      title: '偏好设置',
      subtitle: '应用于当前浏览器的外观与行为。',
      appearance: '外观',
      current: '当前：{value}',
      theme: '主题',
      language: '语言',
      languageDescription: '界面语言，切换后立即生效。',
    },
  },
}

export default zhCN
