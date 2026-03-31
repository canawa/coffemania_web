"use client";

export default function SiteFooter() {
  return (
    <footer className="w-full py-12 px-8 flex flex-col items-center gap-6 border-t border-[#efeeea] dark:border-[#2a2a28] bg-[#fbf9f5] dark:bg-[#1b1c1a] mt-auto">
      <div className="flex flex-wrap justify-center gap-8">
        <a
          className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label"
          href="/about"
        >
          О нас
        </a>
        <a
          className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label"
          href="/privacy"
        >
          Политика конфиденциальности
        </a>
        <a
          className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label"
          href="/terms"
        >
          Условия использования
        </a>
        <a
          className="text-[#504442] dark:text-[#efeeea]/60 hover:text-[#271310] dark:hover:text-[#ffffff] text-sm uppercase tracking-widest font-label"
          href="/support"
        >
          Поддержка
        </a>
      </div>
      <p className="text-[#504442] dark:text-[#efeeea]/60 text-xs uppercase tracking-widest font-label">
        © Coffee Mania VPN.
      </p>
    </footer>
  );
}
