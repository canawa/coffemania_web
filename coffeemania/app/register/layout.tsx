import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Регистрация",
  description:
    "Создайте аккаунт Coffee Mania VPN за минуту: выберите тариф, оплатите подписку и получите ссылку для подключения в личном кабинете.",
  path: "/register",
  keywords: ["регистрация VPN", "создать аккаунт VPN"],
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
