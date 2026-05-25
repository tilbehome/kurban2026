/**
 * Dekont HTML yardımcı fonksiyonları.
 */

export function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;",
  );
}
