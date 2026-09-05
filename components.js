// ===== PixPurge shared site chrome: Navbar / Mobile Nav / Footer / Auth =====
// 无构建静态站的共享组件（对 SEO 无影响的 chrome 部分）。
// 用法：<body data-page="index|pricing|settings|creations"> + body 末尾 <script src="components.js"></script>
// 渲染在 script 同步执行阶段完成（首帧前），避免导航闪现（FOUC）。
(function() {
  var page = document.body.getAttribute('data-page') || 'index';
  var isHome = page === 'index';

  // ===== 全局常量（供各页主 script 复用：TOKEN_KEY / USER_KEY / API_BASE）=====
  var TOKEN_KEY = 'pixpurge:token';
  var USER_KEY = 'pixpurge:user';
  window.TOKEN_KEY = TOKEN_KEY;
  window.USER_KEY = USER_KEY;
  // 本地开发直连后端；线上(Vercel)走同源 /api/v1 由 vercel.json rewrites 转发到后端服务器
  window.API_BASE =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:8000/api/v1'
      : '/api/v1';

  var HOME_LOGO_HREF = isHome ? '#' : 'index.html';

  // 会员/计费入口开关：true=隐藏（线上暂不展示但代码保留），false=恢复显示（Pricing 入口/升级卡/每日签到）
  var HIDE_MEMBERSHIP = true;
  var MENU = [
    ['How It Works', 'how-it-works'],
    ['Use Cases', 'use-cases'],
    ['Examples', 'examples'],
    ['FAQ', 'faq']
  ];
  if (!HIDE_MEMBERSHIP) { MENU.push(['Pricing', 'pricing.html']); }

  function hrefFor(key) {
    if (key === 'pricing.html') return 'pricing.html';
    return isHome ? '#' + key : 'index.html#' + key;
  }

  function menuLink(name, key) {
    var cls = 'text-[14.5px] font-medium px-3.5 py-2 rounded-lg hover:text-ink hover:bg-paper-warm transition-all ';
    cls += (page === 'pricing' && key === 'pricing.html') ? 'text-coral' : 'text-ink-soft';
    return '<a href="' + hrefFor(key) + '" class="' + cls + '">' + name + '</a>';
  }

  function navLinksHtml() {
    var html = '';
    for (var i = 0; i < MENU.length; i++) {
      html += menuLink(MENU[i][0], MENU[i][1]);
    }
    return html;
  }

  function loginBtnHtml() {
    if (isHome) {
      return '<button id="navLoginBtn" class="hidden md:inline-flex items-center justify-center font-semibold text-[15px] px-[22px] py-[11px] rounded-lg border-[1.5px] border-coral text-coral hover:bg-coral hover:text-white transition-all" onclick="openModal(\'login\')">Log In</button>';
    }
    return '<a href="index.html" id="navLoginBtn" class="hidden md:inline-flex items-center justify-center font-semibold text-[15px] px-[22px] py-[11px] rounded-lg border-[1.5px] border-coral text-coral hover:bg-coral hover:text-white transition-all">Log In</a>';
  }

  function userMenuHtml() {
    return '' +
      '<div id="navUser" class="hidden md:flex items-center relative" style="display:none">' +
        '<button id="navAvatar" class="w-10 h-10 rounded-full bg-coral-light text-coral font-display font-bold text-[15px] flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-coral/30 transition-all" onclick="toggleNavMenu(event)" aria-label="Account menu"></button>' +
        '<div id="navUserMenu" class="hidden absolute right-0 top-[52px] w-72 bg-surface border border-line-soft rounded-2xl shadow-pop overflow-hidden">' +
          '<div class="px-5 py-4 bg-coral-light/60 border-b border-line-soft flex items-center gap-3">' +
            '<div class="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-coral-light text-coral font-display font-bold text-base flex items-center justify-center" id="navUserMenuAvatar"></div>' +
            '<div class="min-w-0">' +
              '<p id="navUserMenuName" class="text-sm font-semibold text-ink truncate leading-snug"></p>' +
              '<p id="navUserMenuEmail" class="text-[12.5px] text-ink-muted truncate mt-0.5"></p>' +
              '<p id="navUserMenuQuota" class="text-[12.5px] text-coral font-semibold truncate mt-0.5"></p>' +
            '</div>' +
          '</div>' +
          (!HIDE_MEMBERSHIP
            ? '<div class="px-5 py-4 border-b border-line-soft">' +
              '<p class="font-display text-[15px] font-bold text-ink">Basic Plan</p>' +
              '<p class="text-[12.5px] text-ink-muted mt-1">Upgrade now — unlock VIP privileges instantly!</p>' +
              '<button onclick="window.location.href=\'settings.html\'" class="mt-3 w-full inline-flex items-center justify-center font-semibold text-[14px] px-4 py-2.5 rounded-xl bg-coral text-white shadow-cta hover:bg-coral-hover transition-all">Upgrade</button>' +
            '</div>'
            : '') +
          '<div class="py-2">' +
            '<button type="button" onclick="window.location.href=\'creations.html\'" class="w-full flex items-center gap-3 px-5 py-2.5 text-left text-[14px] font-medium text-ink-soft hover:bg-paper-warm hover:text-ink transition-colors">' +
              '<svg class="w-[18px] h-[18px] text-coral flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
              '<span>My Creations</span>' +
              '<span class="ml-auto text-[10.5px] font-bold tracking-[0.04em] bg-coral text-white px-2 py-0.5 rounded-full">NEW</span>' +
            '</button>' +
            (!HIDE_MEMBERSHIP
              ? '<a href="#" onclick="return false;" class="flex items-center gap-3 px-5 py-2.5 hover:bg-paper-warm transition-colors">' +
                '<svg class="w-[18px] h-[18px] text-coral flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>' +
                '<div class="min-w-0"><p class="text-[14px] font-semibold text-ink leading-snug">Daily Check-in</p><p class="text-[12px] text-ink-muted mt-0.5">Earn free credits daily</p></div>' +
              '</a>'
              : '') +
            '<button type="button" onclick="window.location.href=\'settings.html\'" class="w-full flex items-center gap-3 px-5 py-2.5 text-left text-[14px] font-medium text-ink-soft hover:bg-paper-warm hover:text-ink transition-colors">' +
              '<svg class="w-[18px] h-[18px] text-coral flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
              '<span>Settings</span>' +
            '</button>' +
            '<a href="' + (isHome ? '#faq' : 'index.html#faq') + '" onclick="closeNavMenu()" class="flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium text-ink-soft hover:bg-paper-warm hover:text-ink transition-colors">' +
              '<svg class="w-[18px] h-[18px] text-coral flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
              '<span>Help &amp; FAQ</span>' +
            '</a>' +
            '<a href="mailto:support@pixpurge.com" class="flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium text-ink-soft hover:bg-paper-warm hover:text-ink transition-colors">' +
              '<svg class="w-[18px] h-[18px] text-coral flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
              '<span>Contact Us</span>' +
            '</a>' +
          '</div>' +
          '<div class="border-t border-line-soft py-2">' +
            '<a href="#" onclick="logoutSite(); return false;" class="flex items-center gap-3 px-5 py-2.5 text-[14px] font-semibold text-coral hover:bg-coral-light/50 transition-colors">' +
              '<svg class="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
              '<span>Sign Out</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function mobileMenuHtml() {
    var links = '';
    for (var i = 0; i < MENU.length; i++) {
      links += '<a href="' + hrefFor(MENU[i][1]) + '" onclick="toggleMobileNav()" class="font-display text-lg font-semibold text-ink py-3 border-b border-line-soft">' + MENU[i][0] + '</a>';
    }
    var login = isHome
      ? '<button onclick="toggleMobileNav(); openModal(\'login\')" class="mt-6 w-full inline-flex items-center justify-center font-semibold text-base px-6 py-4 rounded-lg border-[1.5px] border-line text-ink bg-surface hover:bg-paper-warm transition-all">Log In</button>'
      : '<a href="index.html" onclick="toggleMobileNav()" class="mt-6 w-full inline-flex items-center justify-center font-semibold text-base px-6 py-4 rounded-lg border-[1.5px] border-line text-ink bg-surface hover:bg-paper-warm transition-all">Log In</a>';
    return '<button class="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-lg hover:bg-paper-warm" onclick="toggleMobileNav()" aria-label="Close menu">' +
      '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '</button>' + links + login;
  }

  function footerHtml() {
    return '' +
      '<div class="max-w-site mx-auto px-4 sm:px-6 py-12 sm:py-14">' +
        '<div class="grid grid-cols-1 md:grid-cols-4 gap-10">' +
          '<div class="md:col-span-2">' +
            '<a href="index.html" class="flex items-center gap-2.5 font-display font-bold text-xl text-ink mb-4">' +
              '<img src="images/logo.svg" alt="PixPurge — free text remover from image" class="w-9 h-9 rounded-[10px]" width="36" height="36">PixPurge' +
            '</a>' +
            '<p class="text-[14.5px] text-ink-muted leading-[1.7] max-w-[380px]">Free AI text remover from image. Remove text, watermarks, captions, and date stamps online — sign in to start.</p>' +
          '</div>' +
          '<div>' +
            '<p class="text-xs font-bold uppercase tracking-[0.08em] text-ink-muted mb-4">Tool</p>' +
            '<ul class="space-y-2.5 text-[14px]">' +
              '<li><a href="index.html#how-it-works" class="text-ink-soft hover:text-coral transition-colors">How It Works</a></li>' +
              '<li><a href="index.html#use-cases" class="text-ink-soft hover:text-coral transition-colors">Use Cases</a></li>' +
              '<li><a href="index.html#examples" class="text-ink-soft hover:text-coral transition-colors">Examples</a></li>' +
              '<li><a href="index.html#faq" class="text-ink-soft hover:text-coral transition-colors">FAQ</a></li>' +
              (!HIDE_MEMBERSHIP
                ? '<li><a href="pricing.html" class="text-ink-soft hover:text-coral transition-colors">Pricing</a></li>'
                : '') +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<p class="text-xs font-bold uppercase tracking-[0.08em] text-ink-muted mb-4">Support</p>' +
            '<ul class="space-y-2.5 text-[14px]">' +
              '<li><a href="mailto:support@pixpurge.com" class="text-ink-soft hover:text-coral transition-colors">Contact Us</a></li>' +
              '<li><a href="index.html#faq" class="text-ink-soft hover:text-coral transition-colors">Help &amp; FAQ</a></li>' +
              '<li><a href="#" class="text-ink-soft hover:text-coral transition-colors">Privacy Policy</a></li>' +
              '<li><a href="#" class="text-ink-soft hover:text-coral transition-colors">Terms of Use</a></li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="mt-10 pt-6 border-t border-line-soft flex flex-col sm:flex-row items-center justify-between gap-3">' +
          '<p class="text-[13px] text-ink-muted">© 2026 PixPurge. All rights reserved.</p>' +
          '<p class="text-[13px] text-ink-muted">No credit card required · No watermark on results</p>' +
        '</div>' +
      '</div>';
  }

  // ===== 挂载（同步执行，首帧前完成）=====
  var navHost = document.getElementById('siteNavbar');
  if (navHost) {
    navHost.innerHTML = '<div class="max-w-site mx-auto px-4 sm:px-6 flex items-center justify-between h-[68px]">' +
      '<a href="' + HOME_LOGO_HREF + '" class="flex items-center gap-2.5 font-display font-bold text-xl text-ink">' +
        '<img src="images/logo.svg" alt="PixPurge text remover from image logo" class="w-9 h-9 rounded-[10px]" width="36" height="36">PixPurge' +
      '</a>' +
      '<div class="hidden lg:flex items-center gap-1">' + navLinksHtml() + '</div>' +
      '<div class="flex items-center gap-2.5">' + loginBtnHtml() + userMenuHtml() +
        '<button class="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-paper-warm" onclick="toggleMobileNav()" aria-label="Open menu">' +
          '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  }
  var mobileHost = document.getElementById('siteMobileNav');
  if (mobileHost) mobileHost.innerHTML = mobileMenuHtml();
  var footerHost = document.getElementById('siteFooter');
  if (footerHost) footerHost.innerHTML = footerHtml();

  // ===== 导航交互 =====
  window.toggleMobileNav = function() {
    var nav = document.getElementById('siteMobileNav');
    if (!nav) return;
    nav.classList.toggle('hidden');
    nav.style.display = nav.classList.contains('hidden') ? '' : 'flex';
  };
  window.toggleNavMenu = function(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    var menu = document.getElementById('navUserMenu');
    if (menu) menu.classList.toggle('hidden');
  };
  window.closeNavMenu = function() {
    var menu = document.getElementById('navUserMenu');
    if (menu) menu.classList.add('hidden');
  };

  document.addEventListener('click', function(e) {
    var menu = document.getElementById('navUserMenu');
    var avatar = document.getElementById('navAvatar');
    if (menu && avatar && !menu.classList.contains('hidden') && !avatar.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.add('hidden');
    }
  });

  // ===== 登录态（全站复用）=====
  window.getSessionUser = function() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (e) {
      return null;
    }
  };

  // 刷新今日剩余处理额度（用户菜单；未登录/无响应时清空）
  window.refreshQuota = function() {
    var el = document.getElementById('navUserMenuQuota');
    if (!el) return;
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) { el.textContent = ''; return; }
    fetch(API_BASE + '/site/quota', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (json && json.code === '00000' && json.data && json.data.remaining !== undefined) {
          el.textContent = json.data.remaining + ' of ' + json.data.limit + ' results left today';
        } else if (json && (json.code === 'A0230' || json.code === 'A0301')) {
          // token 失效：清掉残留登录态，避免"假登录"
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          el.textContent = '';
          refreshNavAuth();
        }
      })
      .catch(function() { el.textContent = ''; });
  };

  // 导航登录态：登录后隐藏 Log In、显示头像（内联 display 控制，md:inline-flex/md:flex 会覆盖 hidden 类）
  window.refreshNavAuth = function() {
    var user = getSessionUser();
    var hasToken = !!localStorage.getItem(TOKEN_KEY);
    var loggedIn = !!(user && hasToken);
    var loginBtn = document.getElementById('navLoginBtn');
    var userBox = document.getElementById('navUser');
    if (!loginBtn || !userBox) return;
    loginBtn.style.display = loggedIn ? 'none' : '';
    userBox.style.display = loggedIn ? 'flex' : 'none';
    if (loggedIn) {
      var avatarEl = document.getElementById('navAvatar');
      var menuAvatar = document.getElementById('navUserMenuAvatar');
      var nameEl = document.getElementById('navUserMenuName');
      var emailEl = document.getElementById('navUserMenuEmail');
      var letter = (user.nickname || user.email || 'U').charAt(0).toUpperCase();
      var avatarHtml = user.avatar
        ? '<img src="' + user.avatar + '" alt="' + (user.email || 'user') + '" class="w-full h-full object-cover" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
          '<span class="w-full h-full hidden items-center justify-center">' + letter + '</span>'
        : '<span class="w-full h-full flex items-center justify-center">' + letter + '</span>';
      avatarEl.innerHTML = avatarHtml;
      menuAvatar.innerHTML = avatarHtml;
      nameEl.textContent = user.nickname || user.email || '';
      emailEl.textContent = user.email || '';
    }
  };

  // 登出：清本地登录态 + 刷新导航
  window.logoutSite = function() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    closeNavMenu();
    var nameEl = document.getElementById('navUserMenuName');
    var emailEl = document.getElementById('navUserMenuEmail');
    var quotaEl = document.getElementById('navUserMenuQuota');
    if (nameEl) nameEl.textContent = '';
    if (emailEl) emailEl.textContent = '';
    if (quotaEl) quotaEl.textContent = '';
    refreshNavAuth();
    refreshQuota();
  };

  // 多标签页同步：其他标签登录/登出时自动刷新
  window.addEventListener('storage', function(e) {
    if (e.key === TOKEN_KEY || e.key === USER_KEY || e.key === null) {
      refreshNavAuth();
      refreshQuota();
    }
  });

  // 恢复登录态：同步执行避免首帧闪现（FOUC）；load 事件双保险
  refreshNavAuth();
  refreshQuota();
  window.addEventListener('load', function() { refreshNavAuth(); refreshQuota(); });
})();
