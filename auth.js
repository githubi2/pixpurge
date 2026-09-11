// ===== PixPurge auth forms (login.html / register.html shared logic) =====
// 用法：<body data-auth="login|signup"> + <script src="auth.js"></script>（在 components.js 之后）
// 若本页已登录（token+user 存在），直接跳回首页（防重复登录）。
(function() {
  'use strict';

  var authMode = document.body.getAttribute('data-auth') || 'login';

  // 后端地址优先复用 components.js 暴露的全局，其次是本文件判断
  var API_BASE = window.API_BASE ||
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:8000/api/v1'
      : '/api/v1');
  var TOKEN_KEY = window.TOKEN_KEY || 'pixpurge:token';
  var USER_KEY = window.USER_KEY || 'pixpurge:user';
  var GOOGLE_CLIENT_ID = '547189163396-lgqbc3ucvpejdeg9lndjcn8u9tbge8e8.apps.googleusercontent.com';

  // ===== 已登录防呆：直接回首页 =====
  try {
    var hasToken = !!localStorage.getItem(TOKEN_KEY);
    var hasUser = !!localStorage.getItem(USER_KEY);
    if (hasToken && hasUser) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) { /* localStorage 不可用时继续显示表单 */ }

  // ===== 通用请求 =====
  function makeError(msg) {
    var ERROR_MAP = {
      '该邮箱已注册': 'This email is already registered',
      '用户名或密码错误': 'Incorrect email or password',
      '用户账户不存在': 'Account not found',
      '用户账户被冻结': 'Account is suspended',
      '无效的用户输入': 'Invalid input',
      '邮箱不能为空': 'Email is required',
      '密码不能为空': 'Password is required',
      '邮箱格式不正确': 'Invalid email format',
      '密码至少6位': 'Password must be at least 6 characters',
      '密码最多32位': 'Password must be at most 32 characters',
      '昵称最多32位': 'Nickname must be at most 32 characters',
      'idToken不能为空': 'Google sign-in failed, please try again',
      '验证码不能为空': 'Verification code is required',
      '验证码格式不正确': 'Verification code must be 6 digits',
      '验证码错误': 'Incorrect verification code, please try again',
      '用户验证码过期': 'Verification code expired, please request a new one',
      '用户验证码尝试次数超限': 'Too many incorrect attempts, please request a new code',
      '验证码发送过于频繁，请稍后再试': 'Please wait a minute before requesting another code',
      '今日验证码发送次数已达上限': 'Daily verification code limit reached, please try again tomorrow',
      '请求并发数超出限制': 'Too many requests, please slow down and try again',
      '调用第三方服务出错': 'Failed to send the email, please try again later',
      '暂不支持该邮箱域名，请使用常用邮箱服务': "This email provider isn't supported, please use a common email service",
      '该邮箱域名无法接收邮件，请检查后重试': "This email domain can't receive mail, please double-check the address",
      '今日注册次数已达上限，请明日再试': 'Daily sign-up limit reached, please try again tomorrow'
    };
    var e = new Error(ERROR_MAP[msg] || msg || 'Request failed, please try again');
    e.code = '';
    return e;
  }

  function apiPost(path, body) {
    var headers = { 'Content-Type': 'application/json' };
    var token = localStorage.getItem(TOKEN_KEY);
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    }).then(function(res) {
      return res.json().catch(function() {
        throw makeError('Network error, please try again');
      });
    }).then(function(json) {
      if (!json || json.code !== '00000') {
        throw makeError((json && json.msg) || 'Request failed, please try again');
      }
      return json.data;
    }).catch(function(err) {
      if (err && err.message) throw err;
      throw makeError('Network error, please try again');
    });
  }

  function saveSession(data) {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  // ===== 表单错误提示（内联，不弹 toast）=====
  function showFormError(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
  }
  function hideFormError(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  // ===== 登录 =====
  window.handleLogin = function(e) {
    e.preventDefault();
    hideFormError('loginError');
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    apiPost('/auth/email/login', { email: email, password: password })
      .then(function(data) {
        saveSession(data);
        window.location.href = 'index.html';
      })
      .catch(function(err) { showFormError('loginError', err.message); });
  };

  // ===== 注册 =====
  window.handleSignup = function(e) {
    e.preventDefault();
    hideFormError('signupError');
    var first = document.getElementById('signupFirstName').value.trim();
    var last = document.getElementById('signupLastName').value.trim();
    var email = document.getElementById('signupEmail').value.trim();
    var emailCode = document.getElementById('signupEmailCode').value.trim();
    var password = document.getElementById('signupPassword').value;
    var nickname = (first + ' ' + last).trim() || email.split('@')[0];
    // 邮箱注册必须先完成邮箱验证码校验（防薅羊毛）；Google 登录不受此限制
    if (!/^\d{6}$/.test(emailCode)) {
      showFormError('signupError', 'Enter the 6-digit verification code sent to your email.');
      return;
    }
    apiPost('/auth/register', { email: email, password: password, nickname: nickname, emailCode: emailCode })
      .then(function() {
        // 注册成功不自动登录：跳登录页并预填邮箱（与旧弹窗行为一致）
        window.location.href = 'login.html?email=' + encodeURIComponent(email);
      })
      .catch(function(err) { showFormError('signupError', err.message); });
  };

  // ===== 注册邮箱验证码（防薅羊毛：注册前验证邮箱归属）=====
  var emailCodeTimer = null;

  function setSendCodeBtnText(text, disabled) {
    var btn = document.getElementById('btnSendEmailCode');
    if (!btn) return;
    btn.textContent = text;
    btn.disabled = disabled;
  }

  // 发送成功后 60s 冷却（按钮倒计时），与后端冷却一致
  function startEmailCodeCountdown(seconds) {
    var remain = seconds;
    setSendCodeBtnText('Resend in ' + remain + 's', true);
    if (emailCodeTimer) clearInterval(emailCodeTimer);
    emailCodeTimer = setInterval(function() {
      remain--;
      if (remain <= 0) {
        clearInterval(emailCodeTimer);
        emailCodeTimer = null;
        setSendCodeBtnText('Resend Code', false);
      } else {
        setSendCodeBtnText('Resend in ' + remain + 's', true);
      }
    }, 1000);
  }

  function sendRegisterEmailCode() {
    hideFormError('signupError');
    var email = document.getElementById('signupEmail').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormError('signupError', 'Enter a valid email address first.');
      return;
    }
    setSendCodeBtnText('Sending...', true);
    apiPost('/auth/email/code', { email: email })
      .then(function() {
        var hint = document.getElementById('emailCodeSentHint');
        if (hint) {
          hint.textContent = 'We emailed a 6-digit code to ' + email + '. The code expires in 10 minutes.';
          hint.classList.remove('hidden');
        }
        startEmailCodeCountdown(60);
      })
      .catch(function(err) {
        setSendCodeBtnText('Send Code', false);
        showFormError('signupError', err.message);
      });
  }

  if (authMode === 'signup') {
    var sendCodeBtn = document.getElementById('btnSendEmailCode');
    if (sendCodeBtn) sendCodeBtn.addEventListener('click', sendRegisterEmailCode);
  }

  // ===== Google 一键登录（GIS）=====
  var gisInitialized = false;
  function initGoogleSignIn() {
    if (gisInitialized || !window.google || !window.google.accounts) return;
    gisInitialized = true;
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential
      });
      var opts = { theme: 'outline', size: 'large', shape: 'pill', width: 340, text: authMode === 'signup' ? 'signup_with' : 'signin_with' };
      var slot = document.getElementById(authMode === 'signup' ? 'gidSignup' : 'gidSignin');
      if (slot) google.accounts.id.renderButton(slot, opts);
    } catch (err) {
      // GIS 初始化失败时保留占位文案，用户仍可用邮箱方式登录
    }
  }

  function handleGoogleCredential(resp) {
    if (!resp || !resp.credential) return;
    apiPost('/auth/google/login', { idToken: resp.credential })
      .then(function(data) {
        saveSession(data);
        window.location.href = 'index.html';
      });
  }

  if (document.readyState === 'complete') {
    initGoogleSignIn();
  } else {
    window.addEventListener('load', initGoogleSignIn);
  }

  // ===== 预填邮箱（register 成功跳转 login.html?email=xxx）=====
  if (authMode === 'login') {
    try {
      var q = (location.search.match(/[?&]email=([^&]+)/) || [])[1];
      if (q) {
        var emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.value = decodeURIComponent(q);
      }
    } catch (e) { /* ignore */ }
  }
})();
