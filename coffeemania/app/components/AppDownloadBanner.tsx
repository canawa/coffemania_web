"use client";

import Link from "next/link";

export default function AppDownloadBanner() {
  return (
    <Link
      href="/download"
      className="block w-full max-w-full rounded-[28px] overflow-hidden shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/40"
    >
      <img
        src="/app_ad.png"
        alt="Кофемания VPN — скачать приложения для Windows, Android и Android TV"
        className="block w-full max-w-full h-auto rounded-[28px]"
      />
    </Link>
  );
}
