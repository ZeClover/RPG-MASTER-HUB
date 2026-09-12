import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RPG Master Hub",
    short_name: "RPG Hub",
    description: "O sistema operacional para campanhas de RPG de longa duração.",
    start_url: "/home",
    display: "standalone",
    background_color: "#0b0c10",
    theme_color: "#0b0c10",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
