"use client";

import { useRef } from "react";
import { openTelegramLogin, type TelegramAuthResult } from "@/lib/telegram";
import TelegramIcon from "@/app/components/TelegramIcon";

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
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2AABEE] hover:bg-[#229ED9] text-white px-6 py-3 font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      disabled={disabled}
      onClick={() => openTelegramLogin((data) => onAuthRef.current(data))}
    >
      <TelegramIcon size={20} />
      {label}
    </button>
  );
}
