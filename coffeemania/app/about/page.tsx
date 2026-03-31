"use client";

import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-fixed flex flex-col">
      <SiteHeader />

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
      <SiteFooter />
    </div>
  );
}
