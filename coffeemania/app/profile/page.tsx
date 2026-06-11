"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { PROFILE_ROUTE_REFRESH } from "@/app/components/ProfileRouteRefresh";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
import { FlagBadge, VPN_LOCATIONS } from "@/app/components/CountryFlags";
import {
  getPlanById,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/subscriptionPlans";

const PENDING_PAYMENT_ID_KEY = "pending_payment_id";
const PENDING_PAYMENT_STARTED_KEY = "pending_payment_started_at";
const PAYMENT_VERIFY_WINDOW_MS = 15 * 60 * 1000;

function clearPendingPayment() {
  localStorage.removeItem(PENDING_PAYMENT_ID_KEY);
  localStorage.removeItem(PENDING_PAYMENT_STARTED_KEY);
}

function getPendingPaymentDeadline(): number | null {
  const paymentId = localStorage.getItem(PENDING_PAYMENT_ID_KEY);
  const startedRaw = localStorage.getItem(PENDING_PAYMENT_STARTED_KEY);
  if (!paymentId || !startedRaw) {
    if (paymentId) clearPendingPayment();
    return null;
  }
  const startedAt = Number(startedRaw);
  if (!Number.isFinite(startedAt)) {
    clearPendingPayment();
    return null;
  }
  return startedAt + PAYMENT_VERIFY_WINDOW_MS;
}

function isPendingPaymentActive(): boolean {
  const deadline = getPendingPaymentDeadline();
  if (!deadline) return false;
  if (Date.now() > deadline) {
    clearPendingPayment();
    return false;
  }
  return true;
}

function markPendingPayment(paymentId: string) {
  localStorage.setItem(PENDING_PAYMENT_ID_KEY, paymentId);
  localStorage.setItem(PENDING_PAYMENT_STARTED_KEY, String(Date.now()));
}

export default function ProfilePage() {
  const pathname = usePathname();
  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [buyKeyMessage, setBuyKeyMessage] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{
    id?: number;
    active: boolean;
    subscription_url: string | null;
    expires_at?: string | null;
  }>({ active: false, subscription_url: null });
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>("1m");
  const selectedPlan = getPlanById(selectedPlanId);
  const [paymentVerifyState, setPaymentVerifyState] = useState<"idle" | "pending" | "error">("idle");
  const [paymentVerifyMessage, setPaymentVerifyMessage] = useState<string | null>(null);
  const [paymentVerifyVisible, setPaymentVerifyVisible] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const paymentPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [vpnKeys, setVpnKeys] = useState<
    Array<{
      id: number;
      country: string;
      duration: number;
      vpn_key: string;
      vpn_username?: string | null;
      created_at: string;
      expires_at: string | null;
    }>
  >([]);

  const payForSubscription = async () => {
    setIsPaying(true);
    setBuyKeyMessage(null);

    let redirecting = false;

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30000);

      const res = await apiFetch(`${API_BASE_URL}/create_payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          amount: selectedPlan.price,
          duration_days: selectedPlan.days,
          promo_code: null,
          purpose: subscription.active ? "renew" : "subscription",
          subscription_id: subscription.active ? subscription.id ?? null : null,
        }),
      });

      window.clearTimeout(timeoutId);

      if (res.status === 401) {
        const message = "Сессия истекла. Выйдите и войдите снова.";
        setBuyKeyMessage(message);
        setCopyToast(message);
        return;
      }

      let data: {
        id?: string;
        message?: string;
        confirmation?: { confirmation_url?: string };
        confirmation_url?: string;
      };

      try {
        data = (await res.json()) as typeof data;
      } catch {
        const message = "Сервер вернул некорректный ответ. Проверьте, что бэкенд запущен.";
        setBuyKeyMessage(message);
        setCopyToast(message);
        return;
      }

      if (!res.ok) {
        const message = data?.message ?? `Ошибка ${res.status}`;
        setBuyKeyMessage(message);
        setCopyToast(message);
        return;
      }

      const paymentId = data.id;
      const confirmationUrl =
        data.confirmation?.confirmation_url ?? data.confirmation_url;

      if (!paymentId || !confirmationUrl) {
        const message = "Не удалось получить ссылку на оплату. Попробуйте ещё раз.";
        setBuyKeyMessage(message);
        setCopyToast(message);
        return;
      }

      markPendingPayment(paymentId);
      redirecting = true;
      window.location.href = confirmationUrl;
    } catch (e) {
      const message =
        e instanceof Error && e.name === "AbortError"
          ? "Превышено время ожидания. Проверьте, что бэкенд запущен на порту 8001."
          : e instanceof Error
            ? e.message
            : "Не удалось начать оплату";
      setBuyKeyMessage(message);
      setCopyToast(message);
    } finally {
      if (!redirecting) {
        setIsPaying(false);
      }
    }
  };

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

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false; // lifetime
    const ts = Date.parse(expiresAt);
    if (Number.isNaN(ts)) return false;
    return ts <= Date.now();
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (days: number) => {
    if (days >= 365) return "12 месяцев";
    if (days >= 90) return "3 месяца";
    if (days >= 30) return "1 месяц";
    return `${days} дн.`;
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
      setCopyToast("Ссылка подписки скопирована");
      setTimeout(() => setCopyToast(null), 1800);
    } catch {
      setCopyToast("Не удалось скопировать ссылку подписки");
      setTimeout(() => setCopyToast(null), 1800);
    }
  };

  const copySubscriptionLink = async (link: string, fieldId: string) => {
    const el = document.getElementById(fieldId) as HTMLTextAreaElement | null;
    el?.select();
    await copyToClipboard(link);
  };

  const getSubscription = async () => {
    const res = await apiFetch(`${API_BASE_URL}/subscription`, {
      method: "GET",
      credentials: "include",
    });
    if (res.status === 401 || !res.ok) {
      return { active: false, subscription_url: null };
    }
    const data = (await res.json()) as {
      id?: number;
      active?: boolean;
      subscription_url?: string | null;
      expires_at?: string | null;
    };
    return {
      id: data?.id,
      active: Boolean(data?.active),
      subscription_url: data?.subscription_url ?? null,
      expires_at: data?.expires_at ?? null,
    };
  };

  const refreshSubscriptionData = useCallback(async () => {
    const keys = await getVpnKeys();
    setVpnKeys(keys);
    const sub = await getSubscription();
    setSubscription(sub);
  }, []);

  const hidePaymentVerify = useCallback(() => {
    setPaymentVerifyVisible(false);
    setPaymentVerifyState("idle");
    setPaymentVerifyMessage(null);
  }, []);

  const verifyPendingPayment = useCallback(async (manual = false): Promise<boolean> => {
    if (!isPendingPaymentActive()) {
      hidePaymentVerify();
      return false;
    }

    const pendingId = localStorage.getItem(PENDING_PAYMENT_ID_KEY);
    if (!pendingId) {
      hidePaymentVerify();
      return false;
    }

    if (manual) setIsVerifyingPayment(true);

    try {
      const result = await apiFetch(`${API_BASE_URL}/check_payment?payment_id=${pendingId}`, {
        method: "GET",
        credentials: "include",
      });
      if (result.status === 401) {
        setPaymentVerifyState("error");
        setPaymentVerifyMessage("Сессия истекла. Войдите снова и нажмите «Проверить оплату».");
        return false;
      }

      const data = (await result.json()) as
        | { status?: string; message?: string }
        | boolean;

      if (data === true || (typeof data === "object" && data.status === "success")) {
        clearPendingPayment();
        await refreshSubscriptionData();
        hidePaymentVerify();
        setCopyToast("Оплата прошла успешно, подписка активирована");
        setTimeout(() => setCopyToast(null), 3000);
        return true;
      }

      if (typeof data === "object" && data.status === "pending") {
        setPaymentVerifyState("pending");
        setPaymentVerifyMessage("Ожидаем подтверждение оплаты от банка...");
        return false;
      }

      setPaymentVerifyState("error");
      setPaymentVerifyMessage(
        typeof data === "object" && data.message
          ? data.message
          : "Не удалось подтвердить оплату. Попробуйте ещё раз.",
      );
      return false;
    } catch {
      setPaymentVerifyState("error");
      setPaymentVerifyMessage("Ошибка связи с сервером. Проверьте интернет и попробуйте снова.");
      return false;
    } finally {
      if (manual) setIsVerifyingPayment(false);
    }
  }, [hidePaymentVerify, refreshSubscriptionData]);

  useEffect(() => {
    void refreshSubscriptionData();

    const refresh = () => {
      void refreshSubscriptionData();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const onPopState = () => {
      requestAnimationFrame(() => {
        if (window.location.pathname === "/profile") {
          refresh();
        }
      });
    };

    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("popstate", onPopState);
    window.addEventListener(PROFILE_ROUTE_REFRESH, refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(PROFILE_ROUTE_REFRESH, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname, refreshSubscriptionData]);

  useEffect(() => {
    if (!isPendingPaymentActive()) {
      hidePaymentVerify();
      return;
    }

    setPaymentVerifyVisible(true);
    let cancelled = false;

    const scheduleHideAtDeadline = () => {
      const deadline = getPendingPaymentDeadline();
      if (!deadline) return;
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        clearPendingPayment();
        hidePaymentVerify();
        return;
      }
      paymentHideRef.current = setTimeout(() => {
        if (cancelled) return;
        clearPendingPayment();
        hidePaymentVerify();
      }, remaining);
    };

    const scheduleNext = () => {
      if (cancelled || !isPendingPaymentActive()) return;
      paymentPollRef.current = setTimeout(tick, 3000);
    };

    const tick = async () => {
      if (cancelled || !isPendingPaymentActive()) {
        hidePaymentVerify();
        return;
      }
      setPaymentVerifyVisible(true);
      setPaymentVerifyState("pending");
      setPaymentVerifyMessage("Ожидаем подтверждение оплаты от банка...");
      const ok = await verifyPendingPayment();
      if (ok || cancelled) return;
      if (isPendingPaymentActive()) {
        scheduleNext();
      } else {
        hidePaymentVerify();
      }
    };

    scheduleHideAtDeadline();
    tick();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void refreshSubscriptionData();
      if (isPendingPaymentActive()) {
        if (paymentPollRef.current) clearTimeout(paymentPollRef.current);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (paymentPollRef.current) clearTimeout(paymentPollRef.current);
      if (paymentHideRef.current) clearTimeout(paymentHideRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [verifyPendingPayment, hidePaymentVerify, refreshSubscriptionData]);

  const hasPaymentBanner =
    paymentVerifyVisible &&
    (paymentVerifyState === "pending" || paymentVerifyState === "error");

  return (
    <>
        {hasPaymentBanner && (
          <div
            className={`mb-8 rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              paymentVerifyState === "pending"
                ? "border-tertiary-fixed/40 bg-tertiary-fixed/10"
                : "border-error/30 bg-error-container/20"
            }`}
          >
            <p className="text-sm md:text-base text-on-surface">{paymentVerifyMessage}</p>
            <button
              type="button"
              onClick={() => void verifyPendingPayment(true)}
              disabled={isVerifyingPayment}
              className="shrink-0 w-full sm:w-auto px-6 py-3 rounded-full font-bold bg-button text-on-button hover:bg-button-hover disabled:opacity-60 transition-all"
            >
              {isVerifyingPayment ? "Проверка..." : "Проверить оплату"}
            </button>
          </div>
        )}

        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary tracking-tight">Ваша подписка</h1>
            <p className="text-on-surface-variant max-w-md">Управляйте подпиской, следите за сроком действия и копируйте ссылку для подключения в приложении.</p>
          </div>
          <button
            className="w-full sm:w-auto bg-button text-on-button px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-button-hover transition-all shadow-sm"
            type="button"
            onClick={() => setIsAddKeyOpen(true)}
          >
            <span className="material-symbols-outlined">add_circle</span>
            {subscription.active ? "Продлить подписку" : "Купить подписку"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] gap-6 lg:gap-8 w-full min-w-0">
          <section className="min-w-0 space-y-6">
            {vpnKeys.length === 0 ? (
              <div className="p-10 md:p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm">
                <div className="flex flex-col items-center text-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-primary text-[34px]">vpn_key</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary">
                      У вас пока нет подписки
                    </h3>
                    <p className="text-on-surface-variant max-w-lg">
                      Как только вы оформите подписку, она появится здесь — с быстрым копированием ссылки и статусом действия.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
                    <button
                      className="bg-button text-on-button px-8 py-3 rounded-full font-bold hover:bg-button-hover transition-all shadow-sm"
                      onClick={() => setIsAddKeyOpen(true)}
                      type="button"
                    >
                      {subscription.active ? "Продлить подписку" : "Купить подписку"}
                    </button>
                  </div>
                  <div className="mt-2 w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface-variant">
                    Совет: нажмите «Купить подписку», ознакомьтесь с условиями и перейдите к оплате.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {vpnKeys.map((k) => {
                  const expired = isExpired(k.expires_at);
                  const linkFieldId = `subscription-link-${k.id}`;
                  return (
                    <div
                      key={k.id}
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden"
                    >
                      <div className="px-5 py-4 md:px-8 md:py-6 space-y-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {expired ? (
                            <span className="px-3 py-1 bg-error-container text-on-error-container text-xs font-bold uppercase rounded-full tracking-wider">
                              Истек
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-bold uppercase rounded-full tracking-wider">
                              Активен
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-xl bg-surface-container-low px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Оформлена</p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              {formatDateTime(k.created_at)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-surface-container-low px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Действует до</p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              {k.expires_at ? formatDateTime(k.expires_at) : "Без срока"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-surface-container-low px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Осталось</p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              {getRemainingLabel(k.expires_at)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-surface-container-low px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Тариф</p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              {formatDuration(k.duration)} · безлимит · до 3 устройств
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="font-bold text-primary">Ссылка для подключения</p>
                          <div className="relative">
                            <textarea
                              id={linkFieldId}
                              readOnly
                              value={k.vpn_key}
                              rows={3}
                              onFocus={(e) => e.target.select()}
                              onClick={(e) => e.currentTarget.select()}
                              className="w-full rounded-xl border-2 border-[#B09080]/50 dark:border-[#8c7a72]/50 bg-[#EDE0D8] dark:bg-[#423431] px-4 py-3 pr-12 text-sm font-mono text-primary dark:text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-[#B09080]/30 dark:focus:ring-tertiary-fixed/40"
                            />
                            <button
                              type="button"
                              onClick={() => void copySubscriptionLink(k.vpn_key, linkFieldId)}
                              className="absolute right-2 top-2 p-2 rounded-lg bg-secondary-container dark:bg-[#322522] text-primary hover:bg-tertiary-fixed transition-colors"
                              title="Скопировать"
                            >
                              <span className="material-symbols-outlined text-[20px]">content_copy</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => void copySubscriptionLink(k.vpn_key, linkFieldId)}
                            className="w-full bg-button text-on-button py-3.5 md:py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-button-hover transition-all"
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                            Скопировать ссылку подписки
                          </button>
                        </div>
                      </div>

                      {k.vpn_key ? (
                        <div className="px-5 pb-5 md:px-8 md:pb-6">
                          <a
                            href={k.vpn_key}
                            className="w-full px-4 py-3.5 md:py-4 rounded-full font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined">link</span>
                            Подключиться
                          </a>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-4 min-w-0 max-w-full lg:sticky lg:top-28">
            <a
              href="https://github.com/canawa/vpn_client/releases/download/beta-release-1.01/coffeemania-beta-1.01.apk"
              className="block w-full max-w-full rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/40"
            >
              <img
                src="/appdownload.png"
                alt="Кофемания VPN — скачать приложение для Android"
                className="block w-full max-w-full h-auto"
              />
            </a>
          </aside>
        </div>

      {/* Payment Modal */}
      {isAddKeyOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-[22rem] sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 md:px-8 md:py-5 border-b border-outline-variant/20 flex justify-between items-center gap-3">
              <h2 className="text-lg md:text-2xl font-serif font-bold text-primary">
                {subscription.active ? "Продлить подписку" : "Купить подписку"}
              </h2>
              <button
                onClick={() => setIsAddKeyOpen(false)}
                className="w-8 h-8 shrink-0 flex items-center justify-center bg-surface-container rounded-full text-on-surface hover:bg-surface-container-highest transition-colors"
                type="button"
                aria-label="Закрыть"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="px-4 py-3 md:px-8 md:py-6 space-y-3 md:space-y-5">
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const active = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`rounded-lg md:rounded-xl border px-2 py-2 md:px-4 md:py-4 text-left transition-all ${
                        active
                          ? "border-tertiary-fixed bg-tertiary-fixed/15"
                          : "border-outline-variant/25 bg-surface-container"
                      }`}
                    >
                      <div className="font-bold text-primary text-[10px] md:text-sm leading-tight">{plan.label}</div>
                      <div className="text-sm md:text-xl font-mono font-bold text-primary mt-0.5 md:mt-1">
                        {plan.price} ₽
                      </div>
                      {plan.discount ? (
                        <div className="text-[9px] md:text-xs font-bold text-green-700 dark:text-green-400 mt-0.5 md:mt-1">
                          {plan.discount}
                        </div>
                      ) : (
                        <div className="text-[9px] md:text-xs text-on-surface-variant mt-0.5 md:mt-1">{plan.periodLabel}</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg md:rounded-xl bg-surface-container-low px-3 py-2.5 md:px-5 md:py-4 text-[11px] md:text-sm text-on-surface-variant leading-snug">
                <p className="font-semibold text-primary text-xs md:text-base mb-1">В подписку входит</p>
                <p>
                  {selectedPlan.periodLabel.toLowerCase()} · безлимит · до 3 устройств · Обход LTE глушилок
                </p>
                <p className="font-semibold text-primary text-xs md:text-base mt-2 md:mt-3 mb-1.5 md:mb-2">Локации</p>
                <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-3">
                  {VPN_LOCATIONS.map((location) => (
                    <div
                      key={location.flag}
                      className="flex flex-col items-center gap-0.5 md:gap-1 rounded-md md:rounded-lg bg-surface-container px-1 py-1 md:px-2 md:py-2 text-center"
                    >
                      <FlagBadge name={location.flag} size="sm" />
                      <span className="text-[9px] md:text-xs leading-tight text-on-surface">{location.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg md:rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 md:px-5 md:py-4">
                <span className="text-xs md:text-sm font-bold text-primary uppercase tracking-wide">К оплате</span>
                <span className="text-xl md:text-3xl font-mono font-bold text-primary">{selectedPlan.price} ₽</span>
              </div>
            </div>

            <div className="px-4 pb-4 md:px-8 md:pb-6 flex gap-2 md:gap-4">
              <button
                type="button"
                onClick={() => setIsAddKeyOpen(false)}
                className="flex-1 px-4 py-2.5 md:py-4 rounded-full text-sm md:text-base font-bold border border-outline-variant/40 text-primary hover:bg-surface-container transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={payForSubscription}
                disabled={isPaying}
                className="flex-[1.4_1_0%] bg-button hover:bg-button-hover text-on-button py-2.5 md:py-4 px-4 rounded-full font-bold text-base md:text-lg shadow-lg flex items-center justify-center gap-2 md:gap-3 disabled:opacity-60"
              >
                <img src="/sbp.png" alt="СБП" className="h-6 md:h-8 w-auto object-contain" />
                {isPaying ? "Переход..." : "Оплатить!"}
              </button>
            </div>
            {buyKeyMessage ? (
              <div className="px-4 md:px-8 pb-3 md:pb-4 text-xs md:text-sm text-on-surface-variant">{buyKeyMessage}</div>
            ) : null}
          </div>
        </div>
      )}

      {copyToast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130]">
          <div className="bg-button text-on-button px-5 py-3 rounded-full shadow-2xl font-bold text-sm">
            {copyToast}
          </div>
        </div>
      ) : null}
    </>
  );
}
