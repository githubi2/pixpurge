# PixPurge 前端 — 项目规则（AGENTS.md）

> 本文件是 PixPurge 前端（pixpurge.com）开发的唯一规则来源。所有新增/修改必须遵循以下约定。
> 规则归纳自仓库现状代码（index.html + images/ + robots.txt + sitemap.xml），**以代码为事实来源**；如与本文件冲突，以代码为准并同步更新本文件。

---

## 1. 项目概述

- **产品**：PixPurge — 免费的 AI 图片文字移除工具（text remover from image），落地页 + 内嵌工具 UI。
- **⚠️ 语言铁律：本站点为英文项目（English-first）**。所有用户可见文案（UI 文本、菜单、toast、表单标签/占位符、错误提示、邮件模板等）必须为**英文**；即使用户用中文提出需求/反馈，写进页面的文案仍须输出英文。后端返回的中文错误信息需在前端映射为英文展示（见 index.html 中 apiPost 的 ERROR_MAP，新增错误码需同步补充映射）。
- **域**：https://pixpurge.com/
- **形态**：纯静态单页站，**无构建工具、无框架、无 package.json**。
  - `index.html` — 单文件承载全部 HTML + CSS（`<style>`）+ JS（`<script>`），约 1500 行
  - `images/` — logo.svg、before/after.jpg、audience-*.jpg、avatar-*.jpg、og-image.jpg
  - `robots.txt`、`sitemap.xml` — SEO 附属（仅首页）
- **技术栈**：Tailwind CSS **CDN**（`https://cdn.tailwindcss.com`，生产版）+ 页面内 `tailwind.config` 主题扩展 + 原生 JS（零依赖）+ Google Fonts（Space Grotesk / DM Sans）。
- **工具区现状（真实 AI，双模型档位）**：
  - **SELECT MODEL 分段选择器**（工具卡顶部，常显）：`Standard`（wanx2.1-imageedit，异步轮询）/ `Advanced`（qwen-image-2.0-pro，同步 multimodal）。点击切换选中态（`selectedTier` 变量），请求体带 `tier: "standard"|"advanced"`（后端 `site-image-edit` 按档位选模型，advanced 走 `getByModelKey("qwen-image-2.0-pro")`，同步接口直接返回结果图 URL，免轮询）。
  - **需求输入框驱动**：右栏面板底部**胶囊输入条**（橘色主题：`bg-coral-light` 描边 `border-coral`、文字 `text-coral`、圆形发送按钮 `bg-coral` 白箭头），用户输入需求 → 提示词**原样直发模型**（`remove_watermark`，mask 恒 null）；支持回车发送（Enter 监听）与底部一键 `Remove Text`（默认提示词 `Remove the text from the image.`，点击自动插聊天记录）。
  - **聊天记录区**（右栏面板中部）：用户气泡（右，coral-light）+ `✓✓ Done`/错误行（左），`appendChat(text, kind)` 追加并自动滚底；换图清空。
  - **一键 Remove Text**（底部操作区）：主 CTA 样式，登录守卫 + 默认去字提示词直发。
  - **设置页**（`settings.html` **独立页面**，菜单 ⚙ Settings 点击跳转；`noindex, nofollow`）：Account（账户卡=首字母头像+邮箱+当日额度徽章；Language 只读 English；Sign Out）/ Billing（每日 20 张 + 今日使用进度条）/ Order History（Date/Plan/Amount/Status 表格，免费产品显示空态）；tab 用 `.settings-tab`；未登录访问显示登录提示。
  - **登录守卫**：所有触发 AI 的入口（Send/一键按钮）点击时未登录 → 弹登录框 + inlineHint，不触发计费。
  - **512px 保底**：`prepareImageForAI` 对宽/高 <512 的图片等比放大到 ≥512（wanx 下限要求）；≤4096 上限。
  - 提示反馈：工具区用图片下方内联提示 `#inlineHint`（4s 自动淡出），全局 toast 仅登录/菜单场景；**配色铁律见 2.4**。
