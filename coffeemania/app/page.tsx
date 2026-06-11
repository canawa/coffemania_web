"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
import { useSiteTheme } from "@/lib/useSiteTheme";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [isCheckingCabinet, setIsCheckingCabinet] = useState(false);
  const router = useRouter();
  const { isDark, setTheme } = useSiteTheme();

  const handleCabinetClick = async () => {
    if (isCheckingCabinet) return;
    setIsCheckingCabinet(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/balance`, {
        method: "GET",
        credentials: "include",
      });
      if (res.status === 401) return;
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
      <nav className="sticky top-0 z-50 bg-[#fbf9f5] dark:bg-[#1a1110] border-none shadow-none">
        <div className="flex flex-wrap sm:flex-nowrap md:grid md:grid-cols-3 items-center gap-2 sm:gap-3 w-full px-3 md:px-8 py-2.5 md:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 min-w-0 md:justify-self-start">
            <img src="/logo.svg" alt="Логитип" className="w-8 h-8 object-contain dark:brightness-0 dark:invert" />
            <div className="text-xs sm:text-xl md:text-2xl font-serif font-bold text-[#271310] dark:text-[#f2e8df] whitespace-nowrap">
              <span className="bg-orange-200 dark:bg-orange-300 px-1 text-[#271310]">КОФЕМАНИЯ</span>
              <span className="hidden sm:inline"> ВПН</span>
            </div>
          </div>
          <div className="hidden md:flex gap-8 items-center justify-center md:justify-self-center">
            <a
              onClick={() => setActiveTab('home')}
              className={`pb-1 transition-colors duration-300 border-b-2 ${activeTab === 'home' ? 'text-[#271310] dark:text-[#ffba38] font-bold border-[#ffba38]' : 'text-[#504442] dark:text-[#8c7a72] border-transparent hover:text-[#271310] dark:hover:text-[#f2e8df]'}`}
              href="#"
            >
              Главная
            </a>
            <a
              onClick={() => setActiveTab('prices')}
              className={`pb-1 transition-colors duration-300 border-b-2 ${activeTab === 'prices' ? 'text-[#271310] dark:text-[#ffba38] font-bold border-[#ffba38]' : 'text-[#504442] dark:text-[#8c7a72] border-transparent hover:text-[#271310] dark:hover:text-[#f2e8df]'}`}
              href="#prices"
            >
              Цены
            </a>
          </div>
          <div className="ml-auto md:ml-0 flex items-center gap-3 sm:gap-4 shrink-0 md:justify-self-end">
            <ThemeToggle isDark={isDark} onChange={setTheme} />
            <button
              className="bg-primary dark:bg-[#423431] text-on-primary dark:text-[#f2e8df] px-2.5 sm:px-6 py-2 rounded-full text-[11px] sm:text-base font-bold hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
              onClick={handleCabinetClick}
              disabled={isCheckingCabinet}
              type="button"
            >
              {isCheckingCabinet ? "Проверяем..." : "Личный кабинет"}
            </button>
          </div>
        </div>
        <div className="bg-surface-container dark:bg-[#423431] h-px w-full" />
      </nav>

      <main>
        <section className="relative overflow-hidden py-14 md:py-32 px-4 md:px-8">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="z-10">
              <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-extrabold text-primary leading-tight mb-6">
                VPN по цене чашки кофе
              </h1>
              <p className="text-on-surface-variant dark:text-[#c4b8b0] text-lg md:text-xl mb-10 max-w-md leading-relaxed">
                Передовые протоколы безопасности и стабильная скорость. Подписка на серверы по всему миру.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a
                  className="inline-flex w-full sm:w-auto items-center justify-center bg-gradient-to-br from-primary to-primary-container dark:from-[#423431] dark:to-[#322522] text-on-primary dark:text-[#f2e8df] px-8 py-4 rounded-full text-base sm:text-lg font-bold shadow-xl hover:shadow-primary/20 transition-all"
                  href="#prices"
                >
                  Выбрать тариф
                </a>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-tertiary-fixed opacity-20 blur-3xl rounded-full" />
               <div className="relative w-full max-w-[520px] mx-auto aspect-square rotate-[-3deg] hover:rotate-[5deg] transition-transform duration-500 ease-out">
                 <Image
                  className="w-full h-full object-contain dark:brightness-0 dark:invert"
                  alt="Минималистичная кофейная чашка и смартфон"
                  src="/logo.svg"
                  // src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUIQTKuA1EUKqaeIOYdgK0QZEsqTd8sYvJD-GqF7D0ejgW-fiHnKpcmOUjRaPMhRq6TpSrVQZ35P2J7AiY_GUerZvf65upfJdYWL8wjg4WSazkFRsp9as4gj0lcLnoxwFVgVOfenBiiHthSjUmM3dJmgEm-k_gIbyuN5u03nrACA8GOqpTUTml5Fl9WV2tDURnBaYSAajO8GtnoAafNJ6YVI_b90Cqq47CtZzTDLyrVzFsZDlWU8cv3q0kCQuGZuIu0th7gFnkFig"
                  fill
                  sizes="(min-width: 768px) 520px, 90vw"
                  priority
                />
              </div> 

            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 md:px-8 bg-surface-container">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center md:text-left">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
                Вот причины по которым выбирают нас:
              </h2>
              <p className="text-on-surface-variant font-medium">

              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-surface-container-lowest dark:bg-[#2b1f1d] p-6 md:p-10 rounded-xl shadow-sm border border-outline-variant/10 dark:border-[#423431] flex flex-col justify-between">
                <div>
                  <span className="material-symbols-outlined text-tertiary-fixed-dim dark:text-[#ffba38] text-4xl mb-4">
                    security
                  </span>
                  <h3 className="font-headline text-2xl font-bold text-primary mb-4">
                    Передовые протоколы безопасности
                  </h3>
                  <p className="text-on-surface-variant dark:text-[#c4b8b0] leading-relaxed mb-6">
                    Трафик защищён современным шифрованием и надёжными транспортными протоколами —
                    соединение остаётся стабильным, а ваши данные недоступны посторонним.
                    Мы используем актуальные стандарты безопасности, чтобы вы спокойно работали,
                    общались и смотрели контент без компромиссов.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-secondary-container dark:bg-[#423431] rounded-full text-xs font-bold uppercase tracking-widest text-on-secondary-container dark:text-[#f2e8df]">
                    TLS 1.3
                  </span>
                  <span className="px-3 py-1 bg-secondary-container dark:bg-[#423431] rounded-full text-xs font-bold uppercase tracking-widest text-on-secondary-container dark:text-[#f2e8df]">
                    Сквозное шифрование
                  </span>
                  <span className="px-3 py-1 bg-secondary-container dark:bg-[#423431] rounded-full text-xs font-bold uppercase tracking-widest text-on-secondary-container dark:text-[#f2e8df]">
                    Защита трафика
                  </span>
                </div>
              </div>

              <div className="bg-primary dark:bg-[#423431] text-on-primary dark:text-[#f2e8df] p-6 md:p-10 rounded-xl flex flex-col justify-center border border-transparent dark:border-[#8c7a72]/30">
                <span className="material-symbols-outlined text-tertiary-fixed dark:text-[#ffba38] text-4xl mb-4">
                  speed
                </span>
                <h3 className="font-headline text-2xl font-bold mb-4">
                  Поток 10 Гбит/с
                </h3>
                <p className="text-on-primary-container dark:text-[#c4b8b0] text-sm">
                  Наши сервера имеют скорость до 10 Гбит/с, что позволяет вам смотреть фильмы в 4K и скачивать файлы без задержек.
                </p>
              </div>

              <div className="bg-tertiary-fixed p-6 md:p-10 rounded-xl">
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

              <div className="md:col-span-2 bg-surface-container-low dark:bg-[#241917] p-6 md:p-10 rounded-xl overflow-hidden relative border border-outline-variant/10 dark:border-[#423431]">
                <div className="flex items-start gap-4 mb-4">
                  <span className="material-symbols-outlined text-primary dark:text-[#ffba38] text-4xl">
                    support_agent
                  </span>
                  <h3 className="font-headline text-2xl font-bold text-primary">
                    Поддержка всегда на связи
                  </h3>
                </div>
                <p className="text-on-surface-variant dark:text-[#c4b8b0]">
                  Мы предоставляем 24/7 техническую поддержку, которая понимает как VPN протоколы, так и важность хорошего утреннего кофе.
                </p>
              </div>
            </div>
          </div>
        </section>



        <section className="py-16 md:py-24 px-4 md:px-8 bg-surface-container-low" id="prices">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
                Выберите свой тариф
              </h2>
              <p className="text-on-surface-variant dark:text-[#c4b8b0] max-w-xl mx-auto">
                Гибкие тарифы, подстроенные под ваши ежедневные цифровые потребности. Без скрытых комиссий, только чистая связь.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface-container-lowest dark:bg-[#2b1f1d] p-8 rounded-xl border border-outline-variant/10 dark:border-[#423431] hover:translate-y-[-8px] transition-transform duration-300 flex flex-col">
                <div className="mb-8">
                  <span className="material-symbols-outlined text-secondary dark:text-[#ffba38] text-4xl mb-4">
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
                  149₽{" "}
                  <span className="text-lg font-medium text-on-surface-variant">
                    /мес
                  </span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-on-surface-variant dark:text-[#c4b8b0]">
                    <span className="material-symbols-outlined text-primary dark:text-[#ffba38] text-xl">
                      check
                    </span>{" "}
                    Приоритетная высокая скорость
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant dark:text-[#c4b8b0]">
                    <span className="material-symbols-outlined text-primary dark:text-[#ffba38] text-xl">
                      check
                    </span>{" "}
                    Узлы в Германии 1, Германии 2, Австрии и ОБХОД LTE
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant dark:text-[#c4b8b0]">
                    <span className="material-symbols-outlined text-primary dark:text-[#ffba38] text-xl">
                      check
                    </span>{" "}
                    Отсутствие логов
                  </li>
                </ul>
                <Link href="/register" className="w-full py-4 border border-primary dark:border-[#f2e8df] text-primary dark:text-[#f2e8df] font-bold rounded-full hover:bg-primary dark:hover:bg-[#423431] hover:text-on-primary transition-colors block text-center">
                  Выбрать Базовый
                </Link>
              </div>

              <div className="bg-primary dark:bg-[#423431] text-on-primary dark:text-[#f2e8df] p-8 rounded-xl shadow-2xl md:scale-105 z-10 flex flex-col relative overflow-hidden border border-transparent dark:border-[#8c7a72]/30">
                <div className="absolute top-0 right-0 bg-tertiary-fixed text-on-tertiary-fixed px-6 py-2 rounded-bl-xl font-bold text-xs uppercase tracking-widest">
                  Скидка 15%
                </div>
                <div className="mb-8">
                  <span className="material-symbols-outlined text-tertiary-fixed text-4xl mb-4">
                    coffee
                  </span>
                  <h3 className="font-headline text-2xl font-bold">
                    Стандартный
                  </h3>
                  <p className="text-on-primary-container text-sm uppercase tracking-widest font-bold mt-1">
                    3 МЕСЯЦА
                  </p>
                </div>
                <div className="text-4xl font-bold mb-8">
                  399₽{" "}
                  <span className="text-lg font-medium opacity-60">
                    /3 мес
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
                    Узлы в Германии 1, Германии 2, Австрии и ОБХОД LTE
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary-fixed text-xl">
                      check
                    </span>{" "}
                    Отсутствие логов
                  </li>
                </ul>
                <Link href="/register" className="w-full py-4 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-full hover:scale-105 transition-transform block text-center">
                  Выбрать Стандартный
                </Link>
              </div>

              <div className="bg-surface-container-lowest dark:bg-[#2b1f1d] p-8 rounded-xl border border-outline-variant/10 dark:border-[#423431] hover:translate-y-[-8px] transition-transform duration-300 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-tertiary-fixed text-on-tertiary-fixed px-6 py-2 rounded-bl-xl font-bold text-xs uppercase tracking-widest">
                  Скидка 50%
                </div>
                <div className="mb-8">
                  <span className="material-symbols-outlined text-tertiary-container dark:text-[#ffba38] text-4xl mb-4">
                    energy_savings_leaf
                  </span>
                  <h3 className="font-headline text-2xl font-bold text-primary">
                    Экспертный
                  </h3>
                  <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold mt-1">
                    12 МЕСЯЦЕВ
                  </p>
                </div>
                <div className="text-4xl font-bold text-primary mb-8">
                  899₽{" "}
                  <span className="text-lg font-medium text-on-surface-variant">
                    /год
                  </span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-on-surface-variant dark:text-[#c4b8b0]">
                    <span className="material-symbols-outlined text-primary dark:text-[#ffba38] text-xl">
                      check
                    </span>{" "}
                    Приоритетная высокая скорость
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant dark:text-[#c4b8b0]">
                    <span className="material-symbols-outlined text-primary dark:text-[#ffba38] text-xl">
                      check
                    </span>{" "}
                    Узлы в Германии 1, Германии 2, Австрии и ОБХОД LTE
                  </li>
                  <li className="flex items-center gap-3 text-on-surface-variant dark:text-[#c4b8b0]">
                    <span className="material-symbols-outlined text-primary dark:text-[#ffba38] text-xl">
                      check
                    </span>{" "}
                    Отсутствие логов
                  </li>

                </ul>
                <Link href="/register" className="w-full py-4 border border-primary dark:border-[#f2e8df] text-primary dark:text-[#f2e8df] font-bold rounded-full hover:bg-primary dark:hover:bg-[#423431] hover:text-on-primary transition-colors block text-center">
                  Выбрать Экспертный
                </Link>
              </div>
            </div>
          </div>
        </section>


        <section className="py-16 md:py-24 px-4 md:px-8">
          <div className="max-w-4xl mx-auto bg-primary dark:bg-[#2b1f1d] rounded-xl overflow-hidden relative shadow-2xl border border-transparent dark:border-[#423431]">
            <div className="absolute inset-0 opacity-10">
              <Image
                className="w-full h-full object-cover"
                alt="Текстура кофейного зерна"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc7srMM7ebR8xodhQiBul_O8ka2y1hOvn53M8qaeBzu2-4xwSEMmLTTGAwDO2zNwpYEcl39wPh9ZVvDfgkRGLYaIQ_dWsuXwpN7T9KfopYD22rsNtemEa0RbEPmHZmzRCNRQXhif6WO9kKLtg7mergaCuKqETDLg6Uhb4eapnGXYvdgbFWtwQ6p4g0m0J0uq9mWgVX36XcAy9pW6D_gzDW9sSHp3Ymb5xafi9JedkVD4X8wh6jSqKKvJHYcQK1QKWKybY_3eEKmc0"
                fill
                sizes="(min-width: 768px) 896px, 92vw"
              />
            </div>
            <div className="relative z-10 p-7 md:p-12 text-center">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-primary dark:text-[#f2e8df] mb-6">
                Готовы к лучшему соединению?
              </h2>
              <p className="text-on-primary-container dark:text-[#c4b8b0] text-lg mb-10">
                Присоединяйтесь к 5,000+ пользователям, наслаждающимся самым
                ароматным VPN-сервисом в мире.
              </p>
              <Link href='/register' className="inline-flex w-full sm:w-auto justify-center bg-tertiary-fixed text-on-tertiary-fixed px-8 md:px-12 py-4 md:py-5 rounded-full text-lg md:text-xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all">
                Оформить подписку
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#fbf9f5] dark:bg-[#1a1110] border-t border-[#efeeea] dark:border-[#423431]">
        <div className="w-full py-10 md:py-12 px-4 md:px-8 flex flex-col items-center gap-6 max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <a
              className="text-[#504442] dark:text-[#8c7a72] hover:text-[#271310] dark:hover:text-[#f2e8df] transition-colors font-body text-sm uppercase tracking-widest"
              href="/about"
            >
              О нас
            </a>
            <a
              className="text-[#504442] dark:text-[#8c7a72] hover:text-[#271310] dark:hover:text-[#f2e8df] transition-colors font-body text-sm uppercase tracking-widest"
              href="/privacy"
            >
              Политика конфиденциальности
            </a>
            <a
              className="text-[#504442] dark:text-[#8c7a72] hover:text-[#271310] dark:hover:text-[#f2e8df] transition-colors font-body text-sm uppercase tracking-widest"
              href="/terms"
            >
              Условия использования
            </a>
            <a
              className="text-[#504442] dark:text-[#8c7a72] hover:text-[#271310] dark:hover:text-[#f2e8df] transition-colors font-body text-sm uppercase tracking-widest"
              href="/support"
            >
              Поддержка
            </a>
          </div>
          <div className="text-[#504442] dark:text-[#8c7a72] font-body text-sm uppercase tracking-widest text-center mt-4">
            © Coffee Mania VPN.
          </div>
        </div>
      </footer>
    </div>
  );
}
