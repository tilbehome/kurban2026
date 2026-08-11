import Link from "next/link";
import { AdminShell, PageHead } from "../../src/components";

export default function UnauthorizedPage() {
  return <AdminShell><PageHead title="Bu işlem için yetkiniz yok" description="Platform oturumunuz açık, ancak rolünüz bu sayfanın application iznine sahip değil."/><section className="card"><p>Yetki değişikliği gerekiyorsa Platform Super Admin ile iletişime geçin. Deneme audit kaydı güvenli hata koduyla izlenebilir.</p><Link className="button secondary" href="/">Komuta Merkezine dön</Link></section></AdminShell>;
}