- 修改后**没有构建步骤**：改完直接刷新浏览器验证即可。

## 2. 设计系统（唯一来源：index.html 的 tailwind.config + <style>）

### 2.1 颜色 tokens（Tailwind 扩展类名，禁止硬编码色值；辅助色如 #F59E0B 星星除外）

| token | 值 | 用途 |
|---|---|---|
| `ink` / `ink-soft` / `ink-muted` | #0F172A / #334155 / #64748B | 标题 / 正文 / 弱化文字 |
| `paper` / `paper-warm` | #FAFAF9 / #F5F3F0 | 页面背景 / 悬停暖底 |
| `surface` | #FFFFFF | 卡片、工具面板 |
| `coral` / `coral-hover` / `coral-light` | #EA580C / #C2410C / #FFF7ED | **品牌主色**：CTA、eyebrow、选中态、高亮 |
| `teal` / `teal-light` | #0F766E / #F0FDFA | 成功态、"After"标识、次要强调 |
| `amber` | #D97706 | 星级/强调 |
| `violet` / `violet-light` | #6D28D9 / #F5F3FF | 分类强调 |
| `line` / `line-soft` | #E7E5E4 / #F1EFEE | 边框分隔 |

### 2.2 字体与排版

- display = **Space Grotesk**（标题、品牌名、大数字）；body = **DM Sans**（正文）。
- `<body>` 基类固定：`font-body text-ink-soft bg-paper leading-relaxed overflow-x-hidden antialiased`。
- **H1（hero）**：`font-display font-bold text-ink leading-[1.08] tracking-[-0.025em] text-[32px] sm:text-[42px] lg:text-[46px]`
- **H2（section 标题）**：`font-display font-bold text-ink text-[28px] sm:text-[36px] lg:text-[40px] leading-[1.15] tracking-[-0.015em]`
- **eyebrow（区块小标）**：`inline-block text-[13px] font-bold tracking-[0.08em] uppercase text-coral`
- **section 描述**：`text-[17px] text-ink-muted leading-[1.7]`，居中对齐区块宽 `max-w-[680px] mx-auto`
- **卡片正文**：`text-[14.5px] text-ink-muted leading-[1.65]`（卡片标题 H3：`font-display text-lg font-semibold text-ink`）
- **面板小标**：`text-xs font-bold uppercase tracking-[0.06em] text-ink-muted`
- **pill/徽章**：`text-xs font-semibold text-coral bg-coral-light px-2.5 py-1 rounded-full`

### 2.3 布局节奏

- 容器：`max-w-site mx-auto px-4 sm:px-6`（site = 1200px）
- **页面页眉（页面级 H1+描述，铁律：左对齐）**：`<h1 class="font-display text-[28px] sm:text-[34px] font-bold text-ink tracking-[-0.015em]">` + 描述 `text-[14.5px] text-ink-muted mt-1.5`，**块内靠左排列（禁止 text-center）**——settings.html / creations.html 等独立页页眉一律左对齐，与 My Creations 页一致（tab/工具栏行可居中或左右分布，但页眉必须左对齐）。
- section 纵向节奏：`py-16 sm:py-24`；嵌套标题块 `mb-12 sm:mb-14`。
- 背景交替制造分层：`bg-surface border-y border-line-soft`（How It Works / Examples / Who It's For / FAQ），纯 `bg-paper` 的区块不需边框。
- section 顺序与 id：hero(`#upload`) → stats → how-it-works → use-cases → examples → who-its-for → why → reviews → faq → CTA → footer。
- 响应式断点用 Tailwind 默认：sm 640 / md 768 / lg 1024。

### 2.4 组件模式（新 UI 必须复用这些类组合）

