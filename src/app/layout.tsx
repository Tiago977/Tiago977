import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Digitalizador",
    template: "%s · Digitalizador",
  },
  description:
    "Digitalize documentos com a câmera, organize em pastas, envie em massa e converse com sua equipe.",
  applicationName: "Digitalizador",
  appleWebApp: { capable: true, title: "Digitalizador", statusBarStyle: "default" },
  icons: { icon: "/icone.svg", apple: "/icone.svg" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#131315" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
