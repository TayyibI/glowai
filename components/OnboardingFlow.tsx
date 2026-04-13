"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/contexts/LangContext";
import { LangToggle } from "@/components/LangToggle";

type FlowStep = 1 | 2 | 3 | 4;

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkipSetup: () => void;
}

// ── Options (bilingual) ───────────────────────────────────────────────────────
const GOAL_OPTIONS: Record<string, { en: string; ur: string }> = {
  "brighter skin":    { en: "Brighter skin", ur: "روشن جلد" },
  "less oiliness":    { en: "Less oiliness", ur: "کم چکنائی" },
  "fade dark spots":  { en: "Fade dark spots", ur: "داغ دھبے کم کریں" },
  "anti-ageing":      { en: "Anti-ageing", ur: "عمر بڑھنے سے روکیں" },
  "clear acne":       { en: "Clear acne", ur: "کیل مہاسے صاف کریں" },
  "deep hydration":   { en: "Deep hydration", ur: "گہری نمی" },
};

const SENSITIVITY_OPTIONS: Record<string, { en: string; ur: string }> = {
  fragrance:          { en: "Fragrance-free", ur: "خوشبو کے بغیر" },
  retinol:            { en: "No retinol", ur: "ریٹینول نہیں" },
  acids:              { en: "No acids (AHA/BHA)", ur: "ایسڈ نہیں" },
  "paraben-free":     { en: "Paraben-free", ur: "پیرابین کے بغیر" },
  "alcohol-free":     { en: "Alcohol-free", ur: "الکوحل کے بغیر" },
  none:               { en: "None", ur: "کوئی نہیں" },
};

const TIME_OPTIONS: Record<string, { en: string; ur: string; sub?: { en: string; ur: string } }> = {
  "Under 3 minutes":  { en: "Under 3 minutes", ur: "3 منٹ سے کم", sub: { en: "2–3 products", ur: "2–3 مصنوعات" } },
  "5–10 minutes":     { en: "5–10 minutes", ur: "5–10 منٹ", sub: { en: "4 products", ur: "4 مصنوعات" } },
  "10+ minutes":      { en: "10+ minutes", ur: "10+ منٹ", sub: { en: "Full routine", ur: "مکمل روٹین" } },
};

const HAIR_CONCERN_OPTIONS: Record<string, { en: string; ur: string }> = {
  Hairfall:           { en: "Hairfall / Thinning", ur: "بال گرنا / پتلے ہونا" },
  Frizz:              { en: "Frizz & dryness", ur: "الجھے اور خشک بال" },
  Dandruff:           { en: "Dandruff / Scalp", ur: "خشکی / کھوپڑی" },
  Damage:             { en: "Damage & breakage", ur: "نقصان اور ٹوٹنا" },
  Shine:              { en: "Dullness / Shine", ur: "بے رونقی / چمک" },
  None:               { en: "No specific concern", ur: "کوئی مخصوص مسئلہ نہیں" },
};

const TOTAL_STEPS = 4;

