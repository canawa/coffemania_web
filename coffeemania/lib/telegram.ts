export const TELEGRAM_CLIENT_ID = Number(
  process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID ?? "7964141443",
);

export type TelegramAuthResult = {
  id_token?: string;
  user?: {
    id?: number;
    name?: string;
    preferred_username?: string;
    picture?: string;
  };
  error?: string;
};

declare global {
  interface Window {
    Telegram?: {
      Login: {
        init: (
          options: {
            client_id: number;
            request_access?: Array<"phone" | "write">;
            lang?: string;
            nonce?: string;
          },
          callback: (data: TelegramAuthResult) => void,
        ) => void;
        open: (callback?: (data: TelegramAuthResult) => void) => void;
        auth: (
          options: {
            client_id: number;
            request_access?: Array<"phone" | "write">;
            lang?: string;
            nonce?: string;
          },
          callback: (data: TelegramAuthResult) => void,
        ) => void;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadTelegramLoginScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.Telegram?.Login) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-telegram-login-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Telegram SDK")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://oauth.telegram.org/js/telegram-login.js?5";
    script.async = true;
    script.dataset.telegramLoginSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить Telegram Login"));
    document.body.appendChild(script);
  });

  return scriptPromise;
}
