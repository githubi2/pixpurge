# PixPurge 前端 — 项目规则（AGENTS.md）

> 本文件是 PixPurge 前端（pixpurge.com）开发的唯一规则来源。所有新增/修改必须遵循以下约定。
> 规则归纳自仓库现状代码（index.html + images/ + robots.txt + sitemap.xml），**以代码为事实来源**；如与本文件冲突，以代码为准并同步更新本文件。

---

## 1. 项目概述

- **产品**：PixPurge — 免费的 AI 图片文字移除工具（text remover from image），落地页 + 内嵌工具 UI。
- **⚠️ 语言铁律：本站点为英文项目（English-first）**。所有用户可见文案（UI 文本、菜单、toast、表单标签/占位符、错误提示、邮件模板等）必须为**英文**；即使用户用中文提出需求/反馈，写进页面的文案仍须输出英文。后端返回的中文错误信息需在前端映射为英文展示（见 index.html 中 apiPost 的 ERROR_MAP，新增错误码需同步补充映射）。
- **域**：https://pixpurge.com/
- **形态**：纯静态站，**无框架**。样式由 Tailwind CSS **V4 CLI 构建期生成**：`css/theme.css`（@theme 源 + @source）→ `css/tailwind.css`（minified 产物，**提交进仓库**，全站共用）；`package.json` 仅含 devDependency（tailwindcss）。
  - `index.html` — 单文件承载全部 HTML + CSS（`<style>`）+ JS（`<script>`），约 1800 行
  - `images/` — logo.svg、before/after.jpg、audience-*.jpg、avatar-*.jpg、og-image.jpg
  - `copy-text-from-image/`、`remove-watermark-from-image/` — **SEO 词页目录**（各含 index.html；2026-09-16 起词页统一目录形态，旧 .html URL 301 → 目录 URL，见 §4 第 9 条）
  - `robots.txt`、`sitemap.xml` — SEO 附属（sitemap 收录 6 条 URL：index/pricing/terms/privacy + 词页目录 `/remove-watermark-from-image/`、`/copy-text-from-image/`）
