"use client";

import { useState } from "react";
import TelegramLoginButton from "@/app/components/TelegramLoginButton";
import { authenticateWithTelegram } from "@/lib/telegramAuth";
import type { TelegramAuthResult } from "@/lib/telegram";

type TelegramAuthButtonProps = {
  label: string;
  fullWidth?: boolean;
  redirectTo?: string;
  onMessage?: (message: string, type: "success" | "error") => void;
};

export default function TelegramAuthButton({
  label,
  fullWidth = true,
  redirectTo = "/profile",
  onMessage,
}: TelegramAuthButtonProps) {
  const [isBusy, setIsBusy] = useState(false);

  const handleAuth = async (data: TelegramAuthResult) => {
    setIsBusy(true);
    try {
      const result = await authenticateWithTelegram(data);
      if (!result.ok) {
        onMessage?.(result.message, "error");
        return;
      }
      onMessage?.(result.body.message || "Успешно", "success");
      window.location.href = redirectTo;
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <TelegramLoginButton
      label={label}
      disabled={isBusy}
      fullWidth={fullWidth}
      onAuth={(data) => void handleAuth(data)}
    />
  );
}
