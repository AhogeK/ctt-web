/**
 * Privacy and cookie notice, in Chinese.
 *
 * Mirrors `privacy-en.ts` entry for entry: the same rows, in the same order, with the Name column
 * left as the literal key. `privacy-parity.test.ts` fails when the two drift apart.
 */
import type { PrivacyContent } from './privacy-en'

export const privacyContent: PrivacyContent = {
  lastUpdated: '2026-11-05',
  intro: [
    '这一页列出本站在你浏览器里存放的每一样东西、为什么放、放多久。它同时覆盖 Cookie，以及适用同一套规则的浏览器存储。',
    '本站运行在 Code Time Tracker 上，任何人都可以自行部署。运营这个部署的人或组织是数据控制者：这一页描述的是软件本身的行为，而联系方式由运营方在「谁负责」一节中给出。',
  ],
  storageIntro: '下列内容全部是第一方存储：由本站写入，不来自广告或分析网络；也不共享、不出售。',
  storageHeaders: { name: '名称', store: '存放位置', purpose: '用途', lifetime: '保存时间', status: '是否需要同意' },
  statusLabels: { essential: '不需要 —— 严格必要', optional: '需要同意' },
  storage: [
    {
      name: 'ctt_refresh_token',
      kind: 'cookie',
      purpose: '两次访问之间保持登录。仅服务端读取，用来换发短期的访问令牌。',
      lifetime: '14 天，每次续期都会重新写入 —— 会话在使用中就持续顺延 —— 退出登录即删除',
      essential: true,
    },
    {
      name: 'XSRF-TOKEN',
      kind: 'cookie',
      purpose: '证明会改变状态的请求来自本站，而不是你恰好开着的其他页面。',
      lifetime: '直到浏览器会话结束',
      essential: true,
    },
    {
      name: 'ctt_access_token',
      kind: 'cookie',
      purpose: '短期凭据本身，由服务端写入，让请求能够标识你的会话。',
      lifetime: '15 分钟，每次续期更换',
      essential: true,
    },
    {
      name: 'ctt_access_token',
      kind: 'localStorage',
      purpose: '页面把同一枚访问令牌也存一份，方便附在请求上，刷新页面时不必多走一次。',
      lifetime: '15 分钟，每次续期更换',
      essential: true,
    },
    {
      name: 'ctt_oauth_state',
      kind: 'cookie',
      purpose: '开始 GitHub 登录时由服务端写入、返回时读回，用来拒绝不是这个浏览器发起的回调。',
      lifetime: '10 分钟，或登录完成即消费',
      essential: true,
    },
    {
      name: 'sidebar_state',
      kind: 'cookie',
      purpose: '侧边导航是展开还是收起，下次打开时保持一致。',
      lifetime: '7 天',
      essential: true,
    },
    {
      name: 'ctt_user_id, ctt_session',
      kind: 'localStorage',
      purpose: '记住这个浏览器登录的是哪个账号，让界面在第一个响应到达前就显示正确的形态。两者都不含凭据。',
      lifetime: '直到你退出登录',
      essential: true,
    },
    {
      name: 'ctt-device-id',
      kind: 'localStorage',
      purpose:
        '这个浏览器的一个随机标识，登录时随请求发送，让服务端能把那次登录当作一台设备列出并撤销。它不由你的硬件推导而来，退出登录也不会清除——清除本站数据才会删除。',
      lifetime: '直到你清除本站数据',
      essential: true,
    },
    {
      name: 'ctt.settings.sessions.bulk-cooldown',
      kind: 'sessionStorage',
      purpose: '仅在这个标签页内记住：服务端请你稍后再撤销更多会话，于是按钮在这段时间里保持禁用，而不是点了才报错。',
      lifetime: '直到标签页关闭，或服务端给的等待时间结束',
      essential: true,
    },
    {
      name: 'ctt.passkey-used',
      kind: 'localStorage',
      purpose: '记住这台机器上建立过或使用过通行密钥，登录页因此可以直接提供它。删除最后一把通行密钥时清除。',
      lifetime: '直到你删除最后一把通行密钥或清除本站数据',
      essential: true,
    },
    {
      name: 'vueuse-color-scheme, theme-appearance, ctt.motion',
      kind: 'localStorage',
      purpose: '你选择的亮色或暗色主题，以及是否减弱动效。仅此而已。',
      lifetime: '直到你修改或清除本站数据',
      essential: true,
    },
    {
      name: 'ctt.locale',
      kind: 'localStorage',
      purpose: '你选择的界面语言。',
      lifetime: '直到你修改或清除本站数据',
      essential: true,
    },
    {
      name: 'ctt.oauth-flow, oauth_redirect',
      kind: 'sessionStorage',
      purpose: '把一次 GitHub 登录限制在发起它的标签页内，别人发来的链接因此无法把你登进他的账号。',
      lifetime: '直到标签页关闭；登录完成即消费掉',
      essential: true,
    },
    {
      name: 'ctt_pending_verification_email',
      kind: 'sessionStorage',
      purpose: '记住验证邮件页面针对的是哪个地址，刷新该标签页时不至于丢失。',
      lifetime: '直到你离开该页面或关闭标签页',
      essential: true,
    },
  ],
  sections: [
    {
      id: 'no-tracking',
      title: '本站不做的事',
      paragraphs: [
        '当前版本没有分析统计、没有广告、没有联盟或社交跟踪，也没有会话录制。所有图标都随应用一起下发，没有页面会为图标去请求别的服务器。除下面提到的机器人验证之外，任何第三方脚本都不会运行；而它只在需要的页面加载。',
        '因为这里没有任何可选项，所以你不会看到同意横幅。这是设计的结果，不是凭空的豁免：将来若要加入测量或营销类存储，必须先在你同意之后才允许加载。',
      ],
    },
    {
      id: 'who-is-responsible',
      title: '谁负责',
      paragraphs: [
        '这个部署的运营方决定你的数据如何处理。如果你自己部署，那就是你自己。',
        '本项目在 github.com/AhogeK/ctt-web 公开代码与问题追踪；自部署方应在此处写明自己的联系地址。与账号有关的请求（查询、更正、删除）应发给为你提供服务的运营方。',
      ],
    },
    {
      id: 'third-parties',
      title: '会看到你请求的第三方',
      paragraphs: [
        'hCaptcha 会在登录、注册与找回密码页面运行一次验证，用于阻止自动化的凭据猜测。它会看到请求的 IP 地址与它自己收集的验证信号，并可能写入自己的存储。这些数据由它作为处理者、按其服务的标准数据处理条款处理，该条款包含欧盟与英国的传输保障；除此之外它不获取你的任何信息。它是本站唯一加载的第三方代码；运营方不配置站点密钥时，它根本不会加载。',
        '用 GitHub 登录是一次普通的跳转：GitHub 在自己的站点上完成身份验证，遵循它自己的隐私政策，然后把访问令牌与 GitHub 用户名交回本站。这些页面上不运行任何 GitHub 脚本。',
      ],
    },
    {
      id: 'your-controls',
      title: '你可以做什么',
      paragraphs: [
        '在「设置 → 安全 → 数据导出」导出本站持有的全部数据，得到一个 JSON 文件。',
        '在「设置 → 个人资料」修改显示名或密码；在同一页的「危险区」删除账号及与之关联的一切。在「设置 → 安全」撤销单个会话或全部会话。',
        '撤回同意等同于离开：退出登录会在服务端结束该会话，清除浏览器中本站数据会移除上文列出的本地存储；删除账号会移除记录本身。',
      ],
    },
    {
      id: 'retention',
      title: '记录保留多久',
      paragraphs: [
        '刷新 Cookie 让一次会话保持 14 天，且每次续期都会重新写入，因此正在使用的会话会持续顺延。服务端为这枚 Cookie 保存的记录，在停止使用后最多保留 30 天。访问令牌只有 15 分钟。登录记录列在「设置 → 安全」，可在那里撤销；删除账号会一并移除。',
        '部署运营方可能像任何托管服务一样保留一定期限的备份。若你需要书面确认，请向他们询问该期限。',
      ],
    },
    {
      id: 'security',
      title: '这些存储如何被保护',
      paragraphs: [
        '刷新令牌是 httpOnly、Secure、SameSite=Strict 的 Cookie，且路径只到刷新端点：页面上的脚本读不到它。CSRF 令牌按设计可被脚本读取 —— 页面必须把它回传 —— 它与你的身份信息无关。',
        '生产环境必须通过 HTTPS 提供本站；刷新 Cookie 标记为 Secure，因此永远不会在明文连接上发送。',
      ],
    },
    {
      id: 'changes',
      title: '这一页什么时候会变',
      paragraphs: [
        '存储清单变动时，页面顶部的日期会更新。实质性变化会在生效前在界面中告知；若变化涉及新增可选的存储，它会带着选择出现，而不是一个已经打开的横幅。',
      ],
    },
  ],
  contact: '',
  disclaimer: '本说明描述的是软件行为，不构成法律意见：公开部署的运营方应就适用于自己的法律请专业顾问复核。',
}
