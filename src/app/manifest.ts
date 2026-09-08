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
      { src: "/logo.png", sizes: "640x640", type: "image/jpeg", purpose: "any" },
    ],
  };
}
