"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";

type HeaderTab = "home" | "prices";

export default function SiteHeader(props: { activeTab?: HeaderTab; logoClassName?: string }) {
  const { activeTab, logoClassName = "dark:brightness-0 dark:invert" } = props;
  const router = useRouter();
  const [isCheckingCabinet, setIsCheckingCabinet] = useState(false);

  const handleCabinetClick = async () => {
    if (isCheckingCabinet) return;
    setIsCheckingCabinet(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/balance`, {
        method: "GET",
        credentials: "include",
      });
      if (res.status === 401) return;
      router.push(res.ok ? "/profile" : "/register");
    } catch {
      router.push("/register");
    } finally {
      setIsCheckingCabinet(false);
    }
  };

  const tabClass = (tab: HeaderTab) =>
    `pb-1 transition-colors duration-300 border-b-2 ${
      activeTab === tab
        ? "text-[#3D1C1C] dark:text-[#ffba38] font-bold border-[#3D1C1C] dark:border-[#ffba38]"
        : "text-[#B09080] dark:text-[#efeeea] border-transparent hover:text-[#3D1C1C] dark:hover:text-[#ffba38]"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-[#EDE0D8] dark:bg-[#1a1110] border-none shadow-none">
      <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 sm:gap-3 w-full px-3 md:px-8 py-2.5 md:py-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <img
            src="/logo.svg"
            alt="Логотип"
            className={`w-8 h-8 object-contain ${logoClassName}`.trim()}
          />
          <div className="text-xs sm:text-xl md:text-2xl font-serif font-bold text-[#3D1C1C] dark:text-[#f2e8df] whitespace-nowrap">
            <span className="bg-[#C8B8A8] dark:bg-orange-300 px-1 text-[#3D1C1C]">КОФЕМАНИЯ</span>
            <span className="hidden sm:inline"> ВПН</span>
          </div>
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <Link className={tabClass("home")} href="/">
            Главная
          </Link>
          <Link className={tabClass("prices")} href="/#prices">
            Цены
          </Link>
        </div>
        <button
          className="ml-auto sm:ml-0 shrink-0 bg-button text-on-button px-2.5 sm:px-6 py-2 rounded-full text-[11px] sm:text-base font-bold hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
          onClick={handleCabinetClick}
          disabled={isCheckingCabinet}
          type="button"
        >
          {isCheckingCabinet ? "Проверяем..." : "Личный кабинет"}
        </button>
      </div>
      <div className="bg-[#DDD0C8] dark:bg-[#423431] h-px w-full" />
    </nav>
  );
}
