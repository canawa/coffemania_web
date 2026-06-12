import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Пользовательское соглашение",
  description:
    "Условия использования сервиса Coffee Mania VPN: права и обязанности пользователей, оплата, подписка и ответственность.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
