import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://coffeemaniavpn.ru"),
  title: {
    default: "Coffee Mania VPN",
    template: "%s | Coffee Mania VPN",
  },
  description:
    "Быстрый и удобный VPN-сервис: регистрация, пополнение баланса, покупка ключей и подключение за пару минут.",
  applicationName: "Coffee Mania VPN",
  keywords: [
    "VPN",
    "Coffee Mania VPN",
    "безопасный VPN",
    "VLESS",
    "vpn ключ",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://coffeemaniavpn.ru",
    siteName: "Coffee Mania VPN",
    title: "Coffee Mania VPN",
    description:
      "Надежный VPN-сервис с быстрым стартом, гибкими тарифами и удобным личным кабинетом.",
    locale: "ru_RU",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "Coffee Mania VPN",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Coffee Mania VPN",
    description:
      "Надежный VPN-сервис с быстрым стартом, гибкими тарифами и удобным личным кабинетом.",
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className="light h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700;800&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
