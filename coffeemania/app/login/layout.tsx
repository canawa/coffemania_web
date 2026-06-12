import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Вход в личный кабинет",
  description: "Войдите в личный кабинет Coffee Mania VPN для управления подпиской и получения ссылки подключения.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
