"use client";

import { useState, useTransition, type ComponentType, type ReactNode } from "react";
import { Bike, Boxes, ClipboardCheck, FileKey2, Monitor, QrCode, Scale, Scissors, ShieldAlert, Smartphone, Snowflake, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Panel = "proxy" | "qr" | "slaughter" | "weighing" | "packaging" | "delivery" | "field" | "tv";

interface Props {
  defaultSeasonId?: string;
  permissions: {
    canProxy: boolean;
    canSlaughter: boolean;
    canWeigh: boolean;
    canPackage: boolean;
    canDeliver: boolean;
    canField: boolean;
    canTv: boolean;
  };
}

const panels: Array<{ id: Panel; title: string; desc: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "proxy", title: "Vekâlet & belge", desc: "Hisse bazlı vekâlet, korumalı dosya, belge sürümü", icon: FileKey2 },
  { id: "qr", title: "QR güvenliği", desc: "Süreli, tek kullanımlık, amaç ayrımlı token", icon: QrCode },
  { id: "slaughter", title: "Kesim motoru", desc: "Durum makinesi ve istasyon kuyruğu", icon: Scissors },
  { id: "weighing", title: "Tartım", desc: "Append-only gerçek kilo ve düzeltme gerekçesi", icon: Scale },
  { id: "packaging", title: "Paketleme", desc: "Etiket, izlenebilirlik, soğuk oda hazırlığı", icon: Boxes },
  { id: "delivery", title: "Teslimat", desc: "Tek teslim, geri alma olayı, borçlu istisna onayı", icon: Truck },
  { id: "field", title: "Saha PWA", desc: "Offline sınıfları, idempotent kuyruk, acil salt-okunur", icon: Smartphone },
  { id: "tv", title: "TV projection", desc: "PII/finans içermeyen canlı operasyon yayını", icon: Monitor },
];

