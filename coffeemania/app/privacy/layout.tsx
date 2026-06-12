import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Политика конфиденциальности",
  description:
    "Политика конфиденциальности Coffee Mania VPN: какие данные собираются, как используются и как защищаются.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
