"use client";

import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const PLATFORMS = [
  {
    id: "windows",
    label: "Windows",
    description: "Установщик для ПК и ноутбуков",
    icon: "desktop_windows",
    url: "https://github.com/canawa/vpn_client/releases/download/beta-release-1.3/coffeemania-Setup.exe",
  },
  {
    id: "android",
    label: "Android",
    description: "APK для смартфонов и планшетов",
    icon: "android",
    url: "https://github.com/canawa/vpn_client/releases/download/beta-release-1.4/app-release.apk",
  },
  {
    id: "android-tv",
    label: "Android TV",
    description: "Приложение для телевизоров",
    icon: "tv",
    url: "https://github.com/canawa/vpn_client/releases/download/beta-release-1.4/coffeemaniatv.apk",
  },
] as const;

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-fixed flex flex-col">
      <SiteHeader activeTab="download" />

      <main className="px-8 py-14 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            Скачать приложения
          </h1>
          <p className="mt-4 text-on-surface-variant max-w-2xl">
            Выберите платформу и установите официальное приложение Кофемания VPN.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-6 flex flex-col"
              >
                <span className="material-symbols-outlined text-4xl text-primary mb-4">
                  {platform.icon}
                </span>
                <h2 className="text-xl font-bold text-primary">{platform.label}</h2>
                <p className="mt-2 text-sm text-on-surface-variant flex-1">
                  {platform.description}
                </p>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full rounded-full px-4 py-3 font-bold text-center bg-primary text-on-primary hover:opacity-90 transition-opacity"
                >
                  Скачать
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
