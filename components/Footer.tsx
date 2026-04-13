import Link from "next/link";
import { useLang } from "@/contexts/LangContext";

export function Footer() {
  const { t, isUrdu } = useLang();

  // Enforce correct text direction internally
  return (
    <footer 
      className="w-full bg-clinical-white border-t border-unilever-blue/10 px-6 py-12"
      role="contentinfo"
      dir={isUrdu ? "rtl" : "ltr"}
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8 text-unilever-blue/70">
        
        <div className="flex flex-col items-center md:items-start space-y-2">
          <span className="text-[18px] font-bold text-unilever-blue uppercase tracking-widest">
            {t("nav.brand")}
          </span>
          <span className="text-xs font-medium">
            {t("footer.copyright")}
          </span>
        </div>

        <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-sm font-semibold">
          <Link href="/about" className="hover:text-unilever-blue transition-colors">
            {t("footer.about")}
          </Link>
          <Link href="/privacy" className="hover:text-unilever-blue transition-colors">
            {t("footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-unilever-blue transition-colors">
            {t("footer.terms")}
          </Link>
          <Link href="/contact" className="hover:text-unilever-blue transition-colors">
            {t("footer.contact")}
          </Link>
        </nav>

      </div>
    </footer>
  );
}
