'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DocwizeLogo } from '@/components/DocwizeLogo';

type Step = 'phone' | 'otp';
type Channel = 'sms' | 'bale';

const BALE_PHONE_KEY = 'docwize_bale_pending_phone';
const BALE_TS_KEY = 'docwize_bale_pending_at';

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('phone');
  const [channel, setChannel] = useState<Channel>('sms');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    try {
      const p = sessionStorage.getItem(BALE_PHONE_KEY);
      const t = sessionStorage.getItem(BALE_TS_KEY);
      if (p && t && Date.now() - Number(t) < 10 * 60 * 1000) {
        setPhone(p);
        setChannel('bale');
        setStep('otp');
        setTimer(120);
        setTimeout(() => otpRefs.current[0]?.focus(), 300);
      } else {
        sessionStorage.removeItem(BALE_PHONE_KEY);
        sessionStorage.removeItem(BALE_TS_KEY);
      }
    } catch {}
  }, []);

  const formatPhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    if (clean.startsWith('98')) return '+' + clean;
    if (clean.startsWith('0')) return '+98' + clean.slice(1);
    return '+98' + clean;
  };

  const handleSendSms = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (phone.replace(/\D/g, '').length < 10) { setError('شماره موبایل معتبر وارد کنید.'); return; }
    setLoading(true);
    try {
      try { sessionStorage.removeItem(BALE_PHONE_KEY); sessionStorage.removeItem(BALE_TS_KEY); } catch {}
      // Clear any pending Bale session for this phone so the hook routes to SMS
      const prep = await fetch('/api/auth/prepare-bale-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, channel: 'sms' }),
      });
      if (!prep.ok) {
        const ct = prep.headers.get('content-type') || '';
        const err = ct.includes('application/json') ? (await prep.json()).error : 'خطای سرور';
        throw new Error(err || 'خطا');
      }
      const { error } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) });
      if (error) throw new Error(error.message);
      setChannel('sms');
      setStep('otp');
      setTimer(120);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBaleLogin = async () => {
    setError(null);
    if (phone.replace(/\D/g, '').length < 10) { setError('شماره موبایل معتبر وارد کنید.'); return; }
    setLoading(true);
    try {
      // 1) Server clears any stale PENDING rows, inserts a fresh one, returns deep link
      const prep = await fetch('/api/auth/prepare-bale-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, channel: 'bale' }),
      });
      const ct = prep.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('خطای سرور. لطفاً دوباره تلاش کنید.');
      const prepData = await prep.json();
      if (!prep.ok || !prepData.deepLink) throw new Error(prepData.error || 'خطا');

      // 2) Trigger Supabase OTP. Hook looks ONLY at the PENDING row, not metadata.
      const { error: authErr } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) });
      if (authErr) throw new Error(authErr.message);

      // 3) Persist state so the OTP boxes are waiting when user returns from Bale
      try {
        sessionStorage.setItem(BALE_PHONE_KEY, phone);
        sessionStorage.setItem(BALE_TS_KEY, String(Date.now()));
      } catch {}
      setChannel('bale');
      setStep('otp');
      setTimer(120);
      setLoading(false);

      // 4) Jump to Bale — user taps Start, bot replies with the SAME OTP that SMS would have used
      window.location.href = prepData.deepLink;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otp.join('');
    if (code.length !== 6) { setError('کد ۶ رقمی را کامل وارد کنید.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: code,
      type: 'sms',
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    try { sessionStorage.removeItem(BALE_PHONE_KEY); sessionStorage.removeItem(BALE_TS_KEY); } catch {}
    router.push('/chat');
  };

  const signInWithGoogle = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-[100dvh] bg-surface-canvasDark text-neutral-100 flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0A0A0A] border-l border-neutral-800/50 flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cobalt/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <DocwizeLogo className="w-20 h-20 text-gold-500 mb-8 drop-shadow-[0_0_15px_rgba(255,178,0,0.3)]" />
          <h1 className="text-3xl font-black text-white mb-4">به Docwize خوش آمدید</h1>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">دستیار هوشمند تحلیل اسناد. با هر فایل PDF گفتگو کنید و در کسری از ثانیه به پاسخ‌های دقیق برسید.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8 flex-1">
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <DocwizeLogo className="w-7 h-7 text-gold-500" />
          <span className="font-black text-lg text-white">Docwize</span>
        </div>

        <div className="w-full max-w-sm bg-surface-aiBubbleDark border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
          {step === 'phone' && (
            <>
              <h2 className="text-xl font-bold text-white mb-1">ورود یا ثبت‌نام</h2>
              <p className="text-xs text-neutral-400 mb-4">شماره خود را وارد کنید و روش دریافت کد را انتخاب کنید.</p>
              {error && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{error}</div>}
              <form onSubmit={handleSendSms}>
                <label className="block text-xs font-medium text-neutral-400 mb-2">شماره موبایل</label>
                <div className="relative flex items-center bg-surface-inputDark border border-neutral-700 rounded-xl focus-within:border-neutral-500 overflow-hidden mb-4" dir="ltr">
                  <div className="flex items-center justify-center px-3 border-r border-neutral-700 bg-neutral-800/30 h-11">
                    <span className="text-neutral-400 text-sm font-medium">+98</span>
                  </div>
                  <input
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="9123456789" maxLength={11} dir="ltr" required
                    className="w-full bg-transparent text-white text-left outline-none px-3 text-sm placeholder:text-neutral-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-5">
                  <button type="submit" disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gold-500 bg-gold-500/10 text-gold-500 py-2.5 text-xs font-bold transition disabled:opacity-50">
                    پیامک
                  </button>
                  <button type="button" onClick={handleBaleLogin} disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#3B82F6] bg-[#3B82F6]/10 text-[#60A5FA] py-2.5 text-xs font-bold transition disabled:opacity-50">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.48 3 2 6.94 2 11.8c0 2.86 1.5 5.4 3.87 6.92L5 22l3.66-1.89c1.06.3 2.19.46 3.34.46 5.52 0 10-3.94 10-8.8S17.52 3 12 3zm.55 12.57c-2.86 0-5.18-1.38-5.18-3.09 0-.8.6-1.53 1.5-2.06-.07-.28-.1-.57-.1-.87 0-1.8 1.45-3.26 3.24-3.26.68 0 1.31.21 1.84.57.4-.14.83-.22 1.28-.22 1.85 0 3.35 1.2 3.35 2.68 0 .66-.3 1.27-.8 1.74.14.33.22.7.22 1.08 0 1.71-2.32 3.09-5.18 3.09z" />
                    </svg>
                    بله
                  </button>
                </div>
              </form>

              <div className="relative flex items-center justify-center my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800" /></div>
                <div className="relative bg-surface-aiBubbleDark px-3 text-[10px] text-neutral-500">یا</div>
              </div>

              <button onClick={signInWithGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-surface-inputDark border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                ورود با حساب گوگل
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <button type="button" onClick={() => setStep('phone')}
                className="mb-4 flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition">
                ← ویرایش شماره
              </button>
              <p className="text-sm text-neutral-400 mb-5 leading-relaxed">
                کد ۶ رقمی ارسال‌شده از طریق <span className="font-bold text-white">{channel === 'bale' ? 'بله' : 'پیامک'}</span> به{' '}
                <span className="font-bold text-white" dir="ltr">{phone}</span> را وارد کنید.
              </p>
              {error && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{error}</div>}
              <form onSubmit={handleVerifyOtp}>
                <div className="flex justify-between gap-2 mb-6" dir="ltr">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="tel" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 bg-surface-inputDark border border-neutral-700 text-white text-center text-lg font-bold rounded-lg outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition"
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold text-sm rounded-xl py-2.5 transition active:scale-[0.98] mb-4 disabled:opacity-50">
                  {loading ? 'در حال تایید...' : 'تایید و ورود'}
                </button>
                <div className="text-center text-[11px] text-neutral-500">
                  {timer > 0 ? (
                    <>ارسال مجدد تا <span className="text-gold-500 font-bold" dir="ltr">۰{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span></>
                  ) : (
                    <button type="button" onClick={channel === 'bale' ? handleBaleLogin : () => handleSendSms()}
                      className="text-gold-500 hover:underline">ارسال مجدد کد</button>
                  )}
                </div>
              </form>
            </>
          )}

          <div className="mt-4 pt-3 border-t border-neutral-800/50 text-center text-[10px] text-neutral-500 leading-relaxed">
            با ورود به Docwize، <a href="#" className="text-neutral-300 hover:text-gold-500">شرایط و قوانین</a> و{' '}
            <a href="#" className="text-neutral-300 hover:text-gold-500">حریم خصوصی</a> ما را می‌پذیرید.
          </div>
        </div>
      </div>
    </div>
  );
}
