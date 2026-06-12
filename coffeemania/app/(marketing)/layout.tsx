import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import {
  createPageMetadata,
  organizationJsonLd,
  SITE_NAME,
  webSiteJsonLd,
} from "@/lib/seo";

const homeMeta = createPageMetadata({
  title: SITE_NAME,
  description:
    "VPN по цене чашки кофе: стабильные протоколы, серверы в Германии, Австрии и России, обход блокировок и глушилок. Тарифы от 149₽, подключение за пару минут.",
  path: "/",
  keywords: ["VPN дешево", "VPN тарифы", "обход глушилок"],
});

export const metadata: Metadata = {
  ...homeMeta,
  title: {
    absolute: `${SITE_NAME} — быстрый VPN по цене чашки кофе`,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
      {children}
    </>
  );
}
