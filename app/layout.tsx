import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";
import { LangProvider } from "@/contexts/LangContext";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
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
        className={`${poppins.variable} min-h-screen font-sans antialiased bg-clinical-white text-unilever-blue selection:bg-ponds-blush/30 selection:text-unilever-blue`}
      >
        {/* LangProvider sets dir="rtl" and lang="ur" dynamically for Urdu */}
        <LangProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </LangProvider>
      </body>
    </html>
  );
}
