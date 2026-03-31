"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "https://api.coffeemaniavpn.ru";

export default function ReferralPage() {
  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [depositsCount, setDepositsCount] = useState(0);
  const [depositsSum, setDepositsSum] = useState(0);
  const [isCreated, setIsCreated] = useState(false);

  const normalizedPromo = useMemo(
    () => promoCode.trim().toUpperCase().replace(/\s+/g, ""),
    [promoCode],
  );

  const copyCode = async () => {
    if (!normalizedPromo) return;
    try {
      await navigator.clipboard.writeText(normalizedPromo);
      setMessage("Промокод скопирован.");
      setTimeout(() => setMessage(null), 1500);
    } catch {
      setMessage("Не удалось скопировать промокод.");
      setTimeout(() => setMessage(null), 1500);
    }
  };

  const loadReferral = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/referral`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!res.ok) {
        setMessage(`Ошибка загрузки: ${res.status}`);
        setTimeout(() => setMessage(null), 1800);
        return;
      }
      const data = (await res.json()) as {
        referral_code?: string | null;
        deposits_count?: number;
        deposits_sum?: number;
      };

      const code = data.referral_code ?? "";
      setPromoCode(code);
      setIsCreated(Boolean(code));
      setDepositsCount(Number(data.deposits_count ?? 0));
      setDepositsSum(Number(data.deposits_sum ?? 0));
    } catch {
      setMessage("Не удалось загрузить данные реферальной программы.");
      setTimeout(() => setMessage(null), 1800);
    } finally {
      setIsLoading(false);
    }
  };

  const savePromo = async () => {
    if (!normalizedPromo || isCreated) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/referral/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code: normalizedPromo }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const err = await res.json();
          setMessage(err?.message ?? `Ошибка ${res.status}`);
        } else {
          setMessage(`Ошибка ${res.status}`);
        }
        setTimeout(() => setMessage(null), 1800);
        return;
      }
      setPromoCode(normalizedPromo);
      setIsCreated(true);
      setMessage("Авторский промокод сохранен.");
      setTimeout(() => setMessage(null), 1800);
    } catch {
      setMessage("Не удалось сохранить промокод.");
      setTimeout(() => setMessage(null), 1800);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadReferral();
  }, []);

  return (
    <div className="bg-surface text-on-surface selection:bg-tertiary-fixed min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fbf9f5] dark:bg-[#1b1c1a]">
        <nav className="flex justify-between items-center w-full px-8 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Логотип" className="w-8 h-8 object-contain" />
            <div className="text-2xl font-serif font-bold text-[#271310] dark:text-[#ffffff]">
              <span className="bg-orange-200 dark:bg-orange-300 px-1 text-[#271310]">КОФЕМАНИЯ</span> ВПН
            </div>
          </div>
          <Link
            href="/profile"
            className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
          >
            Назад в кабинет
          </Link>
        </nav>
        <div className="bg-[#efeeea] dark:bg-[#2a2a28] h-px w-full" />
      </header>

      <aside className="fixed left-0 top-0 h-full hidden md:flex flex-col p-6 z-40 bg-[#efeeea] dark:bg-[#2a2a28] w-64 rounded-r-3xl shadow-[0_12px_32px_-4px_rgba(27,28,26,0.06)] pt-24">
        <nav className="flex flex-col gap-2">
          <a className="text-[#504442] dark:text-[#efeeea] px-4 py-3 flex items-center gap-3 hover:bg-[#f5f3ef] dark:hover:bg-[#3e2723]/50 rounded-full transition-all" href="/profile">
            <span className="material-symbols-outlined">vpn_key</span>
            <span className="font-label">Мои ключи</span>
          </a>
          <a className="bg-[#e6e0c9] dark:bg-[#3e2723] text-[#271310] dark:text-[#ffba38] rounded-full px-4 py-3 font-bold flex items-center gap-3 translate-x-1 transition-transform duration-200" href="/referral">
            <span className="material-symbols-outlined">redeem</span>
            <span className="font-label">Реферальная программа</span>
          </a>
          <a className="text-[#504442] dark:text-[#efeeea] px-4 py-3 flex items-center gap-3 hover:bg-[#f5f3ef] dark:hover:bg-[#3e2723]/50 rounded-full transition-all" href="/help">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label">Помощь</span>
          </a>
        </nav>
      </aside>

      <main className="md:ml-64 pt-24 pb-12 px-6 md:px-12 max-w-5xl mx-auto w-full flex-1">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            Реферальная программа
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl">
            Здесь можно создать персональный промокод один раз и отслеживать
            пополнения, в которых был использован этот код.
          </p>
        </header>

        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-3 uppercase tracking-widest">
              Ваш промокод
            </label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Например, COFFEE-AB12CD"
              disabled={isCreated || isLoading}
              className="w-full bg-surface-container-high text-primary font-semibold rounded-xl px-4 py-4 outline-none border-2 border-transparent focus:border-tertiary-fixed transition-colors"
            />
            {isCreated ? (
              <p className="text-xs text-on-surface-variant mt-2">
                Авторский промокод уже создан и не может быть изменен.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={savePromo}
              disabled={!normalizedPromo || isCreated || isLoading || isSaving}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-bold hover:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? "Сохраняем..." : "Сохранить код"}
            </button>
          </div>

          <div className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant space-y-2">
            <div>
              Текущий код:{" "}
              <span className="font-bold text-primary">{normalizedPromo || "еще не создан"}</span>
            </div>
            <div>
              Количество депозитов по коду:{" "}
              <span className="font-bold text-primary">{depositsCount}</span>
            </div>
            <div>
              Сумма депозитов по коду:{" "}
              <span className="font-bold text-primary">{depositsSum.toFixed(2)} ₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span>RevShare (50%)</span>
              <span className="font-bold text-primary">{(depositsSum * 0.5).toFixed(2)} ₽</span>
            </div>
          </div>

          <button
            type="button"
            onClick={copyCode}
            disabled={!normalizedPromo || isLoading}
            className="w-full bg-surface-container-high text-primary py-3 rounded-full font-bold hover:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Скопировать промокод
          </button>

          <div className="rounded-xl bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
            Для вывода средств на карту или в криптовалюте обратитесь в Telegram: <br /> Минимальная сумма вывода - <span className="font-bold text-primary">300 рублей</span>.
            <span className="font-bold text-primary">@CoffemaniaSupport</span>.
          </div>

          {message ? (
            <div className="text-sm text-on-secondary-fixed bg-secondary-fixed rounded-xl px-4 py-3">
              {message}
            </div>
          ) : null}
        </section>
      </main>

      <footer className="w-full py-12 px-8 flex flex-col items-center gap-6 border-t border-[#efeeea] dark:border-[#2a2a28] bg-[#fbf9f5] dark:bg-[#1b1c1a] mt-auto">
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label" href="/about">О нас</a>
          <a className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label" href="/privacy">Политика конфиденциальности</a>
          <a className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label" href="/terms">Условия использования</a>
          <a className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label" href="/support">Поддержка</a>
        </div>
        <p className="text-[#504442] dark:text-[#efeeea]/60 text-xs uppercase tracking-widest font-label">© Coffee Mania VPN.</p>
      </footer>
    </div>
  );
}
