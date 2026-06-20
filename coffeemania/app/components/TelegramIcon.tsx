type TelegramIconProps = {
  className?: string;
  size?: number;
};

export default function TelegramIcon({ className, size = 20 }: TelegramIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M9.04 15.29 8.7 19.7c.46 0 .66-.2.9-.43l2.16-2.07 4.48 3.28c.82.45 1.4.21 1.62-.75l2.94-13.8h.01c.26-1.2-.43-1.67-1.2-1.38L2.6 9.44c-1.16.45-1.14 1.1-.2 1.4l4.7 1.47L18.4 6.1c.56-.37 1.07-.16.65.21" />
    </svg>
  );
}
