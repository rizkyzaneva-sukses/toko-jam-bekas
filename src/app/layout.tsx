import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Jam Bekas Ops",
  description: "Sistem operasional & keuangan toko jam bekas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
