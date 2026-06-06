import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tasky",
    short_name: "Tasky",
    description: "Personal task tracker",
    start_url: "/tasks",
    id: "/tasks",
    display: "standalone",
    orientation: "any",
    background_color: "#fafafa",
    theme_color: "#18181b",
    categories: ["productivity"],
    icons: [
      {
        src: "/api/icons/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/icons/512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        // Maskable: fill the full background so Android adaptive icons look right.
        src: "/api/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
