"use client";

import { useCallback, useEffect, useState } from "react";
import TelegramLoginButton from "@/app/components/TelegramLoginButton";
import { PROFILE_ROUTE_REFRESH } from "@/app/components/ProfileRouteRefresh";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
import type { TelegramAuthResult } from "@/lib/telegram";

type TelegramStatus = {
  linked: boolean;
  telegram_id?: number | null;
  telegram_username?: string | null;
  telegram_name?: string | null;
  telegram_photo_url?: string | null;
  telegram_linked_at?: string | null;
};

export default function TelegramSyncCard() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/telegram/status`, {
        method: "GET",
        credentials: "include",
      });
      const data = (await res.json()) as TelegramStatus & { message?: string };
      if (!res.ok) {
        setMessage(data.message || "Не удалось загрузить статус Telegram");
        return;
      }
      setStatus(data);
    } catch {
      setMessage("Ошибка связи с сервером");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleAuth = async (data: TelegramAuthResult) => {
    if (data.error) {
      setMessage(data.error);
      return;
    }

    const telegramId = data.user?.id;
    if (!data.id_token) {
      setMessage(
        telegramId
          ? "Telegram не вернул токен авторизации"
          : "Telegram не вернул данные пользователя",
      );
      return;
    }

    setIsBusy(true);
    setMessage(null);

    try {
      const res = await apiFetch(`${API_BASE_URL}/telegram/link`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: data.id_token,
          telegram_id: telegramId ?? undefined,
        }),
      });
      const body = (await res.json()) as TelegramStatus & {
        status?: string;
        message?: string;
        subscription_synced?: boolean;
        link_action?: "imported_from_bot" | "attached_to_web" | "pending_purchase";
      };

      if (!res.ok || body.status === "error") {
        setMessage(body.message || "Не удалось подключить Telegram");
        return;
      }

      setStatus(body);
      setMessage(body.message || "Telegram успешно подключён");
      if (body.subscription_synced || body.link_action === "imported_from_bot") {
        window.dispatchEvent(new CustomEvent(PROFILE_ROUTE_REFRESH));
      }
    } catch {
      setMessage("Не удалось подключить Telegram");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm overflow-hidden px-5 py-5 space-y-4">
      {isLoading ? (
        <p className="text-sm text-on-surface-variant">Загружаем статус…</p>
      ) : status?.linked ? (
        <div className="flex items-center gap-3">
          {status.telegram_photo_url ? (
            <img
              src={status.telegram_photo_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-outline-variant/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-primary">person</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-primary truncate">
              {status.telegram_name || "Telegram подключён"}
            </p>
            {status.telegram_username ? (
              <p className="text-sm text-on-surface-variant truncate">@{status.telegram_username}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <TelegramLoginButton onAuth={(data) => void handleAuth(data)} disabled={isBusy} />
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Подключите Telegram, чтобы синхронизировать свою подписку с ботом и удобно управлять как в на сайте так и в боте.
          </p>
        </>
      )}

      {message ? (
        <div
          className={
            message.includes("успеш") ||
            message.includes("подключ") ||
            message.includes("привязан") ||
            message.includes("синхрониз")
              ? "text-sm text-on-secondary-fixed bg-secondary-fixed rounded-xl px-4 py-3"
              : "text-sm text-on-error-container bg-error-container rounded-xl px-4 py-3"
          }
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
