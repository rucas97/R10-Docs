'use client';

// NOTE: This component renders outside the root layout on purpose.
// It MUST NOT call useContext or any hook that depends on providers.
// The `reset` prop is intentionally unused — using it requires hooks.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="fa" dir="rtl">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8fafc' }}>
          <div style={{ maxWidth: 480, textAlign: 'center', background: 'white', borderRadius: 24, padding: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>خطایی رخ داد</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>متأسفانه مشکلی پیش آمد.</p>
            <a href="/" style={{ display: 'inline-block', padding: '10px 20px', background: '#7c3aed', color: 'white', borderRadius: 14, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              بازگشت به صفحه اصلی
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
