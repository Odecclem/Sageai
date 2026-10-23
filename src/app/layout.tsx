import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Sage AI — Real-Time Live AI Face Swapping Platform",
    template: "%s | Sage AI Live",
  },
  description:
    "Production-grade neural face reenactment and live video transformation for content creators, streamers, and VTubers. Sub-second WebRTC streaming directly into OBS Studio, Discord, and WhatsApp.",
  keywords: [
    "AI Face Swap",
    "Live Face Swapping",
    "Real-Time Deepfake",
    "OBS Studio AI Plugin",
    "VTuber AI",
    "WebRTC AI Stream",
    "Creator Studio",
    "AI Webcam Filter",
  ],
  authors: [{ name: "Sage AI Technologies" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Sage AI — Real-Time Live AI Face Swapping Platform",
    description:
      "Transform your webcam with photorealistic real-time AI personas. Stream live into OBS, Twitch, YouTube, Discord, and WhatsApp at 1 credit/sec.",
    url: "http://localhost:3000",
    siteName: "Sage AI Live",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sage AI — Real-Time Live AI Face Swapping Platform",
    description:
      "Production-grade neural face reenactment and live video transformation. Direct OBS Browser Source feeds.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-blue-600/10 selection:text-blue-900 font-[family-name:var(--font-sans)]">
        {children}
      </body>
    </html>
  );
}
