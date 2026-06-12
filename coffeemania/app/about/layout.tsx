import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "О нас",
  description:
    "Coffee Mania VPN — сервис приватного и стабильного подключения к интернету. Регистрация, оплата и подключение за несколько минут.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
