"use client";

import Link from "next/link";

export default function HelpPage() {
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
        <div className="max-w-5xl mx-auto bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-8 md:p-12 shadow-sm">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            Помощь (ЧАВО)
          </h1>
          <p className="mt-4 text-on-surface-variant">
            Краткие ответы на самые частые вопросы по подключению, оплате и работе кабинета.
          </p>

          <section className="mt-10 space-y-6 text-on-surface-variant">
            <div className="rounded-xl bg-surface-container-low p-5">
              <h2 className="text-lg font-bold text-primary">Как получить VPN-ключ?</h2>
              <p className="mt-2">
                Пополните баланс в личном кабинете, откройте «Добавить ключ», выберите страну и длительность,
                затем нажмите «Оплатить». Ключ появится в списке автоматически.
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5">
              <h2 className="text-lg font-bold text-primary">Как подключиться в приложении Amnezia?</h2>
              <p className="mt-2">
                Откройте приложение, нажмите «+», вставьте ваш ключ, нажмите Continue и затем Connect.
                Подробная инструкция доступна на странице «Guide».
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5">
              <h2 className="text-lg font-bold text-primary">Почему не проходит вход в кабинет?</h2>
              <p className="mt-2">
                Проверьте корректность email/пароля и включены ли cookies в браузере.
                Если проблема не исчезает, обратитесь в поддержку.
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5">
              <h2 className="text-lg font-bold text-primary">Как работает реферальная программа?</h2>
              <p className="mt-2">
                Вы создаете авторский промокод один раз и делитесь им с друзьями.
                На странице «Реферальная программа» отображаются количество депозитов по коду и их сумма.
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5">
              <h2 className="text-lg font-bold text-primary">Куда писать, если нужна помощь?</h2>
              <p className="mt-2">
                Telegram: <span className="font-bold text-primary">@CoffemaniaSupport</span> или
                страница «Поддержка».
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
