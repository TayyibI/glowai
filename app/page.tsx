"use client";

import { useRouter } from "next/navigation";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { LangToggle } from "@/components/LangToggle";
import { useLang } from "@/contexts/LangContext";

export default function MobileLandingPage() {
  const router = useRouter();
  const { t, isUrdu } = useLang();

  const handleScan = () => router.push("/scanner");
  const handleScrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main
      className="min-h-screen bg-[#0a0a0a] text-[#f5f2ee] flex flex-col font-sans"
      dir={isUrdu ? "rtl" : "ltr"}
    >
      {/* 1. Nav */}
      <nav
        className="flex items-center justify-between px-6 py-4 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50 border-b border-white/5"
        role="navigation"
        aria-label="Main navigation"
      >
        <span className="text-[16px] tracking-[0.2em] font-medium uppercase" aria-label="GlowAI home">
          {t("nav.brand")}
        </span>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button
            id="nav-scan-btn"
            onClick={handleScan}
            aria-label="Start a free skin and hair scan"
            className="bg-[#c9a98a] text-[#0a0a0a] px-4 py-2 text-sm font-semibold rounded-none active:scale-[0.97] transition-all duration-200 ease-in-out hover:bg-[#d4b899] hover:scale-[1.02]"
          >
            {t("nav.start_scan")}
          </button>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="px-6 pt-12 pb-10 flex flex-col mt-2">
        <h1 className="text-[40px] leading-[1.1] font-medium tracking-tight mb-4 text-[#f5f2ee] whitespace-pre-line">
          {t("hero.title")}
        </h1>
        <p className="text-[15px] text-[#888888] mb-8 max-w-[300px]">
          {t("hero.subtitle")}
        </p>

        {/* Privacy Badge — prominently above CTA */}
        <div className="mb-6">
          <PrivacyBadge variant="dark" />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            id="hero-scan-btn"
            onClick={handleScan}
            aria-label="Start a free skin and hair analysis scan"
            className="w-full h-[52px] bg-[#c9a98a] text-[#0a0a0a] font-semibold text-lg rounded-none active:scale-[0.97] transition-all duration-200 ease-in-out hover:bg-[#d4b899] flex items-center justify-center"
          >
            {t("hero.cta")}
          </button>
          <button
            id="how-it-works-btn"
            onClick={handleScrollToHowItWorks}
            aria-label="Scroll to how it works section"
            className="w-full h-[52px] bg-transparent border border-[#c9a98a] text-[#c9a98a] font-semibold text-lg rounded-none active:scale-[0.97] transition-all duration-200 ease-in-out hover:bg-[#c9a98a]/10 flex items-center justify-center"
          >
            {t("hero.how")}
          </button>
        </div>

        <p className="text-center text-[12px] text-[#888888] mt-6">
          {t("hero.disclaimer")}
        </p>
      </section>

      {/* 3. Stats strip */}
      <section
        className="border-y border-white/10 py-6 my-2 w-full px-6"
        aria-label="Key statistics"
      >
        <div className="flex justify-between items-start divide-x divide-white/10">
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-[#f5f2ee] mb-1 leading-none" aria-hidden="true">
              {t("stats.analysis")}
            </span>
            <span className="text-[11px] text-[#888888] leading-snug">{t("stats.analysis_label")}</span>
          </div>
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-[#f5f2ee] mb-1 leading-none" aria-hidden="true">
              {t("stats.time")}
            </span>
            <span className="text-[11px] text-[#888888] leading-snug">{t("stats.time_label")}</span>
          </div>
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-[#f5f2ee] mb-1 leading-none" aria-hidden="true">
              {t("stats.products")}
            </span>
            <span className="text-[11px] text-[#888888] leading-snug">{t("stats.products_label")}</span>
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section id="how-it-works" className="px-6 py-10 flex flex-col gap-8" aria-label="How GlowAI works">
        {[
          { step: "01", titleKey: "how.step1_title", descKey: "how.step1_desc" },
          { step: "02", titleKey: "how.step2_title", descKey: "how.step2_desc" },
          { step: "03", titleKey: "how.step3_title", descKey: "how.step3_desc" },
        ].map((item) => (
          <div key={item.step} className="flex gap-5 items-start">
            <span
              className="text-[32px] font-medium text-[#c9a98a] leading-none shrink-0"
              style={{ fontFamily: "serif" }}
              aria-hidden="true"
            >
              {item.step}
            </span>
            <div className="mt-1">
              <h3 className="font-semibold text-[17px] text-[#f5f2ee] mb-1">{t(item.titleKey)}</h3>
              <p className="text-[#888888] text-[15px] leading-relaxed">{t(item.descKey)}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 5. Feature section */}
      <section className="px-6 py-6 w-full">
        <div className="bg-[#141414] p-6 border border-white/5">
          <h2 className="text-[20px] font-semibold mb-3 text-[#f5f2ee]">
            {t("feature.title")}
          </h2>
          <p className="text-[#888888] text-[15px] leading-relaxed mb-5">
            {t("feature.body")}
          </p>
          <PrivacyBadge variant="dark" />
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="px-6 pt-6 pb-2 w-full">
        <button
          id="footer-scan-btn"
          onClick={handleScan}
          aria-label="Start your free scan now"
          className="w-full h-[52px] bg-[#c9a98a] text-[#0a0a0a] font-semibold text-lg rounded-none active:scale-[0.97] transition-all duration-200 ease-in-out hover:bg-[#d4b899] flex items-center justify-center"
        >
          {t("cta.scan_now")}
        </button>
      </section>

      {/* 7. Footer */}
      <footer className="px-6 py-10 text-center text-[#888888] text-[12px]" role="contentinfo">
        &copy; 2026 GlowAI &middot;{" "}
        <a
          href="/privacy"
          className="underline hover:text-white/60 transition-colors duration-200"
          aria-label="Read full privacy policy"
        >
          Privacy Policy
        </a>
      </footer>
    </main>
  );
}
