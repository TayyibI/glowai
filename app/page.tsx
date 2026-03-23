"use client";

import { useRouter } from "next/navigation";

export default function MobileLandingPage() {
  const router = useRouter();

  const handleScan = () => router.push("/scanner");
  const handleScrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f5f2ee] flex flex-col font-sans mb-0">
      {/* 1. Nav */}
      <nav className="flex items-center justify-between px-6 py-4 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50 border-white/5">
        <span className="text-[16px] tracking-[0.2em] font-medium uppercase">
          GLOWAI
        </span>
        <button
          onClick={handleScan}
          className="bg-[#c9a98a] text-[#0a0a0a] px-4 py-2 text-sm font-semibold rounded-lg active:scale-[0.97] transition-transform duration-200 ease-out"
        >
          Start scan
        </button>
      </nav>

      {/* 2. Hero */}
      <section className="px-6 pt-12 pb-10 flex flex-col mt-2">
        <h1 className="text-[40px] leading-[1.1] font-medium tracking-tight mb-4 text-[#f5f2ee]">
          Your skin,<br />decoded.
        </h1>
        <p className="text-[15px] text-[#888888] mb-10 max-w-[280px]">
          AI-powered skin analysis. Personalised to your face.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleScan}
            className="w-full h-[52px] bg-[#c9a98a] text-[#0a0a0a] font-semibold text-lg rounded-xl active:scale-[0.97] transition-transform duration-200 ease-out flex items-center justify-center"
          >
            Start free scan
          </button>
          <button
            onClick={handleScrollToHowItWorks}
            className="w-full h-[52px] bg-transparent border border-[#c9a98a] text-[#c9a98a] font-semibold text-lg rounded-xl active:scale-[0.97] transition-transform duration-200 ease-out flex items-center justify-center"
          >
            See how it works
          </button>
        </div>

        <p className="text-center text-[12px] text-[#888888] mt-6">
          10-second scan &middot; Free &middot; No app download
        </p>
      </section>

      {/* 3. Stats strip */}
      <section className="border-y border-white/10 py-6 my-2 w-full px-6">
        <div className="flex justify-between items-start divide-x divide-white/10">
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-[#f5f2ee] mb-1 leading-none">72%</span>
            <span className="text-[11px] text-[#888888] leading-snug">Users see improvement in 4 weeks</span>
          </div>
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-[#f5f2ee] mb-1 leading-none">3 sec</span>
            <span className="text-[11px] text-[#888888] leading-snug">Average scan time</span>
          </div>
          <div className="flex-1 flex flex-col items-center text-center px-2">
            <span className="text-[24px] font-bold text-[#f5f2ee] mb-1 leading-none">50+</span>
            <span className="text-[11px] text-[#888888] leading-snug">Products in our database</span>
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section id="how-it-works" className="px-6 py-10 flex flex-col gap-8">
        {[
          {
            step: "01",
            label: "Scan",
            desc: "Take or upload a photo."
          },
          {
            step: "02",
            label: "Analyse",
            desc: "AI reads your skin type, hydration, and concerns."
          },
          {
            step: "03",
            label: "Routine",
            desc: "Get a personalised morning and evening routine."
          }
        ].map((item) => (
          <div key={item.step} className="flex gap-5 items-start">
            <span className="text-[32px] font-medium text-[#c9a98a] leading-none shrink-0" style={{ fontFamily: "serif" }}>
              {item.step}
            </span>
            <div className="mt-1">
              <h3 className="font-semibold text-[17px] text-[#f5f2ee] mb-1">{item.label}</h3>
              <p className="text-[#888888] text-[15px] leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 5. Feature section */}
      <section className="px-6 py-6 w-full">
        <div className="bg-[#141414] rounded-2xl p-6 border border-white/5">
          <h2 className="text-[20px] font-semibold mb-3 text-[#f5f2ee]">
            Not a quiz. A real scan.
          </h2>
          <p className="text-[#888888] text-[15px] leading-relaxed">
            Most beauty apps guess based on your answers. GlowAI reads
            your actual skin from a photo — hydration levels, detected concerns,
            skin type — and builds your routine from that data.
          </p>
        </div>
      </section>

      {/* 6. Final CTA full width */}
      <section className="px-6 pt-6 pb-2 w-full">
        <button
          onClick={handleScan}
          className="w-full h-[52px] bg-[#c9a98a] text-[#0a0a0a] font-semibold text-lg rounded-xl active:scale-[0.97] transition-transform duration-200 ease-out flex items-center justify-center"
        >
          Scan your skin now
        </button>
      </section>

      {/* 7. Footer */}
      <footer className="px-6 py-10 text-center text-[#888888] text-[12px]">
        &copy; 2026 GlowAI
      </footer>
    </main>
  );
}
