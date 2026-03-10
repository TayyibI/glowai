import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { HeaderNavigation } from "@/components/HeaderNavigation";
import { Footer } from "@/components/Footer";

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
  title: "GlowAI – AI-Powered Beauty & Wellness Insights",
  description:
    "Enterprise-grade AI for personalized skin and hair analysis. Trusted by teams worldwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} min-h-screen font-sans antialiased bg-alabaster text-charcoal selection:bg-champagne/30 selection:text-charcoal`}>
        <HeaderNavigation />
        <div className="min-h-[calc(100vh-56px)]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
