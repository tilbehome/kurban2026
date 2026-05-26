"use client";

/**
 * Root layout dahil her şey crash ederse devreye girer — Next.js App Router
 * en üst seviye error boundary. Burada <html>/<body> de bizim olmak zorunda
 * çünkü layout render edilemedi.
 *
 * SPRINT-P3 İŞ 2: Tailwind / shadcn import etmiyoruz (CSS yüklenememiş
 * olabilir), inline style kullanıyoruz.
 */

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fafaf9",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            background: "white",
            padding: 24,
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "2px solid #fecaca",
            margin: 16,
          }}
        >
          <h1
            style={{
              color: "#dc2626",
              fontSize: 18,
              margin: "0 0 8px",
            }}
          >
            ⚠️ Kritik Sistem Hatası
          </h1>
          <p
            style={{
              color: "#57534e",
              fontSize: 14,
              margin: "0 0 12px",
              lineHeight: 1.5,
            }}
          >
            Sistem yeniden başlatılması gerekiyor. Eğer az önce tahsilat
            aldıysanız, sayfa yüklendikten sonra <strong>Tahsilat Listesi</strong>
            &apos;nden kontrol edin — çift ödeme almayın.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#a8a29e",
                fontSize: 11,
                fontFamily: "monospace",
                margin: "0 0 12px",
                wordBreak: "break-all",
              }}
            >
              Hata Kodu: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: 12,
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sistemi Yenile
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#a8a29e",
              margin: "12px 0 0",
            }}
          >
            Sorun devam ederse: 0530 889 54 34
          </p>
        </div>
      </body>
    </html>
  );
}
