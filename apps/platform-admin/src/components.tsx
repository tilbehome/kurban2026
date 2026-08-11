import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  ["/", "Komuta Merkezi"], ["/organizations", "Firmalar"], ["/provisioning", "Provisioning"],
  ["/plans", "Plan ve Lisans"], ["/domains", "Domainler"], ["/backups", "Backup / Restore"],
  ["/support", "SupportSession"], ["/users", "Kullanıcılar"], ["/audit", "Audit ve Olaylar"],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  return <div className="shell"><aside className="sidebar"><div className="brand">TilbeCore<small>Platform Komuta Merkezi</small></div><nav className="nav" aria-label="Platform yönetimi">{NAV.map(([href,label]) => <Link key={href} href={href}>{label}</Link>)}</nav><form action="/api/auth/logout" method="post" style={{marginTop:24}}><button className="button secondary" type="submit">Güvenli çıkış</button></form></aside><main className="main">{children}</main></div>;
}

export function PageHead({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="page-head"><div><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

export function JsonPanel({ value }: { value: unknown }) {
  return <pre className="json">{JSON.stringify(value, (_key,item: unknown) => isSensitiveKey(_key) ? "[GİZLİ]" : item, 2)}</pre>;
}

function isSensitiveKey(key: string): boolean { return /password|tokenHash|secretCiphertext|databaseUrl|connectionString/i.test(key); }

export function formatDate(value: unknown): string { if (!value) return "—"; const date = new Date(String(value)); return Number.isNaN(date.valueOf()) ? String(value) : new Intl.DateTimeFormat("tr-TR", { dateStyle:"medium", timeStyle:"short" }).format(date); }
