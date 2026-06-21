"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { FlagBadge, VPN_LOCATIONS } from "@/app/components/CountryFlags";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
import { useSiteTheme } from "@/lib/useSiteTheme";

const PLAN_FEATURES = [
  "Высокая скорость без просадок",
  "Узлы в Германии, Австрии и других странах",
  "Обход блокировок и ограничений",
  "Поддержка всех устройств",
] as const;

function PlanFeatures({ featured = false }: { featured?: boolean }) {
  return (
    <ul className="space-y-4 mb-10 flex-grow">
      {PLAN_FEATURES.map((feature) => (
        <li
          key={feature}
          className={featured ? "" : "text-on-surface-variant dark:text-[#c4b8b0]"}
        >
          {feature}
        </li>
      ))}
    </ul>
  );
}

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
        skip401Redirect: true,
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        router.push("/profile");
      } else {
        router.push("/register");
      }
    } catch {
      router.push("/login");
    } finally {
      setIsCheckingCabinet(false);
    }
  };
  return (
    <div className="bg-surface text-on-surface selection:bg-tertiary-fixed min-h-full">
      <nav className="sticky top-0 z-50 bg-[#EDE0D8] dark:bg-[#1a1110] border-none shadow-none">
        <div className="flex flex-wrap sm:flex-nowrap md:grid md:grid-cols-3 items-center gap-2 sm:gap-3 w-full px-3 md:px-8 py-2.5 md:py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 min-w-0 md:justify-self-start">
            <img src="/logo.svg" alt="Логитип" className="w-8 h-8 object-contain dark:brightness-0 dark:invert" />
            <div className="text-xs sm:text-xl md:text-2xl font-serif font-bold text-[#3D1C1C] dark:text-[#f2e8df] whitespace-nowrap">
              <span className="bg-[#C8B8A8] dark:bg-orange-300 px-1 text-[#3D1C1C]">КОФЕМАНИЯ</span>
              <span className="hidden sm:inline"> ВПН</span>
            </div>
          </div>
          <div className="hidden md:flex gap-8 items-center justify-center md:justify-self-center">
            <a
              onClick={() => setActiveTab('home')}
              className={`pb-1 transition-colors duration-300 border-b-2 ${activeTab === 'home' ? 'text-[#3D1C1C] dark:text-[#ffba38] font-bold border-[#3D1C1C] dark:border-[#ffba38]' : 'text-[#B09080] dark:text-[#8c7a72] border-transparent hover:text-[#3D1C1C] dark:hover:text-[#f2e8df]'}`}
              href="#"
            >
              Главная
            </a>
            <a
              onClick={() => setActiveTab('prices')}
              className={`pb-1 transition-colors duration-300 border-b-2 ${activeTab === 'prices' ? 'text-[#3D1C1C] dark:text-[#ffba38] font-bold border-[#3D1C1C] dark:border-[#ffba38]' : 'text-[#B09080] dark:text-[#8c7a72] border-transparent hover:text-[#3D1C1C] dark:hover:text-[#f2e8df]'}`}
              href="#prices"
            >
              Цены
            </a>
          </div>
          <div className="ml-auto md:ml-0 flex items-center gap-2 sm:gap-3 shrink-0 md:justify-self-end">
            <ThemeToggle isDark={isDark} onChange={setTheme} />
            <button
              className="bg-button text-on-button px-2.5 sm:px-6 py-2 rounded-full text-[11px] sm:text-base font-bold hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
              onClick={handleCabinetClick}
              disabled={isCheckingCabinet}
              type="button"
            >
              {isCheckingCabinet ? "Проверяем..." : "Личный кабинет"}
            </button>
          </div>
        </div>
        <div className="bg-[#DDD0C8] dark:bg-[#423431] h-px w-full" />
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
                  className="inline-flex w-full sm:w-auto items-center justify-center bg-button text-on-button px-8 py-4 rounded-full text-base sm:text-lg font-bold shadow-xl hover:bg-button-hover transition-all"
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
              <div className="md:col-span-2 bg-[#EDE0D8] dark:bg-[#2b1f1d] p-6 md:p-10 rounded-xl shadow-sm border border-[#C8B8A8] dark:border-[#423431] flex flex-col justify-between">
                <div>
                  <h3 className="font-headline text-2xl font-bold text-primary mb-4">
                    Стабильные протоколы
                  </h3>
                  <p className="text-on-surface-variant dark:text-[#c4b8b0] leading-relaxed mb-6">
                    Наш VPN использует наиболее стабильные протоколы, обеспечивающие постоянное
                    соединение даже в условиях, при которых решения конкурентов перестают работать.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#DDD0C8] dark:bg-[#423431] rounded-full text-xs font-bold uppercase tracking-widest text-primary dark:text-[#f2e8df]">
                    Постоянное соединение
                  </span>
                  <span className="px-3 py-1 bg-[#DDD0C8] dark:bg-[#423431] rounded-full text-xs font-bold uppercase tracking-widest text-primary dark:text-[#f2e8df]">
                    Обход блокировок
                  </span>
                  <span className="px-3 py-1 bg-[#DDD0C8] dark:bg-[#423431] rounded-full text-xs font-bold uppercase tracking-widest text-primary dark:text-[#f2e8df]">
                    Работает везде
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#C8B8A8] to-[#B09080] dark:from-[#423431] dark:to-[#322522] p-6 md:p-10 rounded-xl flex flex-col justify-center border border-[#B09080]/60 dark:border-[#8c7a72]/40 shadow-sm">
                <h3 className="font-headline text-2xl font-bold text-[#3D1C1C] dark:text-[#f2e8df] mb-4">
                  Обход глушилок всех операторов
                </h3>
                <p className="text-[#3D1C1C]/85 dark:text-[#c4b8b0] text-sm leading-relaxed">
                  Когда операторы ограничивают или «глушат» мобильный интернет, соединение у многих
                  VPN обрывается. Наш сервис продолжает работать — у МТС, Билайн, МегаФон, Tele2 и
                  других операторов связи.
                </p>
              </div>

              <div className="md:col-span-3 bg-[#DDD0C8] dark:bg-[#241917] p-6 md:p-10 rounded-xl overflow-hidden relative border border-[#C8B8A8] dark:border-[#423431] shadow-sm">
                <h3 className="font-headline text-2xl font-bold text-primary dark:text-[#f2e8df] mb-4">
                  Поддержка всегда на связи
                </h3>
                <p className="text-on-surface-variant dark:text-[#c4b8b0]">
                  Мы предоставляем 24/7 техническую поддержку, которая понимает как VPN протоколы, так и важность хорошего утреннего кофе.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-4">
                Наши сервера
              </h2>
              <p className="text-on-surface-variant dark:text-[#c4b8b0] max-w-2xl mx-auto">
                Серверы в Европе и России — выбирайте локацию под задачу: стабильный доступ,
                обход ограничений или минимальный пинг.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-6">
              {VPN_LOCATIONS.map((location) => (
                <div
                  key={location.flag}
                  className="flex flex-col items-center gap-3 rounded-xl bg-surface-container-lowest dark:bg-[#2b1f1d] border border-outline-variant/10 dark:border-[#423431] px-4 py-5 hover:translate-y-[-4px] transition-transform duration-300"
                >
                  <FlagBadge name={location.flag} size="lg" />
                  <span className="text-sm font-bold text-primary text-center leading-tight">
                    {location.label}
                  </span>
                </div>
              ))}
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
              <div className="bg-surface-container-lowest dark:bg-[#2b1f1d] p-8 rounded-xl border-2 border-[#B09080] dark:border-[#423431] hover:translate-y-[-8px] transition-transform duration-300 flex flex-col shadow-sm">
                <div className="mb-8">
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
                <PlanFeatures />
                <Link href="/register" className="w-full py-4 border border-primary dark:border-button text-primary dark:text-button font-bold rounded-full hover:bg-button hover:text-on-button transition-colors block text-center">
                  Подключить тариф
                </Link>
              </div>

              <div className="bg-primary dark:bg-[#423431] text-on-primary dark:text-[#f2e8df] p-8 rounded-xl shadow-2xl md:scale-105 z-10 flex flex-col relative overflow-hidden border-2 border-[#3D1C1C] dark:border-[#8c7a72]/30">
                <div className="absolute top-0 right-0 bg-green-600 text-[#EDE0D8] px-6 py-2 rounded-bl-xl font-bold text-xs uppercase tracking-widest">
                  Скидка 15%
                </div>
                <div className="mb-8">
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
                <PlanFeatures featured />
                <Link href="/register" className="w-full py-4 bg-[#EDE0D8] text-[#3D1C1C] dark:bg-button dark:text-on-button font-bold rounded-full hover:bg-[#DDD0C8] dark:hover:bg-button-hover hover:scale-105 transition-all block text-center">
                  Подключить тариф
                </Link>
              </div>

              <div className="bg-surface-container-lowest dark:bg-[#2b1f1d] p-8 rounded-xl border-2 border-[#B09080] dark:border-[#423431] hover:translate-y-[-8px] transition-transform duration-300 flex flex-col relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 bg-green-600 text-[#EDE0D8] px-6 py-2 rounded-bl-xl font-bold text-xs uppercase tracking-widest">
                  Скидка 50%
                </div>
                <div className="mb-8">
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
                <PlanFeatures />
                <Link href="/register" className="w-full py-4 border border-primary dark:border-button text-primary dark:text-button font-bold rounded-full hover:bg-button hover:text-on-button transition-colors block text-center">
                  Подключить тариф
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
              <Link href='/register' className="inline-flex w-full sm:w-auto justify-center bg-button text-on-button px-8 md:px-12 py-4 md:py-5 rounded-full text-lg md:text-xl font-bold shadow-xl hover:bg-button-hover hover:scale-105 active:scale-95 transition-all">
                Оформить подписку
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#EDE0D8] dark:bg-[#1A1110] border-t border-[#DDD0C8] dark:border-[#423431]">
        <div className="w-full py-10 md:py-12 px-4 md:px-8 flex flex-col items-center gap-6 max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <a
              className="text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] transition-colors font-body text-sm uppercase tracking-widest"
              href="/about"
            >
              О нас
            </a>
            <a
              className="text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] transition-colors font-body text-sm uppercase tracking-widest"
              href="/privacy"
            >
              Политика конфиденциальности
            </a>
            <a
              className="text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] transition-colors font-body text-sm uppercase tracking-widest"
              href="/terms"
            >
              Условия использования
            </a>
            <a
              className="text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] transition-colors font-body text-sm uppercase tracking-widest"
              href="/support"
            >
              Поддержка
            </a>
          </div>
          <div className="text-[#B09080] dark:text-[#8c7a72] font-body text-sm uppercase tracking-widest text-center mt-4">
            © Coffee Mania VPN.
          </div>
        </div>
      </footer>
    </div>
  );
}
