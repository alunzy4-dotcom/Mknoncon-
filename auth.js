const cfg = window.MKNON_SUPABASE || {};
const statusBox = document.getElementById('status');
const loginForm = document.getElementById('login');
const signupForm = document.getElementById('signup');
const resetBtn = document.getElementById('resetPassword');

function setStatus(message, type='info') {
  statusBox.textContent = message || '';
  statusBox.dataset.type = type;
  statusBox.hidden = !message;
}

function normalizePhone(v='') {
  return v.replace(/\s+/g,'').trim();
}

if (!cfg.url || !cfg.anonKey) {
  setStatus('إعداد Supabase لم يكتمل بعد. يلزم إدخال Project URL وPublic anon key.', 'warning');
} else {
  const client = supabase.createClient(cfg.url, cfg.anonKey);

  client.auth.getSession().then(({ data }) => {
    if (data?.session) location.href = 'dashboard.html';
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('جارٍ تسجيل الدخول...');
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return setStatus(error.message, 'error');
    location.href = 'dashboard.html';
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('جارٍ إنشاء الحساب...');

    const full_name = signupForm.full_name.value.trim();
    const phone = normalizePhone(signupForm.phone.value);
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;
    const referral_code = signupForm.referral_code.value.trim() || null;

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://mknoncon.com/auth.html',
        data: { full_name, phone, referral_code }
      }
    });

    if (error) return setStatus(error.message, 'error');

    // ملف العميل يُنشأ تلقائياً بواسطة trigger في Supabase.
    if (data?.session) {
      location.href = 'dashboard.html';
    } else {
      setStatus('تم إنشاء الحساب. افتح بريدك الإلكتروني وأكّد التسجيل ثم سجّل الدخول.', 'success');
    }
  });

  resetBtn.addEventListener('click', async () => {
    const email = loginForm.email.value.trim();
    if (!email) {
      return setStatus('اكتب بريدك الإلكتروني أولاً ثم اضغط نسيت كلمة المرور.', 'warning');
    }

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://mknoncon.com/reset-password.html'
    });

    if (error) return setStatus(error.message, 'error');
    setStatus('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.', 'success');
  });
}
