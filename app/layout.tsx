import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { PWAYukleBildirimi } from "@/shared/components/PWAYukleBildirimi";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "TilbeCore – Kurban Takip",
    template: "%s · TilbeCore",
  },
  description:
    "TilbeCore – Kurban Takip: müşteri, satış, finans, kesim, teslimat ve saha operasyonları için profesyonel çok firmalı ürün.",
  applicationName: "TilbeCore – Kurban Takip",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kurban Takip",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/icons/apple-icon-120.png", sizes: "120x120" },
      { url: "/icons/apple-icon-152.png", sizes: "152x152" },
      { url: "/icons/apple-icon-167.png", sizes: "167x167" },
      { url: "/icons/apple-icon-180.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#DE0B1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const acceptLanguage = (await headers()).get("accept-language")?.toLowerCase() ?? "tr";
  const language = acceptLanguage.startsWith("ar") ? "ar" : acceptLanguage.startsWith("en") ? "en" : "tr";
  return (
    <html lang={language} dir={language === "ar" ? "rtl" : "ltr"} className={`${inter.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        {children}
        <PWAYukleBildirimi />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 4000 }}
        />
      </body>
    </html>
  );
}
