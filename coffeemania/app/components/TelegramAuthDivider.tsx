export default function TelegramAuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-outline-variant/30 dark:bg-[#8c7a72]/40" />
      <span className="text-xs uppercase tracking-widest text-on-surface-variant dark:text-[#8c7a72]">
        или
      </span>
      <div className="h-px flex-1 bg-outline-variant/30 dark:bg-[#8c7a72]/40" />
    </div>
  );
}
