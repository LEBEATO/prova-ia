import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalMotion from "@/components/animations/GlobalMotion";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prova-ia-six.vercel.app"),
  title: {
    default: "Prova IA — Simulados inteligentes para concursos",
    template: "%s | Prova IA",
  },
  description:
    "Envie seu edital, gere simulados personalizados, acompanhe seu desempenho e evolua por assunto com o Prova IA.",
  applicationName: "Prova IA",
  keywords: [
    "concursos",
    "simulados",
    "professores",
    "edital",
    "provas",
    "estudos",
    "inteligência artificial",
  ],
  openGraph: {
    title: "Prova IA — Prepare-se com estratégia",
    description:
      "Transforme seu edital em simulados personalizados e acompanhe sua evolução por assunto.",
    url: "https://prova-ia-six.vercel.app",
    siteName: "Prova IA",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Prova IA — Simulados inteligentes para concursos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prova IA — Prepare-se com estratégia",
    description:
      "Transforme seu edital em simulados personalizados e acompanhe sua evolução por assunto.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><GlobalMotion />{children}</body>
    </html>
  );
}