- **技术栈**：Tailwind CSS **V4 CLI 构建期静态 CSS**（`npm run css` 生成 `css/tailwind.css`；token 全量定义在 `css/theme.css` 的 `@theme` 块，与 2.1 表一致）+ 原生 JS（零依赖）+ Google Fonts（Space Grotesk / DM Sans）。
- **工具区现状（真实 AI，仅千问单模型；2026-09-11：窗口模式上线 + 档位/模式分段隐藏）**：
  - **SELECT MODEL 分段选择器（2026-09-11 起整块隐藏，全站固定千问）**：视觉上整块加 `hidden`（按钮/事件代码保留，后续接新模型时恢复此块并同步档位逻辑）。**请求层已硬编码 `tier:'standard'` → `qwen-image-2.0-pro`**（`runAiEdit` / `runWindowEdit` 两处）；**勿改回 `selectedTier`（防误用 sd5/seedream）**。评测结论（2026-09-11）：sd5 慢（~55s）且不吃 mask 图；Advanced 档停用。
  - **右栏控制面板（参考图2 全复刻；2026-09-16 布局定稿）**：自上而下＝**ZOOM 行**（[−][拖动条 `#zoomRange`][＋][移动]，悬停提示 `#zoomTip`）→ Selection Tools 三键（Brush/Box/Circle）+ 笔刷条（±/滑条 3–24/Clear）→ **Edit History**（[Undo][Redo]）→ Reset/Remove → Clear All Text。Manual/AI 分段（`.panel-mode`）与 Auto Removal 六开关＝历史遗留隐藏代码，勿复原勿启用。**旧聊天输入框/聊天记录/Send 已删除——勿复原**（与下方 2026-09-16 的 Prompt 模块无关，勿混）。
  - **~~AI 模式＝开关即时执行~~（作废 2026-09-11）**：原 Auto Removal 六开关即时执行逻辑（`Remove the <cat> from the image.`）随开关块**物理删除**；产品聚焦 = Clear All Text（全局一键）+ 窗口模式（手动）。
  - **手动模式（涂抹/框选/圈选）＝窗口模式（2026-09-11 改版）**：图上绘制 → `#brushCanvas` 橘色标记（坐标存原图系、object-contain 自动换算；退化标记自动丢弃）→ 有标记时 `Remove` 点亮 → 点击走**窗口模式**：标记 bbox + 边距（短边 20%，clamp 64–480px；最小窗口 256px）裁剪成窗口 → **只把窗口小块**发千问（`mode:'auto'`、`tier:'standard'`、`WINDOW_EDIT_PROMPT`——窗口通道实测选定提示词，勿随意改）→ 结果贴回原图（前端 canvas；千问结果 URL 带 `ACAO:*`，用 `crossOrigin='anonymous'` 读入；贴回底=当前编辑图）。**窗外像素零改动（构造保证）；同类泛化被限制在窗口内；窗口必须罩住要处理的内容（切到字形会留半截）**。旧 mask 双图通道留存备用（`MANUAL_EDIT_PROMPT` + `buildMaskDataURL`，当前不调用）。标记生命周期：Clear/Reset/换图/处理成功后清空，失败保留可重试。
    - **画布重绘铁律**：图片区是 `flex-1`——提示条/工具栏等出现会改变其高度，**任何布局变化必须让标记画布按新尺寸重绘**（`ResizeObserver(origWrap)` + `MutationObserver(#inlineHint)` + `window resize` 三保险），否则笔迹被拉伸错位（2026-09-11 实测 bug）。另：`showInlineHint` 与工具逻辑不在同一作用域，**禁止从其直接调用内部函数**（会 ReferenceError），用观察者/事件桥接。
    - **操作行固定高度铁律（2026-09-11）**：#toolActions 桌面端（sm+）固定 `sm:min-h-[78px]`——uploaded/processing/completed 切换按钮（Remove Text / Download+Copy / 仅 Try another）显隐时行高不得塌陷（否则整个工具卡高度波动、图片区与页面下方一起抖动）。调整行内按钮尺寸（py/图标）时须同步复核此值。
  - **一键 Remove Text**（底部操作区，仅 uploaded 态显示）：主 CTA；**有涂抹标记时标记优先**（走窗口模式、只处理标记窗口），无标记时才全局自动去字（`Remove the text from the image.`，auto 通道）。教训（2026-09-11 实测 bug）：此前无标记判断，用户涂抹后点它会发出 `mask:null` 的全局 auto 请求 → 全图文字被清（"我只涂了A为什么全清"类投诉，经后端请求日志铁证）。**铁律：底部按钮在存在标记时不得静默执行全局操作**。（类别开关已删除——该悬念作废。）
  - **面板 Clear All Text（2026-09-11 新增）**：右栏底部、Reset/Remove 行下方**全宽按钮**（三按钮一行放不下 → 同区块第二行）。**一键全图清除所有文本——不依赖标记，有标记也全图**（显式全局操作；与底部 Remove Text 的"标记优先"不同，不违反静默铁律）。守卫：uploaded/completed 态 + requireLogin；processing 点击忽略（防并发计费）。请求＝auto 通道 `Remove the text from the image.`（tier standard → 千问）。配套：runAiEdit 成功回调的标记清理由 `mode==='manual'` 放宽为**一律 clearMarks()**（防全局清完后残留旧标记）。
  - **图片缩放/平移（2026-09-16 新增）**：`#viewStage` **布局式缩放**（尺寸变化，非 transform——画笔/框选坐标天然兼容），7 档 100%→400%；平移＝`translate3d` + rAF 合并 + 缓存边界 clamp；100% 移动键置灰、缩回自动退出移动模式；换图/重置回 100%；控件在面板 ZOOM 行。悬停提示必须橘色配方（`bg-coral/10`+`border-coral/25`+`text-coral-hover`）。手机端图片区高度贴合宽高比（下限 220px、上限 72vh）。
  - **Edit History＝撤销/重做（2026-09-16 移入面板）**：栈只记录**图片处理版本**（上传初始版 + 每次处理结果），**不含涂抹标记**——文案需划清范围（节标题 EDIT HISTORY；Undo≠撤销涂抹、Redo≠重新处理）。原位置图片标题行右角（用户反馈"根本不知道"）已撤。
  - **Prompt 模块（2026-09-16 用户需求）**：面板下方**独立卡**＝节标题 + 输入框 `#promptInput` + 4 条建议文案（`.prompt-chip` 点击**自动填入不执行**）+ Run Prompt（`#btnRunPrompt` 空输入置灰）+ 5 per image 注记。守卫：uploaded/completed 态 + requireLogin + processing 忽略（防并发计费）；请求＝auto 通道携带**用户提示词**（tier standard→千问，后端零改动）。右栏＝flex 列含 [autoPanel, promptPanel]——**autoPanel 不得加 `self-start`**（flex 列中会缩宽度，已踩坑）。
  - **hero 高度冻结（2026-09-16）**：未上传时记录工具卡行高（`idleHeroH`），编辑态钉 `min-height`、回 idle 解除（≥1024px 生效；<1024px 解除保手机聚焦）——防上传后整块变矮、下方跳动。
  - **设置页**（`settings.html` **独立页面**，菜单 ⚙ Settings 点击跳转；`noindex, nofollow`）：Account（账户卡=首字母头像+邮箱+当日额度徽章；Language 只读 English；Sign Out）/ Billing（每日 20 张 + 今日使用进度条）/ Order History（Date/Plan/Amount/Status 表格，免费产品显示空态）；tab 用 `.settings-tab`；未登录访问显示登录提示。
  - **登录守卫**：一切触发 AI 的入口（手动 Remove / 一键 Remove Text / 面板 Clear All Text / **Prompt 模块 Run Prompt**）未登录 → 跳登录页（requireLogin → login.html），不触发计费。
  - **512px 保底**：`prepareImageForAI` 对宽/高 <512 的图片等比放大到 ≥512（wanx 下限要求）；≤4096 上限。
  - 提示反馈：工具区用图片下方内联提示 `#inlineHint`（4s 自动淡出）；**全站禁 toast（永久铁律，见 2.4）**；**配色铁律见 2.4**。
  - **Copy Text from Image 页（2026-09-16 新增，目录形态 `/copy-text-from-image/`）**：`copy-text-from-image/index.html` — 独立工具页（页内 OCR：上传→提取→复制文本）。走后端 `POST /api/v1/site/text-extract`；计费档 `text_extract` = **qwen3.5-omni-flash**（compatible-mode），**1 积分/次**、共用每日额度；未登录跳登录页（requireLogin）；复制＝clipboard + **手动复制兜底弹窗**（测试环境剪贴板常被禁）；反馈用页内 inlineHint（禁 toast 铁律照旧）；首页 More Tools 第三卡入口；与 `remove-watermark-from-image/index.html` 同模板。发布 2026-09-16（生产 E2E 已实测：注册→提取 3.4s→扣 1 分）。**提示条不推挤布局（2026-09-16 修）**：hint 用固定占位槽 `.hint-slot`（min-height 42px）+ 只切 `.show`，出现/淡出零位移（此前硬插入布局，点 Copy 时按钮行被挤下去产生顿挫感，用户点名返工）。
