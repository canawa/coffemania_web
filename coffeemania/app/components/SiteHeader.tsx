"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type HeaderTab = "home" | "prices" | "instructions";

export default function SiteHeader(props: { activeTab?: HeaderTab }) {
  const { activeTab } = props;
  const router = useRouter();
  const [isCheckingCabinet, setIsCheckingCabinet] = useState(false);

  const handleCabinetClick = async () => {
    if (isCheckingCabinet) return;
    setIsCheckingCabinet(true);
    try {
      const res = await fetch("https://api.coffeemaniavpn.ru/balance", {
        method: "GET",
        credentials: "include",
      });
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
        ? "text-[#271310] dark:text-[#ffba38] font-bold border-[#ffba38]"
        : "text-[#504442] dark:text-[#efeeea] border-transparent hover:text-[#271310] dark:hover:text-[#ffba38]"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-[#fbf9f5] dark:bg-[#1b1c1a] border-none shadow-none">
      <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 sm:gap-3 w-full px-3 md:px-8 py-2.5 md:py-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <img src="/logo.svg" alt="Логотип" className="w-8 h-8 object-contain" />
          <div className="text-xs sm:text-xl md:text-2xl font-serif font-bold text-[#271310] dark:text-[#ffffff] whitespace-nowrap">
            <span className="bg-orange-200 dark:bg-orange-300 px-1 text-[#271310]">КОФЕМАНИЯ</span>
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
          <Link className={tabClass("instructions")} href="/guide">
            Инструкции
          </Link>
        </div>
        <button
          className="ml-auto sm:ml-0 shrink-0 bg-primary text-on-primary px-2.5 sm:px-6 py-2 rounded-full text-[11px] sm:text-base font-bold hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
          onClick={handleCabinetClick}
          disabled={isCheckingCabinet}
          type="button"
        >
          {isCheckingCabinet ? "Проверяем..." : (
            <>
              <span className="sm:hidden">Кабинет</span>
              <span className="hidden sm:inline">Личный кабинет</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-surface-container dark:bg-[#2a2a28] h-px w-full" />
    </nav>
  );
}
