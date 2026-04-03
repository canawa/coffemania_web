import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админ-панель",
  description: "Служебный доступ для администраторов.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
