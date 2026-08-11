"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="login"><section className="card"><h1>Platform işlemi tamamlanamadı</h1><p>Hassas altyapı ayrıntıları gösterilmedi. Tekrar deneyebilir veya audit kaydındaki request kimliğiyle destek isteyebilirsiniz.</p><button className="button" type="button" onClick={reset}>Tekrar dene</button></section></main>;
}
