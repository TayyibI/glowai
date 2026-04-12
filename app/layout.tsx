import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";
import { LangProvider } from "@/contexts/LangContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "GlowAI – AI-Powered Skin & Hair Analysis",
  description:
    "Personalised skin and hair analysis powered by computer vision. Get your custom morning, evening, and hair care routine in under 2 minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} min-h-screen font-sans antialiased bg-alabaster text-charcoal selection:bg-champagne/30 selection:text-charcoal`}
      >
        {/* LangProvider sets dir="rtl" and lang="ur" dynamically for Urdu */}
        <LangProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </LangProvider>
      </body>
    </html>
  );
}
