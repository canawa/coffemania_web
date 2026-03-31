"use client";

import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-fixed">
      <nav className="sticky top-0 z-50 bg-[#fbf9f5] dark:bg-[#1b1c1a] border-none shadow-none">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <Link
            className="flex items-center gap-2 text-2xl font-serif font-bold text-[#271310] dark:text-[#ffffff]"
            href="/"
          >
            <img src="/logo.svg" alt="Логотип" className="w-8 h-8 object-contain" />
            <div>
              <span className="bg-orange-200 dark:bg-orange-300 px-1 text-[#271310]">КОФЕМАНИЯ</span> ВПН
            </div>
          </Link>
          <Link
            className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
            href="/profile"
          >
            Личный кабинет
          </Link>
        </div>
        <div className="bg-surface-container dark:bg-[#2a2a28] h-px w-full" />
      </nav>

      <main className="px-8 py-14 md:py-20">
        <div className="max-w-4xl mx-auto bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-8 md:p-12 shadow-sm">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            Поддержка
          </h1>
          <p className="mt-4 text-on-surface-variant">
            Если у вас возникли вопросы по подключению, оплате, реферальной программе или работе
            личного кабинета, свяжитесь с нашей командой поддержки удобным для вас способом.
          </p>

          <section className="mt-10 space-y-5">
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/20 px-5 py-4">
              <div className="text-sm uppercase tracking-widest text-on-surface-variant font-bold">
                Telegram
              </div>
              <div className="mt-2 text-lg font-bold text-primary">
                @CoffemaniaSupport
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low border border-outline-variant/20 px-5 py-4">
              <div className="text-sm uppercase tracking-widest text-on-surface-variant font-bold">
                Email
              </div>
              <div className="mt-2 text-lg font-bold text-primary">
                coffeemaniaVPN@gmail.com
              </div>
            </div>

            <p className="text-sm text-on-surface-variant">
              Почту можно заменить на рабочий адрес в любой момент.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
