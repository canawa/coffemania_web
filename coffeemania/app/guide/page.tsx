"use client";

import Link from "next/link";

export default function GuidePage() {
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
        <div className="max-w-5xl mx-auto bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-8 md:p-12 shadow-sm space-y-10">
          <header>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
              Как установить VPN
            </h1>
            <p className="mt-4 text-on-surface-variant">
              Пошаговая инструкция по установке клиента Amnezia и подключению по ключу.
            </p>
          </header>

          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-primary">1) Установка клиента</h2>
            <p className="text-on-surface-variant">
              Скачайте клиент Amnezia с официальных источников:
            </p>
            <ul className="space-y-2 text-on-surface-variant">
              <li>
                Windows:{" "}
                <a
                  href="https://github.com/amnezia-vpn/amnezia-client/releases/download/4.8.11.4/AmneziaVPN_4.8.11.4_x64.exe"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline break-all"
                >
                  AmneziaVPN_4.8.11.4_x64.exe
                </a>
              </li>
              <li>
                Android:{" "}
                <a
                  href="https://play.google.com/store/apps/details?id=org.amnezia.vpn&hl=ru"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline break-all"
                >
                  Google Play
                </a>
              </li>
              <li>
                iOS / macOS:{" "}
                <a
                  href="https://apps.apple.com/us/app/amneziavpn/id1600529900"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline break-all"
                >
                  App Store
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-primary">2) Настройка приложения</h2>
            <ol className="space-y-3 text-on-surface-variant list-decimal pl-5">
              <li>Нажмите значок <b>«+»</b> в нижней панели приложения.</li>
              <li>Скопируйте ключ, который вы приобрели в личном кабинете.</li>
              <li>Вставьте ключ в поле ввода и нажмите <b>Continue</b>.</li>
              <li>Нажмите <b>Connect</b> и дождитесь статуса подключения.</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Иллюстрации по шагам</h3>

            <div className="rounded-xl overflow-hidden border border-outline-variant/20 max-w-md mx-auto">
              <img
                src="/guide/guide-1.jpg"
                alt="Шаг 1: нажмите плюс в нижней панели"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="rounded-xl overflow-hidden border border-outline-variant/20 max-w-md mx-auto">
              <img
                src="/guide/guide-2.jpg"
                alt="Шаг 2: вставьте ключ и нажмите Continue"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="rounded-xl overflow-hidden border border-outline-variant/20 max-w-md mx-auto">
              <img
                src="/guide/guide-3.jpg"
                alt="Шаг 3: нажмите Connect и проверьте статус"
                className="w-full h-auto object-cover"
              />
            </div>
          </section>

          <p className="text-on-surface-variant">
            Теперь можно наслаждаться VPN.
          </p>
        </div>
      </main>
    </div>
  );
}
