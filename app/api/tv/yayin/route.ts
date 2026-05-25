import { getTumVeriler } from "@/modules/tv/lib/tv.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Edge'de setInterval davranışı farklı

/**
 * TV canlı yayın — Server-Sent Events stream.
 *
 * - Her 3 saniyede `tumVeriler` çekilir ve client'a push edilir
 * - Heartbeat: 30 saniyede bir ':' (yorum) — bağlantı canlı tutar
 * - Browser otomatik yeniden bağlanır (3-5sn)
 * - Public access (auth opsiyonel) — PII korunmuş veri
 */
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let kapali = false;

  const stream = new ReadableStream({
    async start(controller) {
      const gonder = async () => {
        if (kapali) return;
        try {
          const veri = await getTumVeriler();
          // SSE format: event + data + boş satır
          const payload =
            `event: guncelleme\ndata: ${JSON.stringify(veri)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          if (kapali) return;
          const hata = e instanceof Error ? e.message : "Bilinmeyen hata";
          const payload = `event: hata\ndata: ${JSON.stringify({ hata })}\n\n`;
          try {
            controller.enqueue(encoder.encode(payload));
          } catch {
            // controller kapalı olabilir
          }
        }
      };

      // İlk veri
      await gonder();

      // 3 saniyede bir push
      interval = setInterval(() => {
        void gonder();
      }, 3000);

      // 30 saniyede bir heartbeat (yorum satırı — client görmez ama bağlantı canlı)
      heartbeat = setInterval(() => {
        if (kapali) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // closed
        }
      }, 30000);

      // Client disconnect — abort signal
      req.signal.addEventListener("abort", () => {
        kapali = true;
        if (interval) clearInterval(interval);
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      kapali = true;
      if (interval) clearInterval(interval);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Nginx buffer bypass
      "X-Accel-Buffering": "no",
    },
  });
}