- **样式改动**：改 `css/theme.css`（token）或页面类名后，必须运行 `npm run css` 重新构建再刷新浏览器验证（*任何情况下不得回退到 CDN 方式*）。

## 2. 设计系统（唯一来源：css/theme.css 的 @theme + 页面 <style>）

### 2.1 颜色 tokens（Tailwind 扩展类名，禁止硬编码色值；辅助色如 #F59E0B 星星除外）

| token | 值 | 用途 |
|---|---|---|
| `ink` / `ink-soft` / `ink-muted` | #0F172A / #334155 / #64748B | 标题 / 正文 / 弱化文字 |
| `paper` / `paper-warm` | #FAFAF9 / #F5F3F0 | 页面背景 / 悬停暖底 |
| `surface` | #FFFFFF | 卡片、工具面板 |
| `coral` / `coral-hover` / `coral-light` | #EA580C / #C2410C / #FFF7ED | **品牌主色**：CTA、eyebrow、选中态、高亮 |
| `teal` / `teal-light` | #0F766E / #F0FDFA | 成功态、"After"标识、次要强调 |
| `amber` / `amber-light` | #D97706 / #FFFBEB | 星级/强调 |
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
- **词页内链区块 = 首页 More Tools 模板（2026-09-16 统一，铁律）**：词页（`/copy-text-from-image/`、`/remove-watermark-from-image/`）的 `#more-tools` 内链区块固定在 **hero 之后、How It Works 之前（第 2 区块，与首页同位）**；外壳与首页逐项一致：eyebrow `More Tools` + 首页同款 H2/描述；网格 `grid sm:grid-cols-3 gap-5 max-w-[1000px] mx-auto`；3 卡＝该页之外的另两个工具 + Pricing（禁止自链）；卡片配色按首页功能色：copy=紫 / watermark=橘 / pricing=青、Remove Text 卡=橘。三页该区块必须一致（位置/命名/网格/配色），改一处须核对另两处。
- 响应式断点用 Tailwind 默认：sm 640 / md 768 / lg 1024。

