type ThemeToggleProps = {
  isDark: boolean;
  onChange: (isDark: boolean) => void;
};

export default function ThemeToggle({ isDark, onChange }: ThemeToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Тёмная тема включена" : "Светлая тема включена"}
      onClick={() => onChange(!isDark)}
      className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-outline-variant/30 bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/40"
    >
      <span
        className={`pointer-events-none absolute left-1 flex h-5 w-5 items-center justify-center transition-opacity ${
          isDark ? "opacity-40" : "opacity-100"
        }`}
      >
        <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">light_mode</span>
      </span>
      <span
        className={`pointer-events-none absolute right-1 flex h-5 w-5 items-center justify-center transition-opacity ${
          isDark ? "opacity-100" : "opacity-40"
        }`}
      >
        <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">dark_mode</span>
      </span>
      <span
        className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-primary-container shadow-md transition-transform duration-200 ${
          isDark ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}
