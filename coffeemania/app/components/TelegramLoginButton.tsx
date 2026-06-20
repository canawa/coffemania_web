"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadTelegramLoginScript,
  TELEGRAM_CLIENT_ID,
  type TelegramAuthResult,
} from "@/lib/telegram";

type TelegramLoginButtonProps = {
  onAuth: (data: TelegramAuthResult) => void;
  disabled?: boolean;
  label?: string;
};

export default function TelegramLoginButton({
  onAuth,
  disabled = false,
  label = "Подключить Telegram",
}: TelegramLoginButtonProps) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  useEffect(() => {
    let cancelled = false;

    loadTelegramLoginScript()
      .then(() => {
        if (cancelled || !window.Telegram?.Login) {
          return;
        }
        window.Telegram.Login.init(
          {
            client_id: TELEGRAM_CLIENT_ID,
            request_access: ["write"],
            lang: "ru",
          },
          (data) => onAuthRef.current(data),
        );
        setReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Не удалось загрузить Telegram Login",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2AABEE] hover:bg-[#229ED9] text-white px-6 py-3 font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={!ready || disabled}
        onClick={() => window.Telegram?.Login.open((data) => onAuthRef.current(data))}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9.04 15.29 8.7 19.7c.46 0 .66-.2.9-.43l2.16-2.07 4.48 3.28c.82.45 1.4.21 1.62-.75l2.94-13.8h.01c.26-1.2-.43-1.67-1.2-1.38L2.6 9.44c-1.16.45-1.14 1.1-.2 1.4l4.7 1.47L18.4 6.1c.56-.37 1.07-.16.65.21" />
        </svg>
        {label}
      </button>
      {loadError ? (
        <p className="text-sm text-on-error-container bg-error-container rounded-lg px-3 py-2">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
