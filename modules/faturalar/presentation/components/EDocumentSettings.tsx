export function EDocumentSettings() {
  return <div className="space-y-5">
    <header>
      <p className="text-sm font-semibold text-emerald-700">Firma Ayarları · Entegrasyonlar</p>
      <h1 className="text-2xl font-bold text-slate-900">e-Belge bağlantısı</h1>
      <p className="mt-1 text-sm text-slate-600">Her firma kendi sağlayıcı hesabını kullanır. Secret değeri alınmaz veya gösterilmez; yalnız secret-store referansı kaydedilir.</p>
    </header>
    <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <Field label="Provider"><select disabled className="input"><option>mock-sandbox (geliştirme)</option></select></Field>
      <Field label="Ortam"><select className="input"><option>TEST</option><option disabled>PRODUCTION — gerçek provider gerekli</option></select></Field>
      <Field label="Bağlantı adı"><input className="input" placeholder="Muhasebe test bağlantısı" /></Field>
      <Field label="Birim eşleme sürümü"><input className="input" placeholder="Doğrulanmış provider kılavuz sürümü" /></Field>
      <Field label="API endpoint"><input className="input" placeholder="Provider seçilince doğrulanır" /></Field>
      <Field label="Credential referansı"><input className="input" placeholder="secret://tenant/..." autoComplete="off" /></Field>
      <Field label="Webhook doğrulama referansı"><input className="input" placeholder="secret://tenant/..." autoComplete="off" /></Field>
      <Field label="Fatura serileri"><input className="input" placeholder="ALIS, SATIS" /></Field>
      <Field label="Gönderici birim / posta kutusu"><input className="input" placeholder="Provider alias bilgisi" /></Field>
      <div className="md:col-span-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Bağlantı testi gerçek provider seçilene ve şifreli credential referansı çözülene kadar canlı kabul kanıtı sayılmaz. Doğrulanmış sürümlü birim eşlemesi eksikse gönderim kapalıdır.</div>
      <button type="button" disabled className="md:col-span-2 rounded-xl bg-slate-300 px-4 py-2 font-semibold text-slate-600">Gerçek provider seçimi bekleniyor</button>
    </form>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-medium text-slate-700">{label}{children}</label>;
}
