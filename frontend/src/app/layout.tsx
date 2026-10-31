import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Paytm Merchant Growth Autopilot",
  description: "AI-powered growth engine for Paytm merchants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-canvas text-paytm-navy antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
