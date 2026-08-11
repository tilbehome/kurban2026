import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "TilbeCore Platform Komuta Merkezi", robots: { index: false, follow: false } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