### 2.4 组件模式（新 UI 必须复用这些类组合）

- **主 CTA 按钮**：`inline-flex items-center justify-center gap-2 font-semibold text-[15px] px-7 py-3 rounded-xl bg-coral text-white shadow-cta hover:bg-coral-hover hover:shadow-cta-hover hover:-translate-y-px transition-all`（大 CTA 用 `text-base px-9 py-4 rounded-[10px]`）
- **次级/描边按钮**：`border-[1.5px] border-line text-ink bg-surface hover:bg-paper-warm transition-all`
- **图标块**：`w-12 h-12 rounded-xl bg-{coral|teal|violet}-light text-{coral|teal|violet} flex items-center justify-center`（stats 用 `w-11 h-11 rounded-xl`）——图标 `w-6 h-6`（stats `w-[22px]`）
- **卡片**：`bg-surface border border-line-soft rounded-card p-7 sm:p-8 hover:-translate-y-1 hover:shadow-lift transition-all duration-300`（小卡 `p-6`、无 hover 用 `transition-colors`）；hover 时 `hover:border-line`
- **顶部色条装饰**（use-cases）：卡片内 `absolute top-0 left-0 right-0 h-[3px] bg-{color} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300`
- **图标**：全部**内联 SVG**，24 视口，`stroke="currentColor"` + `stroke-width="2"`（强调处 2.5），`fill="none"` + `stroke-linecap/linejoin="round"`（Feather/Lucide 风格）。来源优先 Feather 图标集。**同级/同组图标必须统一形态（一律空心描边）**：菜单列表、按钮组、tab 行、卡片操作图标等不得混用实心/空心——实心（`fill="currentColor"`）仅用于明确需要强调的独立图标（如状态徽章），且周围上下文一致。
- **before/after 滑块组件**：复用 `.ba-container/.ba-img/.ba-after/.ba-divider/.ba-handle/.ba-label` + `initBASlider(containerId, afterImgId, dividerId, handleId, autoOscillate)`；容器需 `aspect-ratio: 3/2`。**交互定稿（2026-09-16）**：自动扫动 + 鼠标悬停图片区立即跟随（免按压）、移出后相位重锚恢复（不跳变、保留行进方向）；标签文案统一 Before/After；`.ba-label` 的 z-index(7) 必须高于分割线(5)/手柄(6)——扫过时线从标签下方穿过、不遮标签；手柄 34px 品牌橘 `#EA580C` + 白色 ‹›（箭头间距 6 单位）；杆/手柄位移写 `transform: translate3d`（禁写 `left%`，防每帧布局）。
- **section 头部**：eyebrow + H2 + 描述，全部居中（如 How It Works / Use Cases / Examples / FAQ）。
- **装饰光斑**：`pointer-events-none absolute ... rounded-full` + 内联 `radial-gradient`（coral/teal 低透明度 0.05–0.14）。
- 工具卡（右上）：`bg-surface rounded-2xl shadow-hero border border-line-soft`；**模型档位分段选择器**（**2026-09-11 起整块隐藏——全站固定千问，勿恢复为可见**）：容器 `inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-paper-warm border border-line-soft`，选中项 `bg-coral text-white shadow-sm`，未选 `text-ink-muted hover:text-ink`（`.mode-tier`，`data-tier="standard"|"advanced"`）；设置页 tab 同款（`.settings-tab`，`data-stab`）。
- **提示反馈（禁止 toast，永久铁律）**：**任何情况下都不得新增/恢复 toast**（含全局 toast、浮动消息、自动消失式弹窗提示——用户已明确「后续也不要加任何 toast」）；所有提示/错误/状态反馈一律用页面内联元素：工具区用图片下方内联提示 `#inlineHint`（橘色主题：`rgba(234,88,12,0.10)` 底 + `#C2410C` 字 + 橘描边，见 `.inline-hint`，4s 自动淡出），非工具区用页面内嵌状态行/区块。新增反馈 UI 必须橘色主题（禁黑色/深色底，teal 仅成功态）。**提示不得推挤布局（铁律，2026-09-16）**：内联提示必须落在固定占位槽/浮层里（如 `.hint-slot`），出现/淡出只切 `visibility`/`opacity`——绝不改变布局（曾把按钮行挤下去产生顿挫感，用户点名返工）。
- **pricing 三卡（登录态定价方案）**：三列卡，**默认统一品牌主题色 coral**（复用 2.1 token，**禁止自造主题色、禁止参考图三色卡/红色**）；**theme 字段已生效**：后台 `site_pricing_plan.theme` 驱动对应卡强调色（`coral`→橙 / `violet`→紫 VIOLET_THEME / `teal`→青 TEAL_THEME，前端 `THEME_MAP` 三映射，键名对齐后端字段），当前数据默认全 coral；顶部徽章骑卡顶居中（`absolute -top-3.5 left-1/2 -translate-x-1/2` + `bg-coral` 白字）；CTA 按钮 `bg-coral hover:bg-coral-hover`；套餐行白底圆角（普通行 `border-line-soft`；**选中行带 badge**：`border-2 border-coral` + 骑顶徽章 + 价格 `text-coral`——与主题一致；violet/teal 主题下选中行由 `selBorder/selBg/selPrice` 类驱动，游客面板选中态 CSS 已限定 `.plan-pkg-list` 范围）；折扣徽章（-50%/-54%）`bg-coral-hover` 深橘区分；行内折扣 pill（onetime）=`bg-coral-light text-coral-hover`；年票一次性奖金框 `bg-amber-light text-amber`；底部高亮框 `bg-coral-light text-coral`。数据来自后端 `GET /api/v1/site/pricing`（后台可配置，theme 字段 coral/violet/teal 三选），页面内置静态兜底三卡。

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
- **动画驱动惯例（重要；2026-09-16 修订）**：**单驱动**——rAF 存活时它是唯一写者（写入落在绘制帧内）；`setInterval` 只做看门狗（rAF 停摆 >250ms 才接管，16ms 节拍），**禁双驱动同时写**（两驱动交错写样式＝微抖，ba-slider 实测教训）。位置是"真实流逝时间的纯函数"（可加每元素相位偏移）；配合 `IntersectionObserver` 只动画可视区；子像素变化跳过写入（`Math.abs(x-lastX) < 0.05 return`）；动画位移用 `transform` + `will-change`（合成器路径，禁逐帧写 left/宽高）。原因：内嵌预览/降速环境会挂起 rAF——注释里要写清"为什么"。
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
8. 图片 alt 与内链锚文本嵌目标关键词；站内链接一律相对路径（根级页面 `images/...`；**目录页带 `../` 前缀——含 JS 内 `location.href` 字符串**）。
9. **SEO 词页目录形态（2026-09-16 起，铁律 · R4.1 落地）**：每个 SEO 关键词落地页 = **独立目录 + index.html**（URL `/slug/`；canonical / 内链 / sitemap 一律尾斜杠形态；禁止再新增 `.html` 词页）。已迁移 `/copy-text-from-image/`、`/remove-watermark-from-image/`——旧 `.html` URL 由 `vercel.json` **301** 跳转，**redirects 勿删**；无尾斜杠访问同样 301 → 尾斜杠形态。产品/功能页（index/pricing/terms/privacy 等）维持平铺 `.html`（不得迁移，除非用户指示）。新增词页照此模板：目录 + index.html + `../` 相对路径 + §4 全套 SEO 头 + sitemap 尾斜杠 URL。**共享组件（components.js）内路径必须根绝对**（`/pricing.html`、`/images/...`）——相对路径从目录页运行会指向 `/slug/xxx`（2026-09-16 实测坑）。

