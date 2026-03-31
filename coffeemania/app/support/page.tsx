"use client";

import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-fixed flex flex-col">
      <SiteHeader />

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
      <SiteFooter />
    </div>
  );
}
