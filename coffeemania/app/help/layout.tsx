import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { createPageMetadata, faqPageJsonLd, HELP_FAQ_ITEMS } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Помощь и ЧАВО",
  description:
    "Ответы на частые вопросы о подписке, оплате, входе в личный кабинет и реферальной программе Coffee Mania VPN.",
  path: "/help",
  keywords: ["VPN помощь", "VPN FAQ", "как подключить VPN"],
});

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(HELP_FAQ_ITEMS)} />
      {children}
    </>
  );
}