### 4.1 SEO 强制标准（83 条，铁律）⚠️

**遵循来源：`seo-standard.md`（83 条 · 哥飞知识库逐条验证，全量条款见该文件）。**

- **任何页面/内容/结构的新增、修改、上线，必须逐条对照 `seo-standard.md` 执行；未达标不得上线。**
- 红线条款（违反即返工）：
  - **R2.1 禁止 `<meta name="keywords">`**（谷歌已淘汰；现状所有页面含 keywords 标签 = 待整改，新页面永远不准加）。
  - **R2.5 每页只能有 1 个 H1**；R2.2/R2.4 Title/Description 必须认真写（拼用户关心的多个搜索点）。
  - **R3.1 SSR/源码可见**：TDK/H1-H6/正文必须 HTML 源码可见（JS 渲染内容必须配静态兜底，同 nav/footer 模式）。
  - **R3.2 canonical 唯一 URL**（www/裸域/http/https/尾斜杠统一）；R10.3 www 301→裸域。
  - **R3.4 sitemap.xml + GSC 提交**：新增可收录页面必须同步更新 sitemap（ns:image 图片条目）；**收录策略（2026-09 起）**：收录 = index首页 + pricing + terms + privacy（均 `index, follow`，进 sitemap）；**noindex = settings/creations/login/register/checkin**（功能/账户页，不收录）。
  - **R4.6/R6.3 面包屑 + JSON-LD**：本项目豁免面包屑（付费工具站，影响小）；head JSON-LD = SoftwareApplication + FAQPage（内容与页面一致）+ Organization（待补）。
  - **R6.1 页面字符量 ≥800**；R6.6 一页一词；R6.8 一文一义（禁止不相干词蹭排名）。
  - **R6.4 OG + TwitterCard 全页统一**；R12.1 响应式移动优先；R13.1 全站 HTTPS。
  - **R4.1 词页目录形态（2026-09-16 起）**：SEO 词页 = `/slug/` 目录 + index.html（旧 URL 301 兜底）；产品/功能页维持 `.html`。细则与共享组件约束见 §4 第 9 条。
  - **R15.1 冷启动节奏**：第一版无需登录注册，Web1.0 静态页上线。
