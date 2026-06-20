"use client";

import { useState } from "react";

const APP_DOWNLOAD_URLS = {
  windows:
    "https://github.com/canawa/vpn_client/releases/download/beta-release-1.3/coffeemania-Setup.exe",
  android:
    "https://github.com/canawa/vpn_client/releases/download/beta-release-1.3/coffeemaniavpn-1.3.apk",
} as const;

type Platform = keyof typeof APP_DOWNLOAD_URLS;

const PLATFORMS: Array<{
  id: Platform;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: "windows",
    label: "Windows",
    description: "Установщик для ПК",
    icon: "desktop_windows",
  },
  {
    id: "android",
    label: "Android",
    description: "APK для смартфона",
    icon: "android",
  },
];

function downloadApp(platform: Platform) {
  const url = APP_DOWNLOAD_URLS[platform];
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener noreferrer";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function AppDownloadBanner() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="block w-full max-w-full rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/40"
      >
        <img
          src="/app_ad.png"
          alt="Кофемания VPN — скачать приложение для Windows и Android"
          className="block w-full max-w-full h-auto"
        />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-surface-container-lowest w-full max-w-md rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 md:px-8 md:py-5 border-b border-outline-variant/20 flex justify-between items-center gap-3">
              <h2 className="text-lg md:text-2xl font-serif font-bold text-primary">
                Скачать приложение
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 shrink-0 flex items-center justify-center bg-surface-container rounded-full text-on-surface hover:bg-surface-container-highest transition-colors"
                type="button"
                aria-label="Закрыть"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="px-5 py-5 md:px-8 md:py-6 space-y-3">
              <p className="text-sm text-on-surface-variant">
                Выберите платформу — файл начнёт скачиваться сразу после выбора.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => downloadApp(platform.id)}
                    className="rounded-xl border-2 border-[#B09080]/60 dark:border-[#8c7a72]/50 bg-[#EDE0D8] dark:bg-[#322522] hover:border-[#3D1C1C]/50 dark:hover:border-[#ffba38]/60 px-4 py-5 text-left transition-all"
                  >
                    <span className="material-symbols-outlined text-3xl text-primary mb-3 block">
                      {platform.icon}
                    </span>
                    <p className="font-bold text-primary">{platform.label}</p>
                    <p className="text-sm text-on-surface-variant mt-1">{platform.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
