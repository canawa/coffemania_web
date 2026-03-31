"use client";

import Link from "next/link";

export default function AboutPage() {
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
            О нас
          </h1>

          <p className="mt-4 text-on-surface-variant leading-relaxed">
            Coffee Mania VPN — это сервис приватного и стабильного подключения к интернету.
            Мы помогаем пользователям быстро получать доступ к защищенному соединению без сложной
            настройки: регистрация, пополнение, получение ключа и подключение занимают считанные минуты.
          </p>

          <section className="mt-8 space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              Наша команда развивает инфраструктуру и личный кабинет, чтобы пользователям было удобно
              управлять ключами, контролировать баланс и получать поддержку в одном месте.
            </p>
            <p>
              Мы фокусируемся на простоте, прозрачности и качестве сервиса: понятные тарифы, аккуратный
              интерфейс и оперативная помощь по любым вопросам подключения.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
