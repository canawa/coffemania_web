"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
import { useSiteTheme } from "@/lib/useSiteTheme";

function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  onOutside: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      for (const ref of refs) {
        const el = ref.current;
        if (el && el.contains(target)) return;
      }
      onOutside();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [enabled, onOutside, refs]);
}

function navItemClass(active: boolean) {
  return active
    ? "bg-[#C8B8A8] dark:bg-[#423431] text-[#3D1C1C] dark:text-[#f2e8df] rounded-full px-4 py-3 font-bold flex items-center gap-3 translate-x-1 transition-transform duration-200"
    : "text-[#B09080] dark:text-[#8c7a72] px-4 py-3 flex items-center gap-3 hover:bg-[#EDE0D8] dark:hover:bg-[#423431]/50 rounded-full transition-all";
}

const logoutButtonClass =
  "bg-[#C8B8A8] text-[#3D1C1C] dark:bg-[#423431] dark:text-[#f2e8df] hover:bg-[#ba1a1a] hover:text-[#ede0d8] dark:hover:bg-[#93000a] dark:hover:text-[#ffdad6] hover:shadow-md active:scale-95 transition-all duration-300 font-bold";

export default function CabinetShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isDark, setTheme } = useSiteTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  useClickOutside(
    [mobileMenuRef, mobileMenuButtonRef],
    () => setIsMobileMenuOpen(false),
    isMobileMenuOpen,
  );

  const handleLogout = async () => {
    try {
      await apiFetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
        skip401Redirect: true,
      });
    } catch {
      // ignore network errors — still redirect home
    }
    window.location.href = "/";
  };

  const isSubscription = pathname === "/profile";
  const isHelp = pathname === "/profile/help";

  return (
    <div className="bg-surface text-on-surface selection:bg-tertiary-fixed min-h-screen flex flex-col overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 z-[70]">
        <header className="relative bg-[#EDE0D8] dark:bg-[#1a1110]">
          <nav className="flex flex-wrap sm:flex-nowrap justify-between items-center w-full gap-2 sm:gap-3 px-4 md:px-8 py-3 md:py-4">
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo.svg" alt="Логитип" className="w-8 h-8 object-contain dark:brightness-0 dark:invert" />
              <div className="text-sm sm:text-xl md:text-2xl font-serif font-bold text-[#3D1C1C] dark:text-[#f2e8df] whitespace-nowrap">
                <span className="bg-[#C8B8A8] dark:bg-orange-300 px-1 text-[#3D1C1C]">КОФЕМАНИЯ</span>
                <span className="hidden sm:inline"> ВПН</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              <ThemeToggle isDark={isDark} onChange={setTheme} />
              <button
                onClick={() => void handleLogout()}
                type="button"
                className={`hidden md:inline-flex px-6 py-2 rounded-full ${logoutButtonClass}`}
              >
                Выйти
              </button>
              <button
                className="md:hidden text-primary"
                type="button"
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-label="Открыть меню"
                ref={mobileMenuButtonRef}
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
          </nav>
          <div className="bg-[#DDD0C8] dark:bg-[#423431] h-px w-full" />
          {isMobileMenuOpen ? (
            <div
              className="md:hidden absolute right-3 top-[calc(100%+8px)] z-[60]"
              ref={mobileMenuRef}
            >
              <div className="w-[260px] max-w-[72vw] rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-3 flex flex-col gap-2 shadow-2xl">
                <Link
                  href="/profile/help"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full px-4 py-3 rounded-xl text-primary font-semibold hover:bg-surface-container block"
                >
                  Помощь
                </Link>
                <button
                  onClick={() => void handleLogout()}
                  type="button"
                  className={`w-full text-left px-4 py-3 rounded-xl ${logoutButtonClass}`}
                >
                  Выйти
                </button>
              </div>
            </div>
          ) : null}
        </header>
      </div>

      <aside className="fixed left-0 top-24 bottom-0 hidden md:flex flex-col p-6 z-40 bg-[#DDD0C8] dark:bg-[#2b1f1d] w-64 rounded-r-3xl shadow-[0_12px_32px_-4px_rgba(27,28,26,0.06)]">
        <nav className="flex flex-col gap-2">
          <Link href="/profile" className={navItemClass(isSubscription)}>
            <span className="material-symbols-outlined">vpn_key</span>
            <span className="font-label">Моя подписка</span>
          </Link>
          <Link href="/profile/help" className={navItemClass(isHelp)}>
            <span className="material-symbols-outlined">help</span>
            <span className="font-label">Помощь</span>
          </Link>
        </nav>
      </aside>

      <main className="md:ml-64 pt-24 pb-12 px-4 md:px-8 lg:px-12 flex-1 min-w-0 max-w-full">
        {children}
      </main>

      <footer className="md:ml-64 w-full md:w-[calc(100%-16rem)] py-12 px-8 flex flex-col items-center gap-6 border-t border-[#DDD0C8] dark:border-[#423431] bg-[#EDE0D8] dark:bg-[#1A1110] mt-auto">
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] text-sm uppercase tracking-widest font-label" href="/about">О нас</a>
          <a className="text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] text-sm uppercase tracking-widest font-label" href="/privacy">Политика конфиденциальности</a>
          <a className="text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] text-sm uppercase tracking-widest font-label" href="/terms">Условия использования</a>
          <a className="text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] text-sm uppercase tracking-widest font-label" href="/support">Поддержка</a>
        </div>
        <p className="text-[#B09080] dark:text-[#8c7a72] text-xs uppercase tracking-widest font-label">© Coffee Mania VPN.</p>
      </footer>
    </div>
  );
}
