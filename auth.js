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
      'idToken不能为空': 'Google sign-in failed, please try again'
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
    var password = document.getElementById('signupPassword').value;
    var nickname = (first + ' ' + last).trim() || email.split('@')[0];
    apiPost('/auth/register', { email: email, password: password, nickname: nickname })
      .then(function() {
        // 注册成功不自动登录：跳登录页并预填邮箱（与旧弹窗行为一致）
        window.location.href = 'login.html?email=' + encodeURIComponent(email);
      })
      .catch(function(err) { showFormError('signupError', err.message); });
  };

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
