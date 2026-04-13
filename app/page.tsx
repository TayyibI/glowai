"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { LangToggle } from "@/components/LangToggle";
import { useLang } from "@/contexts/LangContext";
import { Footer } from "@/components/Footer";

/** Served from `public/videos/hero-scan.mp4` (optional second file: `hero-scan.webm`). */
const HERO_VIDEO_MP4 = "/videos/hero-scan.mp4";
const HERO_VIDEO_WEBM = "/videos/hero-scan.webm";
const HERO_VIDEO_POSTER = "/images/scanner-model.jpg";

export default function MobileLandingPage() {
  const router = useRouter();
  const { t, isUrdu } = useLang();
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const handleHeroVideoError = useCallback(() => {
    setHeroVideoFailed(true);
  }, []);

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

      {/* 2. Hero — scan loop video (see `public/videos/`) + clinical stat overlays */}
      <section className="relative mt-2" aria-labelledby="hero-heading">
        <div className="relative min-h-[min(78vh,580px)] w-full overflow-hidden bg-unilever-blue">
          {!reduceMotion && !heroVideoFailed ? (
            <video
              className="absolute inset-0 z-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={HERO_VIDEO_POSTER}
              preload="metadata"
              aria-hidden="true"
              onError={handleHeroVideoError}
            >
              <source src={HERO_VIDEO_WEBM} type="video/webm" />
              <source src={HERO_VIDEO_MP4} type="video/mp4" />
            </video>
          ) : (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO_VIDEO_POSTER})` }}
              aria-hidden="true"
            />
          )}

          <div
            className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-unilever-blue/50 to-unilever-blue/80"
            aria-hidden="true"
          />

          <div className="relative z-10 flex min-h-[min(78vh,580px)] flex-col px-6 pb-10 pt-14">
            {/* Side-by-side on sm+: copy gets flex-1 min-w-0; stats sit in a fixed column so they never overlap text */}
            <div className="flex w-full min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 lg:gap-10">
              <div className="min-w-0 max-w-xl flex-1">
                <h1
                  id="hero-heading"
                  className="mb-4 whitespace-pre-line text-[40px] font-bold leading-[1.1] tracking-tight text-white"
                >
                  {t("hero.title")}
                </h1>
                <p className="text-[15px] text-white/80 sm:max-w-[20rem] md:max-w-[22rem]">
                  {t("hero.subtitle")}
                </p>
              </div>

              <div
                className="flex w-full shrink-0 flex-col gap-2 sm:w-[min(100%,11.5rem)] sm:pt-1"
                aria-hidden="true"
              >
                <div
                  className="motion-reduce:animate-none w-fit max-w-full rounded-full border border-white/20 bg-black/30 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95 shadow-floating backdrop-blur-glass animate-heroStatFloat motion-reduce:transform-none sm:ms-auto"
                  style={{ animationDelay: "0s" }}
                >
                  {t("hero.stat_hydration")}
                </div>
                <div
                  className="motion-reduce:animate-none w-fit max-w-full rounded-full border border-white/20 bg-black/30 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95 shadow-floating backdrop-blur-glass animate-heroStatFloat motion-reduce:transform-none sm:ms-auto"
                  style={{ animationDelay: "1.1s" }}
                >
                  {t("hero.stat_texture")}
                </div>
                <div
                  className="motion-reduce:animate-none w-fit max-w-full rounded-full border border-white/20 bg-black/30 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95 shadow-floating backdrop-blur-glass animate-heroStatFloat motion-reduce:transform-none sm:ms-auto"
                  style={{ animationDelay: "2.2s" }}
                >
                  {t("hero.stat_barrier")}
                </div>
              </div>
            </div>

            <div className="mb-6 mt-6 sm:mt-8">
              <PrivacyBadge variant="dark" />
            </div>

            <div className="mt-auto flex w-full flex-col gap-3">
              <button
                id="hero-scan-btn"
                onClick={handleScan}
                aria-label="Start a free skin and hair analysis scan"
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-clinical-white text-lg font-semibold text-unilever-blue shadow-floating transition-all duration-200 ease-in-out hover:bg-white active:scale-[0.97]"
              >
                {t("hero.cta")}
              </button>
              <button
                id="how-it-works-btn"
                onClick={handleScrollToHowItWorks}
                aria-label="Scroll to how it works section"
                className="flex h-[52px] w-full items-center justify-center rounded-full border-2 border-white/35 bg-transparent text-lg font-semibold text-white transition-all duration-200 ease-in-out hover:bg-white/10 active:scale-[0.97]"
              >
                {t("hero.how")}
              </button>
            </div>

            <p className="mt-6 text-center text-[12px] text-white/65">
              {t("hero.disclaimer")}
            </p>
          </div>
        </div>
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
