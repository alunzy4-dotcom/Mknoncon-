const statusBox = document.getElementById('status');
const loginForm = document.getElementById('login');
const signupForm = document.getElementById('signup');
const resetBtn = document.getElementById('resetPassword');
const signupStatus = document.getElementById('signupStatus');

function setStatus(message, type='info') {
  statusBox.textContent = message || '';
  statusBox.dataset.type = type;
  statusBox.hidden = !message;
}

function normalizePhone(v='') {
  return v.replace(/\s+/g,'').trim();
}

async function api(payload) {
  const res = await fetch('auth-api.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    cache: 'no-store',
    body: JSON.stringify(payload)
  });

  let data = {};
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg = data.msg || data.message || data.error_description || data.error || ('HTTP ' + res.status);
    throw new Error(msg);
  }
  return data;
}

function saveSession(data) {
  const access = data.access_token || data.session?.access_token;
  const refresh = data.refresh_token || data.session?.refresh_token;
  const user = data.user || null;
  if (!access || !user) return false;

  localStorage.setItem('mknon_access_token', access);
  if (refresh) localStorage.setItem('mknon_refresh_token', refresh);
  localStorage.setItem('mknon_user', JSON.stringify(user));
  return true;
}

if (localStorage.getItem('mknon_access_token')) {
  location.href = 'dashboard.html';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('جارٍ تسجيل الدخول...');
  try {
    const data = await api({
      action: 'login',
      email: loginForm.email.value.trim(),
      password: loginForm.password.value
    });

    if (!saveSession(data)) throw new Error('تعذر إنشاء جلسة الدخول.');
    location.href = 'dashboard.html';
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.toLowerCase().includes('invalid login credentials')) {
      setStatus('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'error');
    } else if (msg.toLowerCase().includes('email not confirmed')) {
      setStatus('البريد الإلكتروني غير مؤكد بعد.', 'warning');
    } else {
      setStatus('تعذر تسجيل الدخول: ' + msg, 'error');
    }
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = signupForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'جارٍ إنشاء الحساب...';
  signupStatus.textContent = '';

  const full_name = signupForm.full_name.value.trim();
  const phone = normalizePhone(signupForm.phone.value);
  const email = signupForm.email.value.trim();
  const password = signupForm.password.value;
  const referral_code = signupForm.referral_code.value.trim() || null;

  try {
    const data = await api({
      action: 'signup',
      email, password, full_name, phone, referral_code
    });

    if (!saveSession(data)) {
      throw new Error('تم إنشاء الحساب لكن لم يتم إنشاء جلسة. تأكد أن Confirm email متوقف.');
    }

    const user = data.user;
    await api({
      action: 'profile_upsert',
      access_token: data.access_token,
      user_id: user.id,
      full_name,
      phone,
      referral_code
    });

    location.href = 'dashboard.html';
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'إنشاء الحساب';
    signupStatus.textContent = 'تعذر إنشاء الحساب: ' + (err.message || err);
  }
});

resetBtn.addEventListener('click', () => {
  setStatus('ميزة استعادة كلمة المرور سنربطها بعد التأكد من التسجيل والدخول.', 'warning');
});