- **选题约束**：R1.6 新站只做 KD<40 的词；R1.7 优先近 12 个月新词；R1.2 KGR<0.25 判蓝海。
- **待整改清单**（存量违反项，见 seo-standard.md 末尾差距表）：删除全部 keywords 标签（P0）、Organization JSON-LD（P1）、GA 统计（P1）。

## 6. 部署与环境（非敏感信息版）

> ⚠️ **本仓库为公开仓库：任何密码/API key/webhook secret 一律不得写入本文件或提交进 git**。完整的凭据速查表（SSH/MySQL/Creem/Stripe/域名）维护在**本机私有 skill `pixpurge-frontend` → `references/production-deploy.md`**，部署前先 `skill_view` 加载。

### 6.1 拓扑

- **前端**（本仓库）：GitHub `githubi2/pixpurge`（push 即自动部署）→ Vercel 项目 `zeng-xianshengs-projects/pixpurge`；域名 pixpurge.com 需在 Namecheap 指向 Vercel（A→76.76.21.21，用户操作，未完成前用 Vercel URL 验收）
- **后端**（youlai-nest）：生产在 Vultr `155.138.226.227` 全 Docker（pp-app/pp-caddy/pp-mysql/pp-redis），compose `/root/pixpurge-backend/`，后端容器 cwd=/app；**生产无 git**，直接放源码 + `docker compose build app && up -d app` 重建
- **管理端**（vue3-element-admin）：生产为 `/srv/admin` 静态包（pp-caddy bind mount，先 `pnpm build-only` 再打包上传）

