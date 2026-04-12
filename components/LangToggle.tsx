"use client";
import { useLang } from "@/contexts/LangContext";
import { motion } from "framer-motion";

/**
 * A premium pill toggle to switch between English and Urdu.
 * Accessible: keyboard-navigable, aria-pressed on active option.
 */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center bg-white/5 border border-white/10 overflow-hidden ${className}`}
    >
      {(["en", "ur"] as const).map((l) => (
        <button
          key={l}
          id={`lang-toggle-${l}`}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`relative px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ease-in-out ${
            lang === l
              ? "text-[#0a0a0a]"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          {lang === l && (
            <motion.span
              layoutId="lang-pill"
              className="absolute inset-0 bg-[#c9a98a]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{l === "en" ? "EN" : "اردو"}</span>
        </button>
      ))}
    </div>
  );
}
