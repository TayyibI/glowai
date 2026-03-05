import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HeaderNavigation } from "@/components/HeaderNavigation";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
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
      <body className={`${inter.className} min-h-screen font-sans antialiased bg-ivory text-brown`}>
        <HeaderNavigation />
        <div className="min-h-[calc(100vh-56px)]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
