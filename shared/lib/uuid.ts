/**
 * UUID v4 üretimi — insecure context (HTTP + IP) için fallback ile.
 *
 * Sorun: `crypto.randomUUID()` Web Crypto API'sinin parçası ve sadece
 * "secure context" (HTTPS veya localhost) altında çalışır.
 * `http://192.168.1.89:3000` gibi LAN IP'siyle HTTP erişimde tarayıcı bu
 * API'yi `undefined` olarak bırakır → `TypeError: not a function`.
 *
 * Bayram günü personel/müşteri telefonları LAN IP'sinden açacak → fallback şart.
 * SSR / Node tarafında `crypto.randomUUID` her durumda mevcut.
 */

export function uuidv4(): string {
  // 1) Native API (HTTPS veya localhost)
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // Bazı tarayıcılar throw eder, fallback'e geç
    }
  }

  // 2) crypto.getRandomValues (insecure context'te de var) — RFC 4122 v4
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  // 3) Son çare: Math.random (kriptografik değil — sadece very-old browser)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
