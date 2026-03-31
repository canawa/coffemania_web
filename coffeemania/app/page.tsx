"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [isCheckingCabinet, setIsCheckingCabinet] = useState(false);
  const router = useRouter();

  const handleCabinetClick = async () => {
    if (isCheckingCabinet) return;
    setIsCheckingCabinet(true);
    try {
      const res = await fetch(`${API_BASE_URL}/balance`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/profile");
      } else {
        router.push("/register");
      }
    } catch {
      router.push("/register");
    } finally {
      setIsCheckingCabinet(false);
    }
  };
  return (
    <div className="bg-surface text-on-surface selection:bg-tertiary-fixed min-h-full">
      <nav className="sticky top-0 z-50 bg-[#fbf9f5] dark:bg-[#1b1c1a] border-none shadow-none">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Логитип" className="w-8 h-8 object-contain" />
            <div className="text-2xl font-serif font-bold text-[#271310] dark:text-[#ffffff]">
              <span className="bg-orange-200 dark:bg-orange-300 px-1 text-[#271310]">КОФЕМАНИЯ</span> ВПН
            </div>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a
              onClick={() => setActiveTab('home')}
              className={`pb-1 transition-colors duration-300 border-b-2 ${activeTab === 'home' ? 'text-[#271310] dark:text-[#ffba38] font-bold border-[#ffba38]' : 'text-[#504442] dark:text-[#efeeea] border-transparent hover:text-[#271310] dark:hover:text-[#ffba38]'}`}
              href="#"
            >
              Главная
            </a>
            <a
              onClick={() => setActiveTab('prices')}
              className={`pb-1 transition-colors duration-300 border-b-2 ${activeTab === 'prices' ? 'text-[#271310] dark:text-[#ffba38] font-bold border-[#ffba38]' : 'text-[#504442] dark:text-[#efeeea] border-transparent hover:text-[#271310] dark:hover:text-[#ffba38]'}`}
              href="#prices"
            >
              Цены
            </a>
            <Link
              onClick={() => setActiveTab('instructions')}
              className={`pb-1 transition-colors duration-300 border-b-2 ${activeTab === 'instructions' ? 'text-[#271310] dark:text-[#ffba38] font-bold border-[#ffba38]' : 'text-[#504442] dark:text-[#efeeea] border-transparent hover:text-[#271310] dark:hover:text-[#ffba38]'}`}
              href="/guide"
            >
              Инструкции
            </Link>
          </div>
          <button
            className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
            onClick={handleCabinetClick}
            disabled={isCheckingCabinet}
            type="button"
          >
            {isCheckingCabinet ? "Проверяем..." : "Личный кабинет"}
          </button>
        </div>
        <div className="bg-surface-container dark:bg-[#2a2a28] h-px w-full" />
      </nav>

      <main>
        <section className="relative overflow-hidden py-24 md:py-32 px-8">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-primary leading-tight mb-6">
                VPN по цене чашки кофе
              </h1>
              <p className="text-on-surface-variant text-lg md:text-xl mb-10 max-w-md leading-relaxed">
                Надежное VLESS-шифрование с авторской скоростью. Ключи для серверов по всему миру.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  className="inline-flex items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-primary/20 transition-all"
                  href="#prices"
                >
                  Выбрать тариф
                </a>
                <Link
                  className="inline-flex items-center justify-center border border-outline-variant/30 text-primary px-10 py-4 rounded-full text-lg font-semibold hover:bg-surface-container transition-all"
                  href="/guide"
                >
                  Как это работает
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-tertiary-fixed opacity-20 blur-3xl rounded-full" />
              <div className="relative z-10 rounded-xl overflow-hidden aspect-square shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 bg-surface-container-low">
                <Image
                  className="w-full h-full object-cover"
                  alt="Минималистичная кофейная чашка и смартфон"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUIQTKuA1EUKqaeIOYdgK0QZEsqTd8sYvJD-GqF7D0ejgW-fiHnKpcmOUjRaPMhRq6TpSrVQZ35P2J7AiY_GUerZvf65upfJdYWL8wjg4WSazkFRsp9as4gj0lcLnoxwFVgVOfenBiiHthSjUmM3dJmgEm-k_gIbyuN5u03nrACA8GOqpTUTml5Fl9WV2tDURnBaYSAajO8GtnoAafNJ6YVI_b90Cqq47CtZzTDLyrVzFsZDlWU8cv3q0kCQuGZuIu0th7gFnkFig"
                  fill
                  sizes="(min-width: 768px) 520px, 90vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              </div>

              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-surface-container-highest rounded-full p-4 shadow-lg border-4 border-surface hidden md:flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-6xl">
                  coffee
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-8 bg-surface-container">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center md:text-left">
              <h2 className="font-headline text-4xl font-bold text-primary mb-4">
                Вот причины по которым выбирают нас:
              </h2>
              <p className="text-on-surface-variant font-medium">

              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between">
                <div>
                  <span className="material-symbols-outlined text-tertiary-fixed-dim text-4xl mb-4">
                    security
                  </span>
                  <h3 className="font-headline text-2xl font-bold mb-4">
                    VLESS
                  </h3>
                  <p className="text-on-surface-variant leading-relaxed mb-6">
                    Наши сервера используют VLESS протокол для шифрования данных. Это позволяет нам быть незаметными для мониторинга и поддерживать нулевую задержку.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-secondary-container rounded-full text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                    Зашифровано
                  </span>
                  <span className="px-3 py-1 bg-secondary-container rounded-full text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                    Невидимо
                  </span>
                </div>
              </div>

              <div className="bg-primary text-on-primary p-10 rounded-xl flex flex-col justify-center">
                <span className="material-symbols-outlined text-tertiary-fixed text-4xl mb-4">
                  speed
                </span>
                <h3 className="font-headline text-2xl font-bold mb-4">
                  Поток 10 Гбит/с
                </h3>
                <p className="text-on-primary-container text-sm">
                  Наши сервера имеют скорость до 10 Гбит/с, что позволяет вам смотреть фильмы в 4K и скачивать файлы без задержек.
                </p>
              </div>

              <div className="bg-tertiary-fixed p-10 rounded-xl">
                <span className="material-symbols-outlined text-on-tertiary-fixed text-4xl mb-4">
                  verified_user
                </span>
                <h3 className="font-headline text-2xl font-bold text-on-tertiary-fixed mb-2">
                  Отсутствие логов
                </h3>
                <p className="text-on-tertiary-fixed-variant text-sm">
                  Ваши данные принадлежат вам. Мы не храним, не отслеживаем и не продаем ваши данные.
                </p>
              </div>

              <div className="md:col-span-2 bg-surface-container-low p-10 rounded-xl overflow-hidden relative border border-outline-variant/10">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <h3 className="font-headline text-2xl font-bold mb-4">
                      Поддержка всегда на связи
                    </h3>
                    <p className="text-on-surface-variant">
                      Мы предоставляем 24/7 техническую поддержку, которая понимает как VPN протоколы, так и важность хорошего утреннего кофе.
                    </p>
                  </div>
                  <div className="w-32 h-32 flex-shrink-0 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-primary text-5xl">
                      support_agent
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        <section className="py-24 px-8 bg-surface-container-low" id="prices">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline text-4xl font-bold text-primary mb-4">
                Выберите свой тариф
              </h2>
              <p className="text-on-surface-variant max-w-xl mx-auto">
                Гибкие тарифы, подстроенные под ваши ежедневные цифровые потребности. Без скрытых комиссий, только чистая связь.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:translate-y-[-8px] transition-transform duration-300 flex flex-col">
                <div className="mb-8">
                  <span className="material-symbols-outlined text-secondary text-4xl mb-4">
                    local_cafe
                  </span>
                  <h3 className="font-headline text-2xl font-bold text-primary">
                    Базовый
                  </h3>
                  <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold mt-1">
                    1 МЕСЯЦ
                  </p>
                </div>
                <div className="text-4xl font-bold text-primary mb-8">
                  100₽{" "}
                  <span className="text-lg font-medium text-on-surface-variant">
                    /мес
                  </span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check
                    </span>{" "}
                    Приоритетная высокая скорость
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check
                    </span>{" "}
                    Узлы в Германии
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check
                    </span>{" "}
                    Отсутствие логов
                  </li>
                </ul>
                <Link href="/register" className="w-full py-4 border border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-on-primary transition-colors block text-center">
                  Выбрать Базовый
                </Link>
              </div>

              <div className="bg-primary text-on-primary p-8 rounded-xl shadow-2xl scale-105 z-10 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-tertiary-fixed text-on-tertiary-fixed px-6 py-2 rounded-bl-xl font-bold text-xs uppercase tracking-widest">
                  Лучшее предложение
                </div>
                <div className="mb-8">
                  <span className="material-symbols-outlined text-tertiary-fixed text-4xl mb-4">
                    coffee
                  </span>
                  <h3 className="font-headline text-2xl font-bold">
                    Экспертный
                  </h3>
                  <p className="text-on-primary-container text-sm uppercase tracking-widest font-bold mt-1">
                    12 МЕСЯЦЕВ
                  </p>
                </div>
                <div className="text-4xl font-bold mb-8">
                  800₽{" "}
                  <span className="text-lg font-medium opacity-60">
                    /год
                  </span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary-fixed text-xl">
                      check
                    </span>{" "}
                    Приоритетная высокая скорость
                  </li>

                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary-fixed text-xl">
                      check
                    </span>{" "}
                    Узлы в Германии
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary-fixed text-xl">
                      check
                    </span>{" "}
                    Отсутствие логов
                  </li>
                </ul>
                <Link href="/register" className="w-full py-4 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-full hover:scale-105 transition-transform block text-center">
                  Выбрать Экспертный
                </Link>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:translate-y-[-8px] transition-transform duration-300 flex flex-col">
                <div className="mb-8">
                  <span className="material-symbols-outlined text-tertiary-container text-4xl mb-4">
                    energy_savings_leaf
                  </span>
                  <h3 className="font-headline text-2xl font-bold text-primary">
                    Стандартный
                  </h3>
                  <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold mt-1">
                    3 МЕСЯЦА
                  </p>
                </div>
                <div className="text-4xl font-bold text-primary mb-8">
                  500₽{" "}
                  <span className="text-lg font-medium text-on-surface-variant">
                    /полгода
                  </span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check
                    </span>{" "}
                    Приоритетная высокая скорость
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check
                    </span>{" "}
                    Узлы в Германии
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check
                    </span>{" "}
                    Отсутствие логов
                  </li>

                </ul>
                <Link href="/register" className="w-full py-4 border border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-on-primary transition-colors block text-center">
                  Выбрать Стандартный
                </Link>
              </div>
            </div>
          </div>
        </section>


        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto bg-primary rounded-xl overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <Image
                className="w-full h-full object-cover"
                alt="Текстура кофейного зерна"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc7srMM7ebR8xodhQiBul_O8ka2y1hOvn53M8qaeBzu2-4xwSEMmLTTGAwDO2zNwpYEcl39wPh9ZVvDfgkRGLYaIQ_dWsuXwpN7T9KfopYD22rsNtemEa0RbEPmHZmzRCNRQXhif6WO9kKLtg7mergaCuKqETDLg6Uhb4eapnGXYvdgbFWtwQ6p4g0m0J0uq9mWgVX36XcAy9pW6D_gzDW9sSHp3Ymb5xafi9JedkVD4X8wh6jSqKKvJHYcQK1QKWKybY_3eEKmc0"
                fill
                sizes="(min-width: 768px) 896px, 92vw"
              />
            </div>
            <div className="relative z-10 p-12 text-center">
              <h2 className="font-headline text-4xl font-bold text-on-primary mb-6">
                Готовы к лучшему соединению?
              </h2>
              <p className="text-on-primary-container text-lg mb-10">
                Присоединяйтесь к 5,000+ пользователям, наслаждающимся самым
                ароматным VPN-сервисом в мире.
              </p>
              <Link href='/register' className="bg-tertiary-fixed text-on-tertiary-fixed px-12 py-5 rounded-full text-xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all">
                Получить ключ сейчас
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#fbf9f5] dark:bg-[#1b1c1a] border-t border-[#efeeea] dark:border-[#2a2a28]">
        <div className="w-full py-12 px-8 flex flex-col items-center gap-6 max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <a
              className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] transition-colors font-body text-sm uppercase tracking-widest"
              href="/about"
            >
              О нас
            </a>
            <a
              className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] transition-colors font-body text-sm uppercase tracking-widest"
              href="/privacy"
            >
              Политика конфиденциальности
            </a>
            <a
              className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] transition-colors font-body text-sm uppercase tracking-widest"
              href="/terms"
            >
              Условия использования
            </a>
            <a
              className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] transition-colors font-body text-sm uppercase tracking-widest"
              href="/support"
            >
              Поддержка
            </a>
          </div>
          <div className="text-[#504442] dark:text-[#efeeea] font-body text-sm uppercase tracking-widest text-center mt-4">
            © Coffee Mania VPN.
          </div>
        </div>
      </footer>
    </div>
  );
}