export function OnboardingFlow({ onComplete, onSkipSetup }: OnboardingFlowProps) {
  const { lang, t, isUrdu } = useLang();
  const [step, setStep] = useState<FlowStep>(1);

  const [goal, setGoal] = useState<string | null>(null);
  const [sensitivities, setSensitivities] = useState<string[]>([]);
  const [routineTime, setRoutineTime] = useState<string | null>(null);
  const [hairConcern, setHairConcern] = useState<string | null>(null);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => (prev + 1) as FlowStep);
    } else {
      finishSetup();
    }
  };

  const handleSkipSetup = () => {
    sessionStorage.setItem("glowai_onboarding", JSON.stringify({
      goal: null, sensitivities: [], routineTime: "5–10 minutes", hairConcern: null,
    }));
    onSkipSetup();
  };

  const finishSetup = () => {
    sessionStorage.setItem("glowai_onboarding", JSON.stringify({
      goal, sensitivities, routineTime, hairConcern,
    }));
    onComplete();
  };

  const toggleSensitivity = (key: string) => {
    if (key === "none") { setSensitivities(["none"]); return; }
    setSensitivities((prev) => {
      const filtered = prev.filter((s) => s !== "none");
      return filtered.includes(key)
        ? filtered.filter((s) => s !== key)
        : [...filtered, key];
    });
  };

  const canProceed = () => {
    if (step === 1) return !!goal;
    if (step === 2) return sensitivities.length > 0;
    if (step === 3) return !!routineTime;
    if (step === 4) return !!hairConcern;
    return false;
  };

  const optLabel = (opt: { en: string; ur: string }) => isUrdu ? opt.ur : opt.en;

  const pillClass = (active: boolean) =>
    `px-5 py-3 text-sm font-semibold transition-all duration-200 ease-in-out border ${
      active
        ? "border-[#c9a98a] bg-[#c9a98a]/20 text-[#c9a98a]"
        : "border-unilever-blue/15 text-unilever-blue/80 bg-transparent hover:border-unilever-blue/30"
    }`;

  return (
    <div
      className="absolute inset-0 bg-clinical-white flex flex-col z-20 overflow-y-auto"
      dir={isUrdu ? "rtl" : "ltr"}
      role="main"
    >
      {/* Top Bar */}
      <div className="sticky top-0 bg-clinical-white/90 backdrop-blur-md z-30 flex flex-col">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-unilever-blue/10" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
          <motion.div
            className="h-full bg-ponds-blush"
            initial={{ width: `${(1 / TOTAL_STEPS) * 100}%` }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-[11px] font-bold text-unilever-blue/50 uppercase tracking-tight">
            {isUrdu ? `مرحلہ ${step} از ${TOTAL_STEPS}` : `Step ${step} of ${TOTAL_STEPS}`}
          </span>
          <div className="flex items-center gap-3">
            <LangToggle />
            <button
              id="skip-setup-btn"
              onClick={handleSkipSetup}
              aria-label="Skip setup and go directly to scan"
              className="text-[11px] font-bold text-unilever-blue/60 hover:text-unilever-blue uppercase tracking-tight transition-colors duration-200"
            >
              {isUrdu ? "چھوڑیں" : "Skip setup"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-8 pb-36 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Skin Goal ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h1 className="font-sans text-[32px] text-unilever-blue leading-tight mb-2">
                  {isUrdu ? "آپ کا مرکزی جلد کا مقصد کیا ہے؟" : "What's your main skin goal?"}
                </h1>
                <p className="text-sm text-unilever-blue/60">
                  {isUrdu ? "ہم آپ کی روٹین اس کے ارد گرد بنائیں گے۔" : "We'll tailor your routine around this."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Skin goal options">
                {Object.entries(GOAL_OPTIONS).map(([key, labels]) => (
                  <button
                    key={key}
                    id={`goal-${key.replace(/\s/g, "-")}`}
                    onClick={() => setGoal(key)}
                    aria-pressed={goal === key}
                    className={`${pillClass(goal === key)} rounded-full`}
                  >
                    {optLabel(labels)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Sensitivities ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h1 className="font-sans text-[32px] text-unilever-blue leading-tight mb-2">
                  {isUrdu ? "کون سے اجزاء سے گریز کریں؟" : "Any ingredients to avoid?"}
                </h1>
                <p className="text-sm text-unilever-blue/60">
                  {isUrdu
                    ? "ان اجزاء والی مصنوعات کو خودکار طور پر ہٹا دیا جائے گا۔"
                    : "Products with these ingredients will be automatically removed from your routine."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Ingredient sensitivity options">
                {Object.entries(SENSITIVITY_OPTIONS).map(([key, labels]) => (
                  <button
                    key={key}
                    id={`sensitivity-${key}`}
                    onClick={() => toggleSensitivity(key)}
                    aria-pressed={sensitivities.includes(key)}
                    className={`${pillClass(sensitivities.includes(key))} rounded-full`}
                  >
                    {optLabel(labels)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setSensitivities(["none"]); setStep(3); }}
                className="text-[11px] font-bold uppercase tracking-tight text-unilever-blue/40 hover:text-unilever-blue transition-colors duration-200 underline w-fit"
              >
                {isUrdu ? "اس مرحلے کو چھوڑیں" : "Skip this step"}
              </button>
            </motion.div>
          )}

          {/* ── STEP 3: Routine Time ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h1 className="font-sans text-[32px] text-unilever-blue leading-tight mb-2">
                  {isUrdu ? "آپ کی صبح کی روٹین کتنی لمبی ہے؟" : "How long is your morning routine?"}
                </h1>
                <p className="text-sm text-unilever-blue/60">
                  {isUrdu ? "ہم اس کے مطابق مراحل کی تعداد ملائیں گے۔" : "We'll match the number of steps to this."}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full" role="group" aria-label="Routine time options">
                {Object.entries(TIME_OPTIONS).map(([key, labels]) => {
                  const isSelected = routineTime === key;
                  return (
                    <button
                      key={key}
                      id={`time-${key.replace(/\s/g, "-")}`}
                      onClick={() => setRoutineTime(key)}
                      aria-pressed={isSelected}
                      className={`w-full text-left px-5 py-4 font-semibold transition-all duration-200 ease-in-out border flex items-center justify-between ${
                        isSelected
                          ? "border-[#c9a98a] bg-[#c9a98a]/10 text-[#c9a98a]"
                          : "border-unilever-blue/15 text-unilever-blue/80 bg-transparent hover:border-unilever-blue/30"
                      }`}
                    >
                      <span className="text-base">{optLabel(labels)}</span>
                      {labels.sub && (
                        <span className="text-[11px] opacity-60">{isUrdu ? labels.sub.ur : labels.sub.en}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Hair Concern (Pakistan-specific) ── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h1 className="font-sans text-[32px] text-unilever-blue leading-tight mb-2">
                  {isUrdu ? "آپ کی بالوں کی بنیادی تشویش کیا ہے؟" : "What's your main hair concern?"}
                </h1>
                <p className="text-sm text-unilever-blue/60">
                  {isUrdu
                    ? "بالوں کی مصنوعات اس کے مطابق چُنی جائیں گی۔"
                    : "Hair products will be selected accordingly."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Hair concern options">
                {Object.entries(HAIR_CONCERN_OPTIONS).map(([key, labels]) => (
                  <button
                    key={key}
                    id={`hair-${key.toLowerCase()}`}
                    onClick={() => setHairConcern(key)}
                    aria-pressed={hairConcern === key}
                    className={`${pillClass(hairConcern === key)} rounded-full`}
                  >
                    {optLabel(labels)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom Floating Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-alabaster via-alabaster/95">
        <button
          id="onboarding-next-btn"
          onClick={handleNext}
          disabled={!canProceed()}
          aria-label={step === TOTAL_STEPS ? "Finish setup and start scan" : "Go to next step"}
          className={`w-full max-w-xl mx-auto flex items-center justify-center p-4 font-bold uppercase tracking-tight text-[13px] transition-all duration-200 ease-in-out active:scale-[0.98] ${
            canProceed()
              ? "bg-unilever-blue text-white hover:bg-unilever-blue"
              : "bg-unilever-blue/10 text-unilever-blue/40 cursor-not-allowed"
          }`}
        >
          {step === TOTAL_STEPS
            ? (isUrdu ? "اسکین شروع کریں" : "Start scan")
            : (isUrdu ? "اگلا" : "Next")}
        </button>
      </div>
    </div>
  );
}