### 6.2 流程铁律（与 §5 相同，部署场景重申）

1. **先本地修复验证 → 再推送上线**（用户明确偏好；生产报错先在本地复现）
2. **凭据不入 git**（公开仓库）；敏感项一律用本机 skill 速查表 / .env 文件
3. 数据库导入/查询**必须带 `--default-character-set=utf8mb4`**，否则中文乱码（用 HEX 验证）
4. 替换 bind-mount 源目录后**必须 `docker restart pp-caddy`**（bind mount 挂旧 inode 坑，容器内验证）
5. 前端验证用 **curl/node 等效**（用户测试环境禁浏览器自动化，真机留给用户）
6. `sys_config` JSON 字段校验：**允许空 或 合法 JSON**（`isOptionalJson`），禁止空值误判；后端 DTO `@MaxLength` 与 DB 列宽必须一致（config_value=2000）
7. 支付渠道抽象：`site.payment.provider` = stripe|creem（默认 stripe）；Creem 审核通过前生产**保持 stripe**

### 6.3 上线发布动作

- 前端：`git add <改动的 html> && git commit -m "feat/fix/chore: ..." && git push origin main`（Vercel 自动部署）
- 后端：本地 `npx nest build` → 本地验证 → 打包（**排除 .env*/.git/node_modules/dist**）→ scp → 服务器解压 → 恢复 `.env.production` 与定制 compose → `docker compose build app && up -d app`
- 管理端：`pnpm build-only` → tar dist → scp → 解压替换 → **重启 pp-caddy**

### 6.4 前端支付与合规约定（pricing.html / 全站文案）

- **支付回跳**：`pricing.html?paid=success&session_id=...`（Stripe）与 `?paied=success&checkout_id=...&signature=...`（Creem，参数按 URL 出现顺序收集）→ `verifyCreemPayment()` 调 verify-session（retry 保护与 Stripe 一致）；`paid=cancel` 走取消态。
- **渠道开关**：后端 `site.payment.provider` 驱动（设置页配置），前端无写死渠道。
- **合规文案铁律（Creem 审核要求，2026-09 已全量整改）**：全站禁止 `free forever`/`no credit card required`/`costs nothing`/`free tool`/`free AI`/`completely free` 表述；免费口径统一为「**free monthly credits**（注册送月度积分）+ 付费积分包/月付/年付明示」；禁止未经验证的用户数据/评分/证言（2M+/50K+/4.9 等）与统计区块；Terms 必须含 NSFW 禁止条款（terms.html §3 已加）。改文案后跑一遍终扫：`grep -rniE "free forever|no credit card|costs nothing|free tool|free AI|completely free" --include="*.html" .` 必须为空。
- **support 邮箱**：全站唯一 `support@pixpurge.com`（17 处已验证）；Creem Dashboard 侧由用户维护。

