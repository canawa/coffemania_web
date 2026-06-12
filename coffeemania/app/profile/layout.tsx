import type { Metadata } from "next";
import CabinetShell from "@/app/components/CabinetShell";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Личный кабинет",
  description: "Личный кабинет Coffee Mania VPN.",
  path: "/profile",
  noIndex: true,
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <CabinetShell>{children}</CabinetShell>;
}
