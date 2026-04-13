"use client";

import { useRouter } from "next/navigation";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { LangToggle } from "@/components/LangToggle";
import { useLang } from "@/contexts/LangContext";
import { Footer } from "@/components/Footer";

export default function MobileLandingPage() {
  const router = useRouter();
  const { t, isUrdu } = useLang();

  const handleScan = () => router.push("/scanner");
  const handleScrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main
      className="min-h-screen bg-clinical-white text-unilever-blue flex flex-col font-sans"
      dir={isUrdu ? "rtl" : "ltr"}
    >
      {/* 1. Nav */}
      <nav
        className="flex items-center justify-between px-6 py-4 sticky top-0 bg-clinical-white/90 backdrop-blur-md z-50 border-b border-unilever-blue/5"
        role="navigation"
        aria-label="Main navigation"
      >
        <span className="text-[16px] tracking-tight font-bold uppercase" aria-label="GlowAI home">
          {t("nav.brand")}
        </span>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button
            id="nav-scan-btn"
            onClick={handleScan}
            aria-label="Start a free skin and hair scan"
            className="bg-unilever-blue text-white px-5 py-2 text-sm font-semibold rounded-full active:scale-[0.97] transition-all duration-200 ease-in-out hover:bg-[#001A45] hover:shadow-lg shadow-md"
          >
            {t("nav.start_scan")}
          </button>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="px-6 pt-12 pb-10 flex flex-col mt-2">
        <h1 className="text-[40px] leading-[1.1] font-bold tracking-tight mb-4 text-unilever-blue whitespace-pre-line">
          {t("hero.title")}
        </h1>
        <p className="text-[15px] text-unilever-blue/70 mb-8 max-w-[300px]">
          {t("hero.subtitle")}
        </p>

        {/* Privacy Badge */}
        <div className="mb-6">
          <PrivacyBadge variant="default" />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            id="hero-scan-btn"
            onClick={handleScan}
            aria-label="Start a free skin and hair analysis scan"
            className="w-full h-[52px] bg-unilever-blue text-white font-semibold text-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:scale-[0.97] transition-all duration-200 ease-in-out hover:bg-[#001A45] flex items-center justify-center"
          >
            {t("hero.cta")}
          </button>
          <button
            id="how-it-works-btn"
            onClick={handleScrollToHowItWorks}
            aria-label="Scroll to how it works section"
            className="w-full h-[52px] bg-transparent border-2 border-unilever-blue/20 text-unilever-blue font-semibold text-lg rounded-full active:scale-[0.97] transition-all duration-200 ease-in-out hover:bg-ponds-blush/20 flex items-center justify-center"
          >
            {t("hero.how")}
          </button>
        </div>

        <p className="text-center text-[12px] text-unilever-blue/60 mt-6">
          {t("hero.disclaimer")}
        </p>
      </section>

      {/* 3. Stats strip */}
      <section
        className="border-y border-unilever-blue/10 py-6 w-full px-6 bg-gray-50/50"
        aria-label="Key statistics"
      >
        <div className="flex justify-between items-start divide-x divide-unilever-blue/10">
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-unilever-blue mb-1 leading-none" aria-hidden="true">
              {t("stats.analysis")}
            </span>
            <span className="text-[11px] text-unilever-blue/70 leading-snug font-medium">{t("stats.analysis_label")}</span>
          </div>
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-unilever-blue mb-1 leading-none" aria-hidden="true">
              {t("stats.time")}
            </span>
            <span className="text-[11px] text-unilever-blue/70 leading-snug font-medium">{t("stats.time_label")}</span>
          </div>
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-unilever-blue mb-1 leading-none" aria-hidden="true">
              {t("stats.products")}
            </span>
            <span className="text-[11px] text-unilever-blue/70 leading-snug font-medium">{t("stats.products_label")}</span>
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section id="how-it-works" className="px-6 py-12 flex flex-col gap-8" aria-label="How GlowAI works">
        {[
          { step: "01", titleKey: "how.step1_title", descKey: "how.step1_desc" },
          { step: "02", titleKey: "how.step2_title", descKey: "how.step2_desc" },
          { step: "03", titleKey: "how.step3_title", descKey: "how.step3_desc" },
        ].map((item) => (
          <div key={item.step} className="flex gap-5 items-start">
            <span
              className="text-[32px] font-bold text-scanner-cyan leading-none shrink-0"
              aria-hidden="true"
            >
              {item.step}
            </span>
            <div className="mt-1">
              <h3 className="font-bold text-[17px] text-unilever-blue mb-1">{t(item.titleKey)}</h3>
              <p className="text-unilever-blue/70 text-[15px] leading-relaxed">{t(item.descKey)}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 5. Feature section */}
      <section className="px-6 py-6 w-full">
        <div className="bg-ponds-blush/20 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-unilever-blue/5">
          <h2 className="text-[20px] font-bold mb-3 text-unilever-blue tracking-tight">
            {t("feature.title")}
          </h2>
          <p className="text-unilever-blue/80 text-[15px] leading-relaxed mb-6 font-medium">
            {t("feature.body")}
          </p>
          <PrivacyBadge variant="default" />
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="px-6 pt-8 pb-4 w-full">
        <button
          id="footer-scan-btn"
          onClick={handleScan}
          aria-label="Start your free scan now"
          className="w-full h-[52px] bg-unilever-blue text-white font-semibold text-lg rounded-full active:scale-[0.97] transition-all duration-200 ease-in-out shadow-md hover:shadow-lg hover:bg-[#001A45] flex items-center justify-center"
        >
          {t("cta.scan_now")}
        </button>
      </section>

      {/* 7. Footer */}
      <Footer />
    </main>
  );
}