export function QurbanOperationsWorkspace({ defaultSeasonId, permissions }: Props) {
  const [panel, setPanel] = useState<Panel>("slaughter");
  const [pending, startTransition] = useTransition();
  const [seasonId, setSeasonId] = useState(defaultSeasonId ?? "");
  const [animalId, setAnimalId] = useState("");
  const [shareCardId, setShareCardId] = useState("");
  const [shareId, setShareId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [shareIds, setShareIds] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [storageKey, setStorageKey] = useState("tenant-documents/proxy/");
  const [qrToken, setQrToken] = useState("");
  const [jobId, setJobId] = useState("");
  const [nextStatus, setNextStatus] = useState("slaughtering");
  const [weightKg, setWeightKg] = useState("0.000");
  const [labelNo, setLabelNo] = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const [reason, setReason] = useState("");
  const [logs, setLogs] = useState<Array<{ id: string; title: string; ok: boolean; detail: string }>>([]);

  function post(title: string, body: Record<string, unknown>, key = `${title}:${Date.now()}`) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/tenant/operations", {
          method: "POST",
          headers: { "content-type": "application/json", "idempotency-key": key },
          body: JSON.stringify(body),
        });
        const json = await response.json().catch(() => ({ error: "EMPTY_RESPONSE" }));
        setLogs((items) => [{ id: crypto.randomUUID(), title, ok: response.ok, detail: JSON.stringify(json, null, 2) }, ...items].slice(0, 10));
      } catch (error) {
        setLogs((items) => [{ id: crypto.randomUUID(), title, ok: false, detail: error instanceof Error ? error.message : "İstemci hatası" }, ...items].slice(0, 10));
      }
    });
  }

  const active = panels.find((item) => item.id === panel)!;
  const ActiveIcon = active.icon;

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-neutral-950 text-neutral-100">
      <div className="border-b border-neutral-800 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-100">Tenant izolasyonlu</Badge>
              <Badge className="bg-blue-500/15 text-blue-100">Audit + outbox + idempotency</Badge>
              <Badge className="bg-amber-500/15 text-amber-100">Dinî uygunluk kararı uydurulmaz</Badge>
              <Badge className="bg-red-500/15 text-red-100">TV’de PII/finans yok</Badge>
            </div>
            <h2 className="mt-2 text-2xl font-semibold">Faz 7–10 Kurban Operasyon Komuta Merkezi</h2>
            <p className="text-sm text-neutral-400">Masaüstünde operasyon komuta merkezi, tablette istasyon görünümü, mobilde eldivenle kullanılabilir görev akışı.</p>
          </div>
          <Field label="Sezon ID">
            <Input value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="w-full border-neutral-700 bg-neutral-900 text-neutral-100 xl:w-80" placeholder="season_..." />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="hidden rounded-2xl border border-neutral-800 bg-neutral-900/80 p-2 lg:block">
          {panels.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setPanel(item.id)} className={`mb-1 flex w-full gap-3 rounded-xl px-3 py-3 text-left ${panel === item.id ? "bg-orange-500/15 text-orange-100 ring-1 ring-orange-400/30" : "text-neutral-300 hover:bg-neutral-800"}`}>
                <Icon className="mt-0.5 h-5 w-5" />
                <span><span className="block text-sm font-medium">{item.title}</span><span className="block text-xs text-neutral-500">{item.desc}</span></span>
              </button>
            );
          })}
        </aside>

        <main className="rounded-2xl border border-neutral-800 bg-neutral-900/70">
          <div className="flex gap-2 overflow-x-auto border-b border-neutral-800 p-2 lg:hidden">
            {panels.map((item) => <Button key={item.id} size="sm" variant={panel === item.id ? "default" : "secondary"} className="shrink-0" onClick={() => setPanel(item.id)}>{item.title}</Button>)}
          </div>
          <div className="border-b border-neutral-800 p-4">
            <div className="flex items-center gap-3"><ActiveIcon className="h-6 w-6 text-orange-300" /><div><h3 className="font-semibold">{active.title}</h3><p className="text-sm text-neutral-400">{active.desc}</p></div></div>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              {panel === "proxy" && (
                <OpCard title="Hisse bazlı vekâlet ve korumalı belge" icon={FileKey2}>
                  <Grid>
                    <Field label="Vekâlet veren müşteri ID"><Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} /></Field>
                    <Field label="Hisse ID'leri"><Input value={shareIds} onChange={(e) => setShareIds(e.target.value)} placeholder="share_1, share_2" /></Field>
                    <Field label="Belge ID"><Input value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="proxy_document_..." /></Field>
                    <Field label="Korumalı storage key"><Input value={storageKey} onChange={(e) => setStorageKey(e.target.value)} /></Field>
                  </Grid>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !permissions.canProxy} onClick={() => post("Vekâlet belgesi", { action: "proxy-document", id: documentId || `proxy_${crypto.randomUUID()}`, seasonId, grantorCustomerId: customerId, shareIds: split(shareIds), method: "face_to_face_oral", storageKey, status: "signed" })}>Sözlü/yüz yüze vekâlet kaydet</Button>
                    <Button variant="secondary" disabled={pending || !permissions.canProxy || !documentId} onClick={() => post("Belge iptali", { action: "revoke-proxy-document", id: documentId, seasonId, reason: reason || "Belge yenileme/iptal gerekçesi" })}>Belgeyi iptal et</Button>
                  </div>
                  <Rule>Dosya `public/` altında olamaz; tek kanıt birden fazla hisseye bağlanabilir.</Rule>
                </OpCard>
              )}

              {panel === "qr" && (
                <OpCard title="Amaç ayrımlı tek kullanımlık QR" icon={QrCode}>
                  <Grid>
                    <Field label="Hedef kayıt ID"><Input value={shareId} onChange={(e) => setShareId(e.target.value)} /></Field>
                    <Field label="Opaque token"><Input value={qrToken} onChange={(e) => setQrToken(e.target.value)} placeholder="consume için" /></Field>
                  </Grid>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !permissions.canProxy} onClick={() => post("Teslim QR üret", { action: "issue-qr", id: `qr_${crypto.randomUUID()}`, purpose: "delivery", targetId: shareId, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() })}>Teslim QR üret</Button>
                    <Button disabled={pending || !permissions.canProxy || !qrToken} variant="secondary" onClick={() => post("QR tüket", { action: "consume-qr", opaqueToken: qrToken, purpose: "delivery" })}>QR tüket / tekrar kullanımı kapat</Button>
                  </div>
                </OpCard>
              )}

              {panel === "slaughter" && (
                <OpCard title="Merkezi kesim state machine" icon={Scissors}>
                  <Grid>
                    <Field label="Hayvan ID"><Input value={animalId} onChange={(e) => setAnimalId(e.target.value)} /></Field>
                    <Field label="ShareCard ID"><Input value={shareCardId} onChange={(e) => setShareCardId(e.target.value)} /></Field>
                    <Field label="SlaughterJob ID"><Input value={jobId} onChange={(e) => setJobId(e.target.value)} /></Field>
                    <Field label="Sonraki durum"><Input value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} placeholder="slaughtering/weighing/packing..." /></Field>
                  </Grid>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !permissions.canSlaughter} onClick={() => post("Kesim işi oluştur", { action: "create-slaughter-job", id: jobId || `slaughter_${crypto.randomUUID()}`, seasonId, animalId, shareCardId, queueNo: 1 })}>7 vekâlet kontrolüyle hazırla</Button>
                    <Button variant="secondary" disabled={pending || !permissions.canSlaughter || !jobId} onClick={() => post("Kesim durum geçişi", { action: "advance-slaughter", id: jobId, seasonId, nextStatus, reason: reason || "İstasyon geçişi" })}>Durumu ilerlet</Button>
                  </div>
                  <Rule>Hazırlık → vekâlet/uygunluk → kesim → tartım → paketleme → teslime hazır zinciri atlatılamaz.</Rule>
                </OpCard>
              )}

              {panel === "weighing" && (
                <OpCard title="Append-only tartım ve düzeltme" icon={Scale}>
                  <Grid>
                    <Field label="Hayvan ID"><Input value={animalId} onChange={(e) => setAnimalId(e.target.value)} /></Field>
                    <Field label="Karkas kg"><Input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} inputMode="decimal" /></Field>
                  </Grid>
                  <Field label="Düzeltme/ölçüm gerekçesi"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  <Button disabled={pending || !permissions.canWeigh} onClick={() => post("Tartım kaydı", { action: "record-weighing", id: `weighing_${crypto.randomUUID()}`, seasonId, animalId, carcassWeightKg: weightKg, reason })}>Tartımı append-only kaydet</Button>
                </OpCard>
              )}

              {panel === "packaging" && (
                <OpCard title="Paketleme, etiket ve soğuk oda hazırlığı" icon={Boxes}>
                  <Grid>
                    <Field label="Hisse ID"><Input value={shareId} onChange={(e) => setShareId(e.target.value)} /></Field>
                    <Field label="Brüt kg"><Input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} inputMode="decimal" /></Field>
                    <Field label="Etiket no"><Input value={labelNo} onChange={(e) => setLabelNo(e.target.value)} /></Field>
                  </Grid>
                  <Button disabled={pending || !permissions.canPackage} onClick={() => post("Paket oluştur", { action: "create-package", id: `package_${crypto.randomUUID()}`, seasonId, shareId, grossWeightKg: weightKg, labelNo: labelNo || `LBL-${Date.now()}`, reason })}>Paket/etiket oluştur</Button>
                  <Rule>Kaynak hayvan → hisse → paket izi korunur; yeniden baskı gerekçesi audit’e gider.</Rule>
                </OpCard>
              )}

              {panel === "delivery" && (
                <OpCard title="Teslimat ve geri alma olayı" icon={Truck}>
                  <Grid>
                    <Field label="Delivery ID"><Input value={deliveryId} onChange={(e) => setDeliveryId(e.target.value)} /></Field>
                    <Field label="Hisse ID"><Input value={shareId} onChange={(e) => setShareId(e.target.value)} /></Field>
                    <Field label="Müşteri ID"><Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} /></Field>
                    <Field label="Teslim alan / gerekçe"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  </Grid>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !permissions.canDeliver} onClick={() => post("Teslimat", { action: "record-delivery", id: deliveryId || `delivery_${crypto.randomUUID()}`, seasonId, shareId, customerId, receiverName: reason })}>Tek sefer teslim et</Button>
                    <Button variant="secondary" disabled={pending || !permissions.canDeliver || !deliveryId} onClick={() => post("Teslim geri alma", { action: "reverse-delivery", id: deliveryId, seasonId, reason: reason || "Teslimat düzeltme olayı" })}>Geri alma olayı oluştur</Button>
                  </div>
                  <Rule>Borçlu teslim override normal akış değildir; ApprovalPolicy ve gerekçe ister.</Rule>
                </OpCard>
              )}

              {panel === "field" && (
                <OpCard title="Saha PWA offline sınıfları" icon={Smartphone}>
                  <Field label="Güvenli offline payload"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder='{"operation":"station-note","recordId":"..."}' /></Field>
                  <Button disabled={pending || !permissions.canField} onClick={() => post("Offline kuyruğa al", { action: "enqueue-offline", id: `offline_${crypto.randomUUID()}`, operation: "station-note", payload: safeJson(reason) })}>O1/O2 güvenli komutu kuyruğa al</Button>
                  <Rule>Kritik satış, finans, kesim onayı ve teslimat offline başarılı gösterilmez.</Rule>
                </OpCard>
              )}

              {panel === "tv" && (
                <OpCard title="Anonim TV projection" icon={Monitor}>
                  <Button disabled={pending || !permissions.canTv || !seasonId} onClick={() => post("TV projection", { action: "tv-projection", seasonId }, `tv:${seasonId}`)}>PII içermeyen akışı getir</Button>
                  <Rule>Yalnız kurban numarası, sıra ve operasyon durumu; müşteri, telefon, finans, borç, vekâlet yok.</Rule>
                </OpCard>
              )}
            </div>

            <aside className="space-y-3">
              <Status icon={ClipboardCheck} title="Faz 7" text="Vekâlet, korumalı belge, QR" />
              <Status icon={Scissors} title="Faz 8" text="Kesim state machine ve sıra" />
              <Status icon={Snowflake} title="Faz 9" text="Tartım, paket, soğuk oda sınıfı" />
              <Status icon={Bike} title="Faz 10" text="Teslimat, PWA, TV, takip" />
              <Status icon={ShieldAlert} title="Güvenlik" text="DENY > ALLOW, tenant scope, server authorization" />
            </aside>
          </div>
        </main>

        <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/80">
          <div className="border-b border-neutral-800 p-4"><h3 className="font-semibold">Canlı komut geçmişi</h3></div>
          <div className="max-h-[680px] space-y-3 overflow-auto p-3">
            {logs.length === 0 ? <p className="rounded-xl border border-dashed border-neutral-700 p-4 text-sm text-neutral-400">Henüz komut yok. Her işlem tenant API, audit, outbox ve idempotency hattından geçer.</p> : logs.map((log) => <details key={log.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3" open={logs[0]?.id === log.id}><summary className="cursor-pointer text-sm"><span className={log.ok ? "text-emerald-300" : "text-red-300"}>{log.ok ? "OK" : "HATA"}</span> · {log.title}</summary><pre className="mt-2 whitespace-pre-wrap text-xs text-neutral-400">{log.detail}</pre></details>)}
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 grid grid-cols-4 gap-2 border-t border-neutral-800 bg-neutral-950 p-3 text-center text-xs lg:hidden">
        <span>Bağlantı: çevrimiçi</span><span>Sync: açık</span><span>Panel: {active.title}</span><span>{pending ? "Çalışıyor…" : "Hazır"}</span>
      </div>
    </div>
  );
}

function OpCard({ title, icon: Icon, children }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return <Card className="border-neutral-800 bg-neutral-950/80 text-neutral-100"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-orange-300" />{title}</CardTitle></CardHeader><CardContent className="space-y-4">{children}</CardContent></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-neutral-300">{label}</Label>{children}</div>;
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Rule({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">{children}</div>;
}

function Status({ icon: Icon, title, text }: { icon: ComponentType<{ className?: string }>; title: string; text: string }) {
  return <div className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 text-sm"><Icon className="mt-0.5 h-5 w-5 text-blue-300" /><span><strong>{title}</strong><br /><span className="text-neutral-400">{text}</span></span></div>;
}

function split(value: string): string[] {
  return value.split(/[,\n ]+/).map((item) => item.trim()).filter(Boolean);
}

function safeJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return { note: value };
  }
}
