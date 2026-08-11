export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="login"><section className="card"><h1>Platform Admin girişi</h1><p>Bu oturum tenant oturumlarından tamamen ayrıdır. Parola ve zorunlu MFA kodu gerekir.</p>{error ? <p className="error" role="alert">Giriş doğrulanamadı: {error}</p> : null}<form className="stack" action="/api/auth/login" method="post"><label>E-posta<input name="email" type="email" autoComplete="username" required /></label><label>Parola<input name="password" type="password" autoComplete="current-password" required /></label><label>6 haneli MFA kodu<input name="mfaCode" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required /></label><button className="button" type="submit">Güvenli giriş</button></form></section></main>;
}
