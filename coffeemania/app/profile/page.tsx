"use client";
import Link from "next/link";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
export default function ProfilePage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false); // модалка
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('500'); // сумма пополнения
  const [balance, setBalance] = useState(0)
  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<
    "germany1" | "germany2" | "austria" | "lte_bypass"
  >("germany1");
  const [selectedDuration, setSelectedDuration] = useState<
    "week" | "month" | "half_year" | "year" | "lifetime"
  >("month");
  const [isBuyingKey, setIsBuyingKey] = useState(false);
  const [buyKeyMessage, setBuyKeyMessage] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [ownReferralCode, setOwnReferralCode] = useState<string | null>(null);
  const [promoBonusHint, setPromoBonusHint] = useState<"none" | "valid" | "own">("none");
  const [vpnKeys, setVpnKeys] = useState<
    Array<{
      id: number;
      country: string;
      duration: number;
      vpn_key: string;
      created_at: string;
      expires_at: string | null;
    }>
  >([]);

  const pricing = useMemo(() => {
    const durationDaysByUi: Record<typeof selectedDuration, number> = {
      week: 7,
      month: 30,
      half_year: 180,
      year: 365,
      lifetime: 0, // <=0 => expire=0 (no expiration) in backend/vpn.py
    };

    const priceByDurationDays: Record<number, number> = {
      7: 50,
      30: 150,
      180: 600,
      365: 1400,
      0: 2900,
    };

    const durationDays = durationDaysByUi[selectedDuration];
    const total = priceByDurationDays[durationDays] ?? null;

    return { durationDays, total };
  }, [selectedDuration]);

  const countryOptions = useMemo(
    () =>
      [
        { value: "germany1" as const, label: "Германия 1", flag: "germany" as const },
        { value: "germany2" as const, label: "Германия 2", flag: "germany" as const },
        { value: "austria" as const, label: "Австрия", flag: "austria" as const },
        { value: "lte_bypass" as const, label: "ОБХОД LTE", flag: "russia" as const },
      ] as const,
    [],
  );

  const durationOptions = useMemo(
    () =>
      [
        { value: "week" as const, label: "Неделя", badge: "7д" },
        { value: "month" as const, label: "Месяц", badge: "1м" },
        { value: "half_year" as const, label: "Полгода", badge: "6м" },
        { value: "year" as const, label: "Год", badge: "1г" },
        { value: "lifetime" as const, label: "Пожизненно", badge: "∞" },
      ] as const,
    [],
  );

  const FlagSvg = ({ name }: { name: "germany" | "austria" | "russia" }) => {
    const common = {
      width: 22,
      height: 16,
      viewBox: "0 0 22 16",
      xmlns: "http://www.w3.org/2000/svg",
    } as const;

    const Clip = () => (
      <defs>
        <clipPath id={`flag-clip-${name}`}>
          <rect x="0" y="0" width="22" height="16" rx="2" ry="2" />
        </clipPath>
      </defs>
    );

    if (name === "germany") {
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <Clip />
          <g clipPath={`url(#flag-clip-${name})`}>
            <rect width="22" height="16" fill="#000000" />
            <rect y="5.333" width="22" height="5.333" fill="#DD0000" />
            <rect y="10.666" width="22" height="5.334" fill="#FFCE00" />
          </g>
        </svg>
      );
    }

    if (name === "austria") {
      return (
        <svg {...common} aria-hidden="true" focusable="false">
          <Clip />
          <g clipPath={`url(#flag-clip-${name})`}>
            <rect width="22" height="16" fill="#ED2939" />
            <rect y="5.333" width="22" height="5.333" fill="#FFFFFF" />
          </g>
        </svg>
      );
    }

    return (
      <svg {...common} aria-hidden="true" focusable="false">
        <Clip />
        <g clipPath={`url(#flag-clip-${name})`}>
          <rect width="22" height="16" fill="#FFFFFF" />
          <rect y="5.333" width="22" height="5.333" fill="#0039A6" />
          <rect y="10.666" width="22" height="5.334" fill="#D52B1E" />
        </g>
      </svg>
    );
  };

  const FlagBadge = ({
    name,
    size,
  }: {
    name: "germany" | "austria" | "russia";
    size?: "sm" | "lg";
  }) => {
    const cls =
      size === "lg"
        ? "w-[28px] h-[20px] rounded-[6px]"
        : "w-[22px] h-[16px] rounded-[4px]";
    return (
      <span
        className={[
          cls,
          "overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.06)] border border-outline-variant/20 shrink-0 flex items-center justify-center bg-surface",
        ].join(" ")}
      >
        <FlagSvg name={name} />
      </span>
    );
  };

  function useClickOutside(
    refs: Array<React.RefObject<HTMLElement | null>>,
    onOutside: () => void,
    enabled: boolean,
  ) {
    useEffect(() => {
      if (!enabled) return;
      const handler = (event: MouseEvent | TouchEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        for (const ref of refs) {
          const el = ref.current;
          if (el && el.contains(target)) return;
        }
        onOutside();
      };
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler, { passive: true });
      return () => {
        document.removeEventListener("mousedown", handler);
        document.removeEventListener("touchstart", handler);
      };
    }, [enabled, onOutside, refs]);
  }

  useClickOutside(
    [mobileMenuRef, mobileMenuButtonRef],
    () => setIsMobileMenuOpen(false),
    isMobileMenuOpen,
  );

  function Dropdown<T extends string>(props: {
    label: string;
    value: T;
    options: readonly { value: T; label: string; flag?: string; badge?: string }[];
    onChange: (value: T) => void;
  }) {
    const { label, value, options, onChange } = props;
    const id = useId();
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);

    const current = options.find((o) => o.value === value) ?? options[0];

    const DurationBadgeSvg = ({ text, clipId }: { text: string; clipId: string }) => (
      <svg
        width="22"
        height="16"
        viewBox="0 0 22 16"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="22" height="16" rx="4" ry="4" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {/* Coffee-like dark badge for contrast */}
          <rect width="22" height="16" fill="#271310" />
          <text
            x="11"
            y="11"
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fontFamily="Manrope, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
            fill="#ffffff"
          >
            {text}
          </text>
        </g>
      </svg>
    );

    const DurationBadge = ({ text, inverted }: { text: string; inverted?: boolean }) => {
      const uid = useId();
      const clipId = `dur-clip-${uid}`;
      // Inverted is used on active (orange) option background.
      return (
        <span
          className={[
            "w-[22px] h-[16px] rounded-[4px] overflow-hidden shrink-0 flex items-center justify-center",
            "shadow-[0_1px_0_rgba(0,0,0,0.06)] border",
            inverted
              ? "border-white/25 bg-white/10"
              : "border-outline-variant/25 bg-surface",
          ].join(" ")}
        >
          {inverted ? (
            <svg
              width="22"
              height="16"
              viewBox="0 0 22 16"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width="22" height="16" rx="4" ry="4" />
                </clipPath>
              </defs>
              <g clipPath={`url(#${clipId})`}>
                <rect width="22" height="16" fill="rgba(255,255,255,0.14)" />
                <text
                  x="11"
                  y="11"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="800"
                  fontFamily="Manrope, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
                  fill="#ffffff"
                >
                  {text}
                </text>
              </g>
            </svg>
          ) : (
            <DurationBadgeSvg text={text} clipId={clipId} />
          )}
        </span>
      );
    };

    const Leading = (opt: { flag?: string; badge?: string }, inverted?: boolean) => {
      if (opt.flag) return <FlagBadge name={opt.flag as any} />;
      if (opt.badge) return <DurationBadge text={opt.badge} inverted={inverted} />;
      return (
        <span className="material-symbols-outlined text-primary text-[20px]">
          public
        </span>
      );
    };

    useClickOutside([buttonRef, panelRef], () => setOpen(false), open);

    useEffect(() => {
      if (!open) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest"
        >
          {label}
        </label>
        <div className="relative">
          <button
            id={id}
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={[
              "w-full text-left rounded-xl px-4 py-4 pr-12",
              "bg-surface-container-high text-primary font-semibold",
              "outline-none border-2 transition-colors",
              open ? "border-tertiary-fixed" : "border-transparent hover:border-outline-variant/30",
              "shadow-sm hover:shadow-md",
              "focus-visible:border-tertiary-fixed",
            ].join(" ")}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <div className="flex items-center gap-3">
              {Leading(current ?? {})}
              <span className="truncate">{current?.label}</span>
            </div>
          </button>
          <span
            className={[
              "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2",
              "material-symbols-outlined text-on-surface-variant transition-transform duration-200",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
          >
            expand_more
          </span>

          <div
            ref={panelRef}
            className={[
              "absolute left-0 right-0 mt-2 z-[120] origin-top",
              "transition-all duration-200 ease-out",
              open
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                : "opacity-0 -translate-y-1 scale-[0.98] pointer-events-none",
            ].join(" ")}
          >
            <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl overflow-hidden">
              <div className="p-2">
                {options.map((opt) => {
                  const active = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={[
                        "w-full flex items-center justify-between gap-3",
                        "px-4 py-3 rounded-xl text-left font-semibold transition-colors",
                        active
                          ? "bg-tertiary-fixed text-on-tertiary-fixed"
                          : "text-primary hover:bg-surface-container",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        {opt.flag || opt.badge ? Leading(opt, active) : null}
                        <span className="truncate">{opt.label}</span>
                      </span>
                      {active ? (
                        <span className="material-symbols-outlined text-[20px]">
                          check
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  const yookassaPayment = async (amount: number) => {
    const normalizedPromo = promoCode.trim().toUpperCase();
    if (normalizedPromo && ownReferralCode && normalizedPromo === ownReferralCode) {
      setCopyToast("Нельзя использовать собственный реферальный промокод");
      setTimeout(() => setCopyToast(null), 2200);
      return;
    }

    const res = await apiFetch(`${API_BASE_URL}/create_payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        amount: amount,
        promo_code: normalizedPromo ? normalizedPromo : null,
      }),
    });
    if (res.status === 401) return;
    const data = await res.json();
    if (!res.ok) {
      setCopyToast(data?.message ?? `Ошибка ${res.status}`);
      setTimeout(() => setCopyToast(null), 2000);
      return;
    }
    window.open(data.confirmation.confirmation_url, "_blank");
    const interval = setInterval(async () => {
      const result = await apiFetch(`${API_BASE_URL}/check_payment?payment_id=${data.id}`, {
        method: "GET",
        credentials: "include",
      });
      if (result.status === 401) {
        clearInterval(interval);
        return;
      }
      const result_data = await result.json();
      if (result_data === true) {
        clearInterval(interval);
        const newBalance = await getBalance();
        setBalance(newBalance);
      }
    }, 5000);
  }

  const getVpnKeys = async () => {
    const res = await apiFetch(`${API_BASE_URL}/vpn_keys`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (res.status === 401) return [];
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as typeof vpnKeys) : [];
  };

  const maskKey = (key: string) => {
    const s = (key ?? "").trim();
    if (s.length <= 18) return s;
    return `${s.slice(0, 12)}…${s.slice(-6)}`;
  };

  const countryLabel = (country: string) =>
    countryOptions.find((c) => c.value === (country as any))?.label ?? country;

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false; // lifetime
    const ts = Date.parse(expiresAt);
    if (Number.isNaN(ts)) return false;
    return ts <= Date.now();
  };

  const getRemainingLabel = (expiresAt: string | null) => {
    if (!expiresAt) return "Пожизненно";
    const ts = Date.parse(expiresAt);
    if (Number.isNaN(ts)) return "—";
    const diffMs = ts - Date.now();
    if (diffMs <= 0) return "Истек";

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days > 0) {
      return hours > 0 ? `${days} д. ${hours} ч.` : `${days} д.`;
    }
    return `${Math.max(hours, 1)} ч.`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast("Ключ успешно скопирован");
      setTimeout(() => setCopyToast(null), 1800);
    } catch {
      setCopyToast("Не удалось скопировать ключ");
      setTimeout(() => setCopyToast(null), 1800);
    }
  };

  const buyVpnKey = async () => {
    if (pricing.durationDays === null) return;
    setIsBuyingKey(true);
    setBuyKeyMessage(null);

    try {
      const res = await apiFetch(`${API_BASE_URL}/buy_vpn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          country: selectedCountry,
          duration: pricing.durationDays,
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (res.status === 401) return;
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const err = await res.json();
          setBuyKeyMessage(err?.message ?? `Ошибка ${res.status}`);
        } else {
          const text = await res.text();
          setBuyKeyMessage(text || `Ошибка ${res.status}`);
        }
        return;
      }

      // Success response may be a plain string with generated key.
      setBuyKeyMessage("Ключ успешно куплен.");
      const newBalance = await getBalance();
      setBalance(newBalance);
      const keys = await getVpnKeys();
      setVpnKeys(keys);
      setIsAddKeyOpen(false);
    } catch (e) {
      setBuyKeyMessage(e instanceof Error ? e.message : "Не удалось купить ключ");
    } finally {
      setIsBuyingKey(false);
    }
  };

  const getBalance = async () => {
    const res = await apiFetch(`${API_BASE_URL}/balance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (res.status === 401) return 0;
    const data = await res.json();
    return data;
  };

  useEffect(() => {
    const fetchBalance = async () => { // я так понимаю у useEffect своя область видимости, поэтому я создал функцию внутри него
      let balance = await getBalance();
      setBalance(balance);
    }
    fetchBalance();

    const fetchKeys = async () => {
      const keys = await getVpnKeys();
      setVpnKeys(keys);
    };
    fetchKeys();

    const fetchOwnReferral = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/referral`, {
          method: "GET",
          credentials: "include",
        });
        if (res.status === 401) return;
        if (!res.ok) return;
        const data = (await res.json()) as { referral_code?: string | null };
        const code = data?.referral_code?.trim().toUpperCase() ?? "";
        setOwnReferralCode(code || null);
      } catch {
        setOwnReferralCode(null);
      }
    };
    fetchOwnReferral();
  }, []);

  useEffect(() => {
    if (!isTopUpOpen) {
      setPromoBonusHint("none");
      return;
    }
    const raw = promoCode.trim();
    if (!raw) {
      setPromoBonusHint("none");
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(
          `${API_BASE_URL}/promo/validate?code=${encodeURIComponent(raw)}`,
          { credentials: "include" },
        );
        if (res.status === 401) return;
        if (!res.ok) {
          setPromoBonusHint("none");
          return;
        }
        const data = (await res.json()) as { valid?: boolean; own_code?: boolean };
        if (data.own_code) setPromoBonusHint("own");
        else if (data.valid) setPromoBonusHint("valid");
        else setPromoBonusHint("none");
      } catch {
        setPromoBonusHint("none");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [promoCode, isTopUpOpen]);


  return (
    <div className="bg-surface text-on-surface selection:bg-tertiary-fixed min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fbf9f5] dark:bg-[#1b1c1a]">
        <nav className="flex flex-wrap sm:flex-nowrap justify-between items-center w-full gap-2 sm:gap-3 px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.svg" alt="Логитип" className="w-8 h-8 object-contain" />
            <div className="text-sm sm:text-xl md:text-2xl font-serif font-bold text-[#271310] dark:text-[#ffffff] whitespace-nowrap">
              <span className="bg-orange-200 dark:bg-orange-300 px-1 text-[#271310]">КОФЕМАНИЯ</span>
              <span className="hidden sm:inline"> ВПН</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center bg-surface-container-high pl-4 pr-1 py-1 rounded-full">
              <span className="material-symbols-outlined text-primary text-[20px] mr-2">account_balance_wallet</span>
              <span className="font-bold text-primary font-mono select-all mr-3">{balance} ₽</span>
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="w-8 h-8 flex items-center justify-center bg-tertiary-fixed text-on-tertiary-fixed rounded-full hover:brightness-105 transition-all shadow-sm shrink-0"
                title="Пополнить баланс"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <Link className="text-[#504442] dark:text-[#efeeea] hover:text-[#271310] dark:hover:text-[#ffba38] transition-colors duration-300" href="/guide">Инструкции</Link>
            <button onClick={handleLogout} className="bg-primary-container text-white hover:bg-error-container hover:text-white hover:shadow-md px-6 py-2 rounded-full font-bold active:scale-95 transition-all duration-300">Выйти</button>
          </div>
          <button
            className="md:hidden text-primary"
            type="button"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Открыть меню"
            ref={mobileMenuButtonRef}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </nav>
        <div className="bg-[#efeeea] dark:bg-[#2a2a28] h-px w-full"></div>
        {isMobileMenuOpen ? (
          <div
            className="md:hidden absolute right-3 top-[calc(100%+8px)] z-[60]"
            ref={mobileMenuRef}
          >
            <div className="w-[260px] max-w-[72vw] rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-3 flex flex-col gap-2 shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsTopUpOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-bold"
              >
                Пополнить баланс
              </button>
              <Link
                href="/guide"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-4 py-3 rounded-xl text-primary font-semibold hover:bg-surface-container block"
              >
                Инструкции
              </Link>
              <Link
                href="/referral"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-4 py-3 rounded-xl text-primary font-semibold hover:bg-surface-container block"
              >
                Реферальная программа
              </Link>
              <Link
                href="/help"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-4 py-3 rounded-xl text-primary font-semibold hover:bg-surface-container block"
              >
                Помощь
              </Link>
              <button
                onClick={handleLogout}
                type="button"
                className="w-full text-left px-4 py-3 rounded-xl bg-primary-container text-white font-bold"
              >
                Выйти
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {/* SideNavBar (Hidden on small screens) */}
      <aside className="fixed left-0 top-0 h-full hidden md:flex flex-col p-6 z-40 bg-[#efeeea] dark:bg-[#2a2a28] w-64 rounded-r-3xl shadow-[0_12px_32px_-4px_rgba(27,28,26,0.06)] pt-24">

        <nav className="flex flex-col gap-2">
          <a className="bg-[#e6e0c9] dark:bg-[#3e2723] text-[#271310] dark:text-[#ffba38] rounded-full px-4 py-3 font-bold flex items-center gap-3 translate-x-1 transition-transform duration-200" href="#">
            <span className="material-symbols-outlined">vpn_key</span>
            <span className="font-label">Мои ключи</span>
          </a>
          <a className="text-[#504442] dark:text-[#efeeea] px-4 py-3 flex items-center gap-3 hover:bg-[#f5f3ef] dark:hover:bg-[#3e2723]/50 rounded-full transition-all" href="/referral">
            <span className="material-symbols-outlined">redeem</span>
            <span className="font-label">Реферальная программа</span>
          </a>

          <a className="text-[#504442] dark:text-[#efeeea] px-4 py-3 flex items-center gap-3 hover:bg-[#f5f3ef] dark:hover:bg-[#3e2723]/50 rounded-full transition-all" href="/help">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label">Помощь</span>
          </a>
        </nav>

      </aside>

      {/* Main Canvas */}
      <main className="md:ml-64 pt-24 pb-12 px-4 md:px-12 max-w-6xl mx-auto flex-1">
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary tracking-tight">Ваши ключи</h1>
            <p className="text-on-surface-variant max-w-md">Управляйте вашими персональными VLESS-ключами. Каждый ключ частично скрыт для максимальной безопасности.</p>
          </div>
          <button
            className="w-full sm:w-auto bg-tertiary-fixed text-on-tertiary-fixed px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:brightness-95 transition-all shadow-sm"
            type="button"
            onClick={() => setIsAddKeyOpen(true)}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Добавить ключ
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Keys List area */}
          <section className="lg:col-span-2 space-y-6">
            {vpnKeys.length === 0 ? (
              <div className="p-10 md:p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm">
                <div className="flex flex-col items-center text-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-primary text-[34px]">vpn_key</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary">
                      У вас пока нет ключей
                    </h3>
                    <p className="text-on-surface-variant max-w-lg">
                      Как только вы добавите ключ, он появится здесь — с быстрым копированием и статусом действия.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
                    <button
                      className="bg-tertiary-fixed text-on-tertiary-fixed px-8 py-3 rounded-full font-bold hover:brightness-95 transition-all shadow-sm"
                      onClick={() => setIsAddKeyOpen(true)}
                      type="button"
                    >
                      Добавить ключ
                    </button>
                    <Link
                      className="px-8 py-3 rounded-full font-bold border border-outline-variant/40 text-primary hover:bg-surface-container transition-colors text-center"
                      href="/guide"
                    >
                      Инструкции
                    </Link>
                  </div>
                  <div className="mt-2 w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface-variant">
                    Совет: сначала пополните баланс, затем выберите локацию и срок действия.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {vpnKeys.map((k) => {
                  const expired = isExpired(k.expires_at);
                  return (
                    <div
                      key={k.id}
                      className="bg-surface-container-lowest p-5 md:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-lg transition-all border border-transparent hover:border-outline-variant/20"
                    >
                      <div className="flex items-center gap-4 md:gap-5 min-w-0 w-full">
                        <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center overflow-hidden shrink-0">
                          {k.country === "germany1" || k.country === "germany2" ? (
                            <FlagBadge name="germany" size="lg" />
                          ) : k.country === "austria" ? (
                            <FlagBadge name="austria" size="lg" />
                          ) : k.country === "lte_bypass" ? (
                            <FlagBadge name="russia" size="lg" />
                          ) : (
                            <span className="material-symbols-outlined text-primary">public</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-primary text-lg">{countryLabel(k.country)}</h3>
                            {expired ? (
                              <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold uppercase rounded-full tracking-wider">
                                Истек
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded-full tracking-wider">
                                Активен
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-on-surface-variant font-mono truncate max-w-[30ch] sm:max-w-[46ch]">
                            {maskKey(k.vpn_key)}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Осталось:{" "}
                            <span className="font-semibold text-primary">
                              {getRemainingLabel(k.expires_at)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {!expired ? (
                        <button
                          className="self-end sm:self-auto p-3 bg-secondary-container text-primary rounded-full hover:bg-tertiary-fixed transition-colors shrink-0"
                          type="button"
                          onClick={() => copyToClipboard(k.vpn_key)}
                          title="Скопировать"
                        >
                          <span className="material-symbols-outlined">content_copy</span>
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Summary Sidebar */}
          <aside className="space-y-6">
            {/* Status Card */}


            {/* Quick Help Card */}
            <div className="bg-secondary-container p-6 rounded-xl space-y-4">
              <h4 className="font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined">auto_fix_high</span> Быстрая настройка</h4>
              <p className="text-sm text-on-secondary-container leading-relaxed">Скопируйте ключ VLESS и вставьте его в ваше приложение (Happ, Hiddify, V2RayNG, Amnezia).</p>
              <Link className="inline-flex items-center text-primary text-sm font-bold underline decoration-primary/30 hover:decoration-primary" href="/guide">Инструкция по установке <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span></Link>
            </div>

            {/* Referral Banner */}
            <Link href="/referral" className="relative h-48 rounded-xl overflow-hidden group block">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <img alt="Coffee beans" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="top view of roasted coffee beans scattered on a rustic wooden surface with warm atmospheric lighting and rich textures" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoHgBcHzcfd54lX_wGAEV6qu16kOltrrn0XE4mAEBm80zAcZmJkyH9cl1-7DO3pKUGYEcJG3PaEKY4-b_7dSQasThrETVnGnQe6MK7w51KCAb4prMC1tyl7_EWmLLDgPYxY9Iexd0Cu37Lw4ydX_LWBgDOHbiwS6oOE9A2irfjSaMlwzWkbGqM7nwXLAcaS5PhtosE00iQ_M3IPQdl568ujAvr_-tUsOwv-XfmU90ZeJNCtEc-w8ctV1n_l4OOcp6lx-dLplniSvM" />
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <p className="text-white font-bold leading-tight">Зарабатывай вместе с нами!</p>
                <span className="mt-2 inline-block text-[10px] text-tertiary-fixed uppercase font-bold tracking-widest">Узнать больше</span>
              </div>
            </Link>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col items-center gap-6 border-t border-[#efeeea] dark:border-[#2a2a28] bg-[#fbf9f5] dark:bg-[#1b1c1a] mt-auto">
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label" href="/about">О нас</a>
          <a className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label" href="/privacy">Политика конфиденциальности</a>
          <a className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label" href="/terms">Условия использования</a>
          <a className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label" href="/support">Поддержка</a>
        </div>
        <p className="text-[#504442] dark:text-[#efeeea]/60 text-xs uppercase tracking-widest font-label">© Coffee Mania VPN.</p>
      </footer>

      {/* TopUp Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden flex flex-col relative transform transition-all">
            <div className="px-6 py-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-primary">Пополнение баланса</h2>
              <button onClick={() => setIsTopUpOpen(false)} className="w-8 h-8 flex items-center justify-center bg-surface-container rounded-full text-on-surface hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-3 uppercase tracking-widest">Выберите сумму</label>
                <div className="grid grid-cols-3 gap-3">
                  {['150', '500', '1000'].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount)}
                      className={`py-3 rounded-xl font-bold transition-all border ${topUpAmount === amount ? 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed shadow-md' : 'bg-surface-container text-on-surface border-transparent hover:bg-surface-container-high'}`}
                    >
                      {amount} ₽
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-3 uppercase tracking-widest">Или введите другую сумму</label>
                <div className="relative">
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full bg-surface-container-high text-primary font-mono font-bold text-lg rounded-xl px-4 py-4 outline-none border-2 border-transparent focus:border-tertiary-fixed transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Например, 300"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">₽</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-3 uppercase tracking-widest">
                  ПРОМОКОД
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Введите промокод"
                  className="w-full bg-surface-container-high text-primary font-semibold rounded-xl px-4 py-4 outline-none border-2 border-transparent focus:border-tertiary-fixed transition-colors"
                />
                {promoBonusHint === "valid" ? (
                  <p className="mt-2 text-sm font-semibold text-green-600 dark:text-green-400">
                    Промокод действует: +10% к зачислению на баланс
                  </p>
                ) : null}
                {promoBonusHint === "own" ? (
                  <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                    Собственный промокод не даёт бонус к пополнению
                  </p>
                ) : null}
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20">
              <button
                onClick={() => {
                  const amount = Number(topUpAmount);
                  if (Number.isFinite(amount) && amount > 0) {
                    yookassaPayment(amount);
                  }
                  setIsTopUpOpen(false);
                }}
                className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">payments</span>
                Продолжить оплату
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Key Modal */}
      {isAddKeyOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-[24px] shadow-2xl overflow-visible flex flex-col relative">
            <div className="px-6 py-6 border-b border-outline-variant/20 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary">Добавить ключ</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Выберите страну и длительность доступа.
                </p>
              </div>
              <button
                onClick={() => setIsAddKeyOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-surface-container rounded-full text-on-surface hover:bg-surface-container-highest transition-colors"
                type="button"
                aria-label="Закрыть"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Dropdown
                  label="Страна"
                  value={selectedCountry}
                  options={countryOptions}
                  onChange={setSelectedCountry}
                />

                <Dropdown
                  label="Длительность"
                  value={selectedDuration}
                  options={durationOptions}
                  onChange={setSelectedDuration}
                />
              </div>

              <div className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                Выбрано:{" "}
                <span className="font-bold text-primary">
                  {countryOptions.find((c) => c.value === selectedCountry)?.label}
                </span>{" "}
                ·{" "}
                <span className="font-bold text-primary">
                  {durationOptions.find((d) => d.value === selectedDuration)?.label}
                </span>
              </div>
            </div>

            <div className="px-6 pb-2">
              <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-base md:text-lg font-extrabold text-primary uppercase tracking-widest">
                      Итого
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      {pricing.durationDays
                        ? `Срок: ${pricing.durationDays} дней`
                        : "Пожизненно"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {pricing.total !== null ? `${pricing.total}₽` : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setIsAddKeyOpen(false)}
                className="sm:flex-1 px-6 py-4 rounded-full font-bold border border-outline-variant/40 text-primary hover:bg-surface-container transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={buyVpnKey}
                disabled={pricing.total === null || isBuyingKey}
                className="sm:flex-1 bg-primary text-on-primary py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
                {isBuyingKey ? "Оплата..." : "Оплатить"}
              </button>
            </div>
            {buyKeyMessage ? (
              <div className="px-6 pb-6 text-sm text-on-surface-variant">{buyKeyMessage}</div>
            ) : null}
          </div>
        </div>
      )}

      {copyToast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130]">
          <div className="bg-primary text-on-primary px-5 py-3 rounded-full shadow-2xl font-bold text-sm">
            {copyToast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
