"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, Lock, ChevronDown } from "lucide-react";

const STORAGE_KEY = "glow-ai-privacy-v2";
const CONSENT_EXPIRY_DAYS = 365;

export function getPrivacyAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { accepted, timestamp } = JSON.parse(raw) as { accepted: boolean; timestamp: number };
    const expiryMs = CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return accepted === true && Date.now() - timestamp < expiryMs;
  } catch { return false; }
}

export function setPrivacyAccepted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

interface PrivacyModalProps {
  onAccept: () => void;
  onDecline: () => void;
  accepted: boolean;
  lang?: "en" | "ur";
}

// ── Translations ────────────────────────────────────────────────────────────
const t = {
  en: {
    title: "Privacy & Consent",
    tagline: "Your data never leaves this session",
    ageGate: "Are you 16 years of age or older?",
    ageYes: "Yes, I am 16 or older",
    ageNo: "No, I am under 16",
    underAge: "We're sorry — GlowAI is only available to users aged 16 and above.",
    purpose: "What we collect and why:",
    bullet1: "Camera images or photo uploads — used solely to analyse your skin and hair.",
    bullet2: "Preferences you enter during setup — stored locally on your device only.",
    partner: "Analysis is processed by our technology partner, Perfect Corp (Taiwan). Images are transmitted encrypted over HTTPS and are deleted from their servers immediately after analysis. They are never stored, sold, or used for any other purpose.",
    badge: "Encrypted in Transit · Not Stored · Never Sold",
    decline: "Decline & exit",
    accept: "I understand & agree",
    readMore: "Read full Privacy Policy",
    consent: "By continuing you consent to the above data use in accordance with Pakistan's Personal Data Protection Bill (PDPB) 2023.",
  },
  ur: {
    title: "رازداری اور رضامندی",
    tagline: "آپ کا ڈیٹا اس سیشن سے باہر نہیں جاتا",
    ageGate: "کیا آپ کی عمر 16 سال یا اس سے زیادہ ہے؟",
    ageYes: "ہاں، میری عمر 16 سال یا اس سے زیادہ ہے",
    ageNo: "نہیں، میری عمر 16 سال سے کم ہے",
    underAge: "معذرت — GlowAI صرف 16 سال یا اس سے زیادہ کے صارفین کے لیے دستیاب ہے۔",
    purpose: "ہم کیا اور کیوں اکٹھا کرتے ہیں:",
    bullet1: "کیمرہ یا فوٹو — صرف جلد اور بالوں کے تجزیے کے لیے۔",
    bullet2: "آپ کی ترجیحات — صرف آپ کے آلے پر محفوظ ہوتی ہیں۔",
    partner: "تجزیہ ہمارے ٹیکنالوجی پارٹنر، پرفیکٹ کارپ (تائیوان) کے ذریعے ہوتا ہے۔ تصاویر HTTPS کے ذریعے خفیہ شدہ طریقے سے منتقل ہوتی ہیں اور تجزیے کے فوراً بعد حذف کر دی جاتی ہیں۔",
    badge: "محفوظ ترسیل · محفوظ نہیں · کبھی فروخت نہیں",
    decline: "انکار کریں اور باہر نکلیں",
    accept: "میں سمجھتا/سمجھتی ہوں اور متفق ہوں",
    readMore: "مکمل پرائیویسی پالیسی پڑھیں",
    consent: "جاری رکھ کر آپ پاکستان کے پرسنل ڈیٹا پروٹیکشن بل (PDPB) 2023 کے مطابق ڈیٹا کے استعمال پر رضامندی دیتے ہیں۔",
  },
};

export function PrivacyModal({ onAccept, onDecline, accepted, lang = "en" }: PrivacyModalProps) {
  const [ageConfirmed, setAgeConfirmed] = useState<boolean | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const tr = t[lang];

  const handleAccept = useCallback(() => {
    setPrivacyAccepted();
    onAccept();
  }, [onAccept]);

  if (accepted) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-charcoal/95 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm bg-[#FAF8F5] border border-charcoal/20 overflow-hidden"
          dir={lang === "ur" ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="bg-charcoal px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C2A878] shrink-0" aria-hidden="true" />
              <div>
                <h2 id="privacy-title" className="text-white font-serif text-lg uppercase tracking-widest leading-tight">
                  {tr.title}
                </h2>
                <p className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">{tr.tagline}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Age Gate */}
            <AnimatePresence mode="wait">
              {ageConfirmed === null && (
                <motion.div key="age-gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-charcoal/60 mb-3">{tr.ageGate}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      id="age-yes-btn"
                      onClick={() => setAgeConfirmed(true)}
                      className="w-full py-3 border border-charcoal/20 text-[11px] font-bold uppercase tracking-widest text-charcoal hover:bg-charcoal hover:text-white transition-all duration-200 ease-in-out"
                    >
                      {tr.ageYes}
                    </button>
                    <button
                      id="age-no-btn"
                      onClick={() => setAgeConfirmed(false)}
                      className="w-full py-3 border border-charcoal/10 text-[11px] font-bold uppercase tracking-widest text-charcoal/50 hover:text-charcoal transition-all duration-200 ease-in-out"
                    >
                      {tr.ageNo}
                    </button>
                  </div>
                </motion.div>
              )}

              {ageConfirmed === false && (
                <motion.div key="under-age" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-4"
                >
                  <p className="text-sm text-charcoal/70 leading-relaxed">{tr.underAge}</p>
                  <button
                    onClick={onDecline}
                    className="mt-4 text-[10px] font-bold uppercase tracking-widest text-charcoal/50 hover:text-charcoal underline transition-all duration-200"
                  >
                    {tr.decline}
                  </button>
                </motion.div>
              )}

              {ageConfirmed === true && (
                <motion.div key="consent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                  {/* Purpose */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 mb-2">{tr.purpose}</p>
                    <ul className="space-y-1.5">
                      {[tr.bullet1, tr.bullet2].map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-charcoal/70 leading-relaxed">
                          <Lock className="w-3 h-3 mt-0.5 shrink-0 text-[#2D6A4F]" aria-hidden="true" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Partner details — expandable */}
                  <div className="border border-charcoal/10 overflow-hidden">
                    <button
                      id="partner-details-btn"
                      onClick={() => setShowDetails((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-all duration-200"
                      aria-expanded={showDetails}
                    >
                      <span>Partner & data processing</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                    <AnimatePresence>
                      {showDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="text-[10.5px] text-charcoal/60 leading-relaxed px-3 pb-3">
                            {tr.partner}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Trust badge */}
                  <div className="flex items-center gap-2 bg-[rgba(45,106,79,0.07)] border border-[rgba(45,106,79,0.2)] px-3 py-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" aria-hidden="true" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D6A4F]">{tr.badge}</span>
                  </div>

                  {/* Legal footnote */}
                  <p className="text-[9.5px] text-charcoal/40 leading-relaxed">{tr.consent}</p>

                  {/* Privacy policy link */}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal underline transition-all duration-200 -mt-2"
                  >
                    {tr.readMore}
                  </a>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      id="privacy-accept-btn"
                      onClick={handleAccept}
                      className="w-full py-3.5 bg-charcoal text-white text-[11px] font-bold uppercase tracking-widest hover:bg-bordeaux transition-all duration-200 ease-in-out"
                    >
                      {tr.accept}
                    </button>
                    <button
                      id="privacy-decline-btn"
                      onClick={onDecline}
                      className="w-full py-2.5 border border-charcoal/15 text-[10px] font-bold uppercase tracking-widest text-charcoal/50 hover:text-charcoal transition-all duration-200 ease-in-out"
                    >
                      {tr.decline}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
