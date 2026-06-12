import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Реферальная программа",
  description: "Реферальная программа Coffee Mania VPN для авторизованных пользователей.",
  path: "/referral",
  noIndex: true,
});

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return children;
}
