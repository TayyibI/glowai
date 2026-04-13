"use client";
import { useLang } from "@/contexts/LangContext";

/**
 * A clear pill toggle to switch between English and Urdu.
 * Accessible: keyboard-navigable, aria-pressed on active option.
 */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center divide-x divide-unilever-blue/30 overflow-hidden rounded-full border border-unilever-blue bg-transparent ${className}`}
    >
      {(["en", "ur"] as const).map((l) => (
        <button
          key={l}
          id={`lang-toggle-${l}`}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`bg-transparent px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight transition-colors duration-200 ease-in-out ${
            lang === l
              ? "text-unilever-blue"
              : "text-unilever-blue/50 hover:text-unilever-blue/80"
          }`}
        >
          {l === "en" ? "EN" : "اردو"}
        </button>
      ))}
    </div>
  );
}
