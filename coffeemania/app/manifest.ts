import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "КОФЕМАНИЯ ВПН",
    short_name: "КОФЕМАНИЯ ВПН",
    description:
      "Быстрый и удобный VPN-сервис: регистрация, пополнение баланса, покупка ключей и подключение за пару минут.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9f5",
    theme_color: "#271310",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
