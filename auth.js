const cfg = window.MKNON_SUPABASE || {};
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
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('email not confirmed')) {
        return setStatus('البريد الإلكتروني غير مؤكد بعد. افتح رسالة Supabase في بريدك واضغط رابط التأكيد، ثم ارجع وسجّل الدخول.', 'warning');
      }
      if (msg.includes('invalid login credentials')) {
        return setStatus('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'error');
      }
      return setStatus(error.message, 'error');
    }
    location.href = 'dashboard.html';
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

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://mknoncon.com/auth.html',
        data: { full_name, phone, referral_code }
      }
    });

    if (error) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'إنشاء الحساب';
      signupStatus.textContent = error.message;
      return;
    }

    if (data?.session) {
      const user = data.user;
      if (user) {
        const { error: profileError } = await client.from('profiles').upsert({
          id: user.id,
          full_name,
          phone,
          referral_code: user.id.replace(/-/g,'').slice(0,8).toUpperCase(),
          referred_by: referral_code
        }, { onConflict: 'id' });
        if (profileError) {
          signupStatus.textContent = 'تم إنشاء الحساب، لكن تعذر حفظ الملف الشخصي: ' + profileError.message;
          return;
        }
      }
      location.href = 'dashboard.html';
      return;
    }

    // إذا كان تأكيد البريد متوقفاً أو كان الحساب موجوداً مسبقاً بنفس كلمة المرور،
    // نحاول تسجيل الدخول مباشرة.
    const { error: loginError } = await client.auth.signInWithPassword({ email, password });

    if (!loginError) {
      const { data: current } = await client.auth.getUser();
      const user = current?.user;
      if (user) {
        await client.from('profiles').upsert({
          id: user.id,
          full_name,
          phone,
          referral_code: user.id.replace(/-/g,'').slice(0,8).toUpperCase(),
          referred_by: referral_code
        }, { onConflict: 'id' });
      }
      location.href = 'dashboard.html';
      return;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'إنشاء الحساب';

    const msg = (loginError.message || '').toLowerCase();
    if (msg.includes('email not confirmed')) {
      signupStatus.textContent = 'الحساب موجود لكن البريد ما زال يحتاج تأكيداً. تأكد أن خيار Confirm email متوقف في Supabase ثم جرّب بحساب جديد أو احذف الحساب التجريبي القديم.';
    } else if (msg.includes('invalid login credentials')) {
      signupStatus.textContent = 'هذا البريد مسجل مسبقاً أو كلمة المرور لا تطابق الحساب السابق. جرّب تسجيل الدخول أو استخدم بريداً جديداً للاختبار.';
    } else {
      signupStatus.textContent = loginError.message || 'تعذر إكمال التسجيل.';
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
