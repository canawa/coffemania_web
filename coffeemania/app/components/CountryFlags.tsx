import type { ReactNode } from "react";

export type CountryFlagName =
  | "germany"
  | "austria"
  | "latvia"
  | "netherlands"
  | "france"
  | "russia"
  | "finland"
  | "poland";

export const VPN_LOCATIONS: Array<{ flag: CountryFlagName; label: string }> = [
  { flag: "germany", label: "Германия" },
  { flag: "austria", label: "Австрия" },
  { flag: "latvia", label: "Латвия" },
  { flag: "netherlands", label: "Нидерланды" },
  { flag: "france", label: "Франция" },
  { flag: "russia", label: "Россия" },
  { flag: "finland", label: "Финляндия" },
  { flag: "poland", label: "Польша" },
];

export function FlagSvg({ name }: { name: CountryFlagName }) {
  const common = {
    width: 22,
    height: 16,
    viewBox: "0 0 22 16",
    xmlns: "http://www.w3.org/2000/svg",
  } as const;

  const clipId = `flag-clip-${name}`;

  const Clip = () => (
    <defs>
      <clipPath id={clipId}>
        <rect x="0" y="0" width="22" height="16" rx="2" ry="2" />
      </clipPath>
    </defs>
  );

  const wrap = (children: ReactNode) => (
    <svg {...common} aria-hidden="true" focusable="false">
      <Clip />
      <g clipPath={`url(#${clipId})`}>{children}</g>
    </svg>
  );

  switch (name) {
    case "germany":
      return wrap(
        <>
          <rect width="22" height="16" fill="#000000" />
          <rect y="5.333" width="22" height="5.333" fill="#DD0000" />
          <rect y="10.666" width="22" height="5.334" fill="#FFCE00" />
        </>,
      );
    case "austria":
      return wrap(
        <>
          <rect width="22" height="16" fill="#ED2939" />
          <rect y="5.333" width="22" height="5.333" fill="#FFFFFF" />
        </>,
      );
    case "latvia":
      return wrap(
        <>
          <rect width="22" height="16" fill="#9E3039" />
          <rect y="6.4" width="22" height="3.2" fill="#FFFFFF" />
        </>,
      );
    case "netherlands":
      return wrap(
        <>
          <rect width="22" height="5.333" fill="#AE1C28" />
          <rect y="5.333" width="22" height="5.333" fill="#FFFFFF" />
          <rect y="10.666" width="22" height="5.334" fill="#21468B" />
        </>,
      );
    case "france":
      return wrap(
        <>
          <rect width="7.333" height="16" fill="#0055A4" />
          <rect x="7.333" width="7.334" height="16" fill="#FFFFFF" />
          <rect x="14.667" width="7.333" height="16" fill="#EF4135" />
        </>,
      );
    case "russia":
      return wrap(
        <>
          <rect width="22" height="16" fill="#FFFFFF" />
          <rect y="5.333" width="22" height="5.333" fill="#0039A6" />
          <rect y="10.666" width="22" height="5.334" fill="#D52B1E" />
        </>,
      );
    case "finland":
      return wrap(
        <>
          <rect width="22" height="16" fill="#FFFFFF" />
          <rect x="6" width="4" height="16" fill="#003580" />
          <rect y="6" width="22" height="4" fill="#003580" />
        </>,
      );
    case "poland":
      return wrap(
        <>
          <rect width="22" height="8" fill="#FFFFFF" />
          <rect y="8" width="22" height="8" fill="#DC143C" />
        </>,
      );
  }
}

export function FlagBadge({
  name,
  size = "sm",
}: {
  name: CountryFlagName;
  size?: "sm" | "lg";
}) {
  const cls =
    size === "lg"
      ? "w-[28px] h-[20px] rounded-[6px]"
      : "w-[22px] h-[16px] rounded-[4px]";

  return (
    <span
      className={`${cls} overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.06)] border border-outline-variant/20 shrink-0 flex items-center justify-center bg-surface`}
    >
      <FlagSvg name={name} />
    </span>
  );
}