### 6.5 凭据与故障速查

- **凭据**（SSH/MySQL/Creem/Stripe key、测试账号等）**一律不写入本仓库**——集中在本机私有 skill `pixpurge-ops` → SKILL.md「凭据速查」；后端/DB 详细规则见 `youlai-nest/AGENTS.md` §6。
- 高频故障规则（详见各仓库 AGENTS / pixpurge-ops 问题速查表）：bind-mount 换目录必须 restart pp-caddy；DB 导入必须 utf8mb4；sys_config JSON 允许空 + 解析全值；DTO 长度与列宽一致；本地 8000 孤儿进程用 taskkill /F /T；前端验证用 curl/node。

---

## 7. 工作流约定（补）

- 样式：编辑 `css/theme.css` / HTML 类名后 `npm run css` 重建 `css/tailwind.css`，浏览器刷新实测（交互改动需实际点击/拖拽验证，不只截图）。
- **JS 完整性铁律（P0）**：任何对含 JS 页面的修改（尤其删除 JS 区块/包裹）完成后，必须在**最终文件**上提取全部内联 `<script>`（跳过 `src=`、`ld+json`）逐块 `node --check`，并对改动页跑 jsdom 冒烟（pixpurge-frontend skill → `scripts/jsdom-smoke.js`）；一行残留（如孤儿 `})();`）会让整段脚本解析失败——页面外观正常但所有点击失效（曾致线上首页约 19 小时不可用）。**编辑中途扫过不算数，必须扫最终版。**
- 提交信息：`feat:` / `fix:` / `chore:` 前缀（仓库现状：Initial commit / chore: remove unused dev files）。
- 新图片进 `images/`，文件名小写连字符（如 `audience-ecommerce.jpg`），保持 alt 描述带关键词。
- 新功能默认先本地验证、经确认后再提交（用户偏好：不擅自发布）。
- **严格按需求执行（铁律）**：只实现用户明确要求的内容，**禁止擅自加戏**——不添加需求外的提示语（toast/hint）、弹窗、按钮行为、图标或装饰文案；用户只说"改为某种样式/占位"时，仅按要求呈现视觉，不自行设计交互。拿不准时先问，不替用户做决定。

## 8. 争议问题沉淀铁律（每次会话必运行）

> 目的：任何有争议/有歧义的问题（报错、数据不一致、外部观点与现状矛盾、"哪个是对的"），**以最终执行+验证的结果为准，且解决后必须书面沉淀**——只讨论不整理 = 未完成。

1. **以最终执行结果为准**：实测/验证结果 > 猜测、讨论、外部报告（第三方体检、AI 观点、网上说法）。观点分歧时先给铁证（git 历史、grep 计数、真实调用输出、截图对照表）再表态，不盲从也不盲驳。
2. **解决后立即整理（必须，不留给下次）**，整理内容三选一按归属：
   - 本机私有 skill `pixpurge-ops`（凭据/故障速查表/支付链路）——**凭据类只进这里**
   - 本仓库 AGENTS.md 对应章节（部署/合规/工作流规则）
   - 后端/DB 相关 → `youlai-nest/AGENTS.md` §6
3. **整理格式**：根因 → 修复 → 验证结果 → 防止复发的规则（一句话可执行），追加到「问题速查表/规则段落」，不覆盖历史记录。
4. **未整理 = 未完成**：会话收尾前检查是否有新踩的坑/新决策未沉淀；有则补完再交付。
