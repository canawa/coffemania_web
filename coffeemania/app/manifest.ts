import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coffee Mania VPN",
    short_name: "CoffeeVPN",
    description:
      "Быстрый и удобный VPN-сервис с личным кабинетом, тарифами и ключами подключения.",
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
