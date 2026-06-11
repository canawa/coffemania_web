import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "КОФЕМАНИЯ ВПН",
    short_name: "КОФЕМАНИЯ ВПН",
    description:
      "Быстрый и удобный VPN-сервис: регистрация, оплата подписки и подключение за пару минут.",
    start_url: "/",
    display: "standalone",
    background_color: "#EDE0D8",
    theme_color: "#3D1C1C",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