- **主 CTA 按钮**：`inline-flex items-center justify-center gap-2 font-semibold text-[15px] px-7 py-3 rounded-xl bg-coral text-white shadow-cta hover:bg-coral-hover hover:shadow-cta-hover hover:-translate-y-px transition-all`（大 CTA 用 `text-base px-9 py-4 rounded-[10px]`）
- **次级/描边按钮**：`border-[1.5px] border-line text-ink bg-surface hover:bg-paper-warm transition-all`
- **图标块**：`w-12 h-12 rounded-xl bg-{coral|teal|violet}-light text-{coral|teal|violet} flex items-center justify-center`（stats 用 `w-11 h-11 rounded-xl`）——图标 `w-6 h-6`（stats `w-[22px]`）
- **卡片**：`bg-surface border border-line-soft rounded-card p-7 sm:p-8 hover:-translate-y-1 hover:shadow-lift transition-all duration-300`（小卡 `p-6`、无 hover 用 `transition-colors`）；hover 时 `hover:border-line`
- **顶部色条装饰**（use-cases）：卡片内 `absolute top-0 left-0 right-0 h-[3px] bg-{color} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300`
- **图标**：全部**内联 SVG**，24 视口，`stroke="currentColor"` + `stroke-width="2"`（强调处 2.5），`fill="none"` + `stroke-linecap/linejoin="round"`（Feather/Lucide 风格）。来源优先 Feather 图标集。**同级/同组图标必须统一形态（一律空心描边）**：菜单列表、按钮组、tab 行、卡片操作图标等不得混用实心/空心——实心（`fill="currentColor"`）仅用于明确需要强调的独立图标（如状态徽章），且周围上下文一致。
- **before/after 滑块组件**：复用 `.ba-container/.ba-img/.ba-after/.ba-divider/.ba-handle/.ba-label` + `initBASlider(containerId, afterImgId, dividerId, handleId, autoOscillate)`；容器需 `aspect-ratio: 3/2`。
- **section 头部**：eyebrow + H2 + 描述，全部居中（如 How It Works / Use Cases / Examples / FAQ）。
- **装饰光斑**：`pointer-events-none absolute ... rounded-full` + 内联 `radial-gradient`（coral/teal 低透明度 0.05–0.14）。
- 工具卡（右上）：`bg-surface rounded-2xl shadow-hero border border-line-soft`；**模型档位分段选择器**（顶部常显）：容器 `inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-paper-warm border border-line-soft`，选中项 `bg-coral text-white shadow-sm`，未选 `text-ink-muted hover:text-ink`（`.mode-tier`，`data-tier="standard"|"advanced"`）；设置页 tab 同款（`.settings-tab`，`data-stab`）。
- **toast/提示反馈（配色铁律）**：必须橘色主题，禁止黑色/深色底——普通提示 `rgba(234,88,12,0.14)` 半透明底 + `#C2410C` 深橘字 + `rgba(234,88,12,0.28)` 橘色描边 + backdrop-blur（见 `.toast`）；错误态 `rgba(234,88,12,0.92)` 实橘底白字（`.toast-error`）；所有新提示/错误/状态反馈 UI 必须与全站 coral 主题配色一致，不得引入黑色/深色、蓝色（teal 仅用于成功态）等其他色系作为主调。

## 3. 代码风格

### 3.1 HTML

- 2 空格缩进；属性双引号；分区注释 `<!-- ===== Navbar ===== -->`。
- 语义标签（`nav/section/figure/figcaption/footer`）；图片必须带 `alt`（嵌 SEO 关键词）+ 非首屏图加 `loading="lazy"`；图标按钮加 `aria-label`。
- 交互数据用 `data-*` 属性（`data-mode`、`data-sample`、`data-name`）。
- 内联 `onclick` 仅用于极简全局函数（toggleMobileNav / openModal / closeModal / switchModal / openSettingsPage / closeSettingsPage / openWorksModal / logoutSite / handleLogin / handleSignup）；其余一律 `addEventListener`。
- 新页面/区块以 `<section id="kebab-case">` 组织，锚点 id 供导航与 SEO 内链使用。
- 占位链接（尚未实现的功能页）用 `href="#"`。

