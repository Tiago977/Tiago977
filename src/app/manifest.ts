import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digitalizador de Documentos",
    short_name: "Digitalizador",
    description:
      "Digitalize documentos com a câmera, organize em pastas, envie em massa e converse com sua equipe.",
    lang: "pt-BR",
    start_url: "/arquivos",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f6f4",
    theme_color: "#2f6feb",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icone.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icone-mascara.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
