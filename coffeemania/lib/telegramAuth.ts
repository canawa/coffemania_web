import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
import type { TelegramAuthResult } from "@/lib/telegram";

export type TelegramAuthResponse = {
  status?: string;
  message?: string;
  is_new_user?: boolean;
  subscription_synced?: boolean;
  link_action?: string;
};

export async function authenticateWithTelegram(
  data: TelegramAuthResult,
): Promise<{ ok: true; body: TelegramAuthResponse } | { ok: false; message: string }> {
  if (data.error) {
    if (data.error === "popup_closed") {
      return { ok: false, message: "Окно Telegram закрыто" };
    }
    return { ok: false, message: data.error };
  }

  const telegramId = data.user?.id;
  if (!data.id_token) {
    return {
      ok: false,
      message: telegramId
        ? "Telegram не вернул токен авторизации"
        : "Telegram не вернул данные пользователя",
    };
  }

  try {
    const res = await apiFetch(`${API_BASE_URL}/telegram/auth`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_token: data.id_token,
        telegram_id: telegramId ?? undefined,
      }),
    });
    const body = (await res.json()) as TelegramAuthResponse;

    if (!res.ok || body.status === "error") {
      return { ok: false, message: body.message || "Не удалось войти через Telegram" };
    }

    return { ok: true, body };
  } catch {
    return { ok: false, message: "Ошибка связи с сервером" };
  }
}
