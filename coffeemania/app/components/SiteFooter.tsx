"use client";

export default function SiteFooter() {
  return (
    <footer className="w-full py-12 px-8 flex flex-col items-center gap-6 border-t border-[#DDD0C8] dark:border-[#2a2a28] bg-[#EDE0D8] dark:bg-[#1b1c1a] mt-auto">
      <div className="flex flex-wrap justify-center gap-8">
        <a
          className="text-[#B09080] dark:text-[#DDD0C8]/60 hover:text-[#3D1C1C] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label"
          href="/about"
        >
          О нас
        </a>
        <a
          className="text-[#B09080] dark:text-[#DDD0C8]/60 hover:text-[#3D1C1C] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label"
          href="/privacy"
        >
          Политика конфиденциальности
        </a>
        <a
          className="text-[#B09080] dark:text-[#DDD0C8]/60 hover:text-[#3D1C1C] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label"
          href="/terms"
        >
          Условия использования
        </a>
        <a
          className="text-[#B09080] dark:text-[#DDD0C8]/60 hover:text-[#3D1C1C] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label"
          href="/support"
        >
          Поддержка
        </a>
      </div>
      <p className="text-[#B09080] dark:text-[#DDD0C8]/60 text-xs uppercase tracking-widest font-label">
        © Coffee Mania VPN.
      </p>
    </footer>
  );
}
