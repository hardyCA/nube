import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const URL_BASE = process.env.NEXT_PUBLIC_URL || "https://nube-tienda.vercel.app";

export const metadata = {
  metadataBase: new URL(URL_BASE),
  title: {
    default: "NUBE - Catálogo de Productos",
    template: "%s | NUBE",
  },
  description: "Explora nuestra selección de productos de calidad. Cotiza fácilmente por WhatsApp.",
  keywords: ["catálogo", "productos", "cotización", "WhatsApp", "tienda", "compras"],
  authors: [{ name: "NUBE" }],
  creator: "NUBE",
  publisher: "NUBE",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "es_BO",
    url: URL_BASE,
    siteName: "NUBE",
    title: "NUBE - Catálogo de Productos",
    description: "Explora nuestra selección de productos de calidad. Cotiza fácilmente por WhatsApp.",
    images: [
      {
        url: "/logo.png",
        width: 400,
        height: 400,
        alt: "NUBE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NUBE - Catálogo de Productos",
    description: "Explora nuestra selección de productos de calidad. Cotiza fácilmente por WhatsApp.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta property="og:image" content={`${URL_BASE}/logo.png`} />
        <meta property="og:image:width" content="400" />
        <meta property="og:image:height" content="400" />
        <meta property="og:image:alt" content="NUBE" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
