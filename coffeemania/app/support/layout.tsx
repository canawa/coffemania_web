import type { Metadata } from "next";
import { createPageMetadata, SUPPORT_TELEGRAM } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Поддержка",
  description: `Свяжитесь с поддержкой Coffee Mania VPN: Telegram ${SUPPORT_TELEGRAM}, email coffeemaniaVPN@gmail.com. Помощь с подключением, оплатой и личным кабинетом.`,
  path: "/support",
  keywords: ["VPN поддержка", "техподдержка VPN"],
});

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
