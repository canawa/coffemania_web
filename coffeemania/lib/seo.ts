import type { Metadata } from "next";

export const SITE_URL = "https://coffeemaniavpn.ru";
export const SITE_NAME = "КОФЕМАНИЯ ВПН";
export const SITE_LOCALE = "ru_RU";
export const SUPPORT_TELEGRAM = "@coffeemaniasup2";
export const TELEGRAM_BOT_URL = "https://t.me/coffemaniaVPNbot";

export const DEFAULT_DESCRIPTION =
  "Быстрый и стабильный VPN по цене чашки кофе: серверы в Европе и России, обход блокировок, оплата за минуту, личный кабинет и поддержка 24/7.";

export const DEFAULT_KEYWORDS = [
  "VPN",
  "VPN Россия",
  "купить VPN",
  "VPN подписка",
  "быстрый VPN",
  "обход блокировок",
  "VPN Германия",
  "VPN Австрия",
  "защищённое соединение",
  "КОФЕМАНИЯ ВПН",
  "coffeemania vpn",
] as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
}: PageMetaInput): Metadata {
  const canonicalPath = path === "/" ? "/" : path.replace(/\/$/, "") || "/";
  const fullTitle = title === SITE_NAME ? title : title;

  return {
    title: fullTitle,
    description,
    keywords: keywords ? [...DEFAULT_KEYWORDS, ...keywords] : [...DEFAULT_KEYWORDS],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      url: absoluteUrl(canonicalPath),
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      locale: SITE_LOCALE,
      images: [
        {
          url: "/logo.svg",
          width: 512,
          height: 512,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/logo.svg"],
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export const NOINDEX_METADATA = createPageMetadata({
  title: "Служебная страница",
  description: "Служебная страница КОФЕМАНИЯ ВПН.",
  path: "/",
  noIndex: true,
});

/** Публичные URL для sitemap.xml */
export const PUBLIC_SITEMAP_ROUTES = [
  { path: "/", changeFrequency: "daily" as const, priority: 1 },
  { path: "/register", changeFrequency: "weekly" as const, priority: 0.95 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.75 },
  { path: "/help", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/support", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.5 },
];

export const HELP_FAQ_ITEMS = [
  {
    question: "Как получить подписку?",
    answer:
      "В личном кабинете нажмите «Купить подписку», ознакомьтесь с информацией о платеже и нажмите «Оплатить!». После успешной оплаты через ЮKassa подписка появится автоматически.",
  },
  {
    question: "Почему не проходит вход в кабинет?",
    answer:
      "Проверьте корректность email и пароля, а также включены ли cookies в браузере. Если проблема не исчезает, обратитесь в поддержку.",
  },
  {
    question: "Как работает реферальная программа?",
    answer:
      "Вы создаёте авторский промокод один раз и делитесь им с друзьями. На странице «Реферальная программа» отображаются количество депозитов по коду и их сумма.",
  },
  {
    question: "Куда писать, если нужна помощь?",
    answer: `Telegram: ${SUPPORT_TELEGRAM} или страница «Поддержка» на сайте.`,
  },
] as const;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.svg"),
    description: DEFAULT_DESCRIPTION,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/support"),
      availableLanguage: ["Russian"],
    },
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "ru-RU",
  };
}

export function faqPageJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
