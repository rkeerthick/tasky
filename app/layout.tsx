import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import { ServiceWorkerRegistration } from "@/app/_components/sw-registration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tasky",
  description: "Personal task tracker",
  appleWebApp: {
    capable: true,
    title: "Tasky",
    statusBarStyle: "black-translucent",
  },
};

// Viewport is exported separately in Next.js 13.4+ (not inside metadata).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 'cover' allows content to extend under notches / dynamic island;
  // use env(safe-area-inset-*) in CSS to reclaim the space.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
