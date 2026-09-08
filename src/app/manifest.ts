import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Derviche Construcciones",
    short_name: "Derviche",
    description: "Gestión de clientes y presupuestos",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#1c1917",
    theme_color: "#1c1917",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