### 3.2 CSS

- 优先 Tailwind 原子类；只有 Tailwind 表达不了的（keyframes、clip-path 控件、mask、特殊伪元素）才写进 `<style>`。
- `<style>` 内按功能分区注释：`/* ===== Before/After Slider ===== */`，类名 kebab-case：`.ba-container` `.mode-tab` `.faq-q` `.hl-box` `.shimmer` `.marquee`。
- 过渡统一 `transition-all duration-300`（细节 200ms / 0.2s）；动画时长 0.25–0.35s（模态 250ms、FAQ 350ms）。
- **必须保留** `prefers-reduced-motion` 全局降级块（animation/transition 0.01ms）。
- 悬停/拖拽态：`.dropzone:hover` 描边 `0 0 0 1px #EA580C` + 阴影；`.dragover` 转 `border-coral bg-coral-light scale(1.01)`。

### 3.3 JavaScript

- 原生 ES5+/ES6 混合：`const/let` + `function(){}`（**不用**箭头函数、不用模板字符串，字符串用 `+` 拼接）、行尾分号、2 空格缩进、单引号。
- IIFE 模块化；全局暴露的函数仅限内联 onclick 所需。
- 元素引用统一 `document.getElementById(...)` 收集到模块顶部常量区。
- **动画驱动惯例（重要）**：rAF + `setInterval` 双驱动，位置是"真实流逝时间的纯函数"；配合 `IntersectionObserver` 只动画可视区；子像素变化跳过写入（`Math.abs(x-lastX) < 0.05 return`）。原因：内嵌预览/降速环境会挂起 rAF——注释里要写清"为什么"。
- **状态机模式**（工具/多步交互）：`let state = 'idle'` + 集中式 `setState(next)` 切换 `hidden/flex` 类；异步用 `runId` 递增守卫过期回调。
- 注释风格：英文注释、ASCII 分隔线（`// ===== Section =====`）、解释动机（为什么这样做）而非复述代码；模拟/待接入处标 `// TODO(backend):`。
- 降级意识：任何新交互都要考虑 rAF 被挂起 / clipboard API 被禁 / IntersectionObserver 不存在的环境，带 `if ('X' in window)` 判断与兜底。

## 4. SEO 规则（首页已全量实现，新页面照抄）

1. 唯一 `<title>`：`Page 主关键词 — 关键词 | PixPurge`。
2. `meta description`（关键词开头）、`keywords`、`robots index, follow`。
3. `canonical` = 绝对 URL（`https://pixpurge.com/...`）。
4. OG + Twitter 卡片完整（title/description/url/site_name/image）。
5. **JSON-LD**：SoftwareApplication（含 offers/rating/featureList）+ FAQPage，FAQ 内容与页面 FAQ 区块保持一致。
6. `theme-color` #EA580C；favicon = `images/logo.svg`。
7. `robots.txt`（Allow / + Sitemap）与 `sitemap.xml`（loc/lastmod/changefreq/priority）——新增页面需同步更新 sitemap。
8. 图片 alt 与内链锚文本嵌目标关键词；站内链接一律相对路径 `images/...`。

## 5. 工作流约定

- 无构建：直接编辑 `index.html`，改动后浏览器刷新实测（交互改动需实际点击/拖拽验证，不只截图）。
- 提交信息：`feat:` / `fix:` / `chore:` 前缀（仓库现状：Initial commit / chore: remove unused dev files）。
- 新图片进 `images/`，文件名小写连字符（如 `audience-ecommerce.jpg`），保持 alt 描述带关键词。
- 新功能默认先本地验证、经确认后再提交（用户偏好：不擅自发布）。
- **严格按需求执行（铁律）**：只实现用户明确要求的内容，**禁止擅自加戏**——不添加需求外的提示语（toast/hint）、弹窗、按钮行为、图标或装饰文案；用户只说"改为某种样式/占位"时，仅按要求呈现视觉，不自行设计交互。拿不准时先问，不替用户做决定。
