"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FlowStep = 1 | 2 | 3;

interface OnboardingFlowProps {
    onComplete: () => void;
    onSkipSetup: () => void;
}

const GOAL_OPTIONS = [
    "Brighter skin", "Less oiliness", "Fade dark spots",
    "Anti-ageing", "Clear acne", "Deep hydration"
];

const SENSITIVITY_OPTIONS = [
    "Fragrance-free", "Alcohol-free", "No retinol",
    "Paraben-free", "Vegan only", "None"
];

const TIME_OPTIONS = [
    "Under 3 minutes", "5–10 minutes", "10+ minutes"
];

export function OnboardingFlow({ onComplete, onSkipSetup }: OnboardingFlowProps) {
    const [step, setStep] = useState<FlowStep>(1);

    // States
    const [goal, setGoal] = useState<string | null>(null);
    const [sensitivities, setSensitivities] = useState<string[]>([]);
    const [routineTime, setRoutineTime] = useState<string | null>(null);

    const handleNext = () => {
        if (step < 3) {
            setStep((prev) => (prev + 1) as FlowStep);
        } else {
            finishSetup();
        }
    };

    const handleSkipStep2 = () => {
        setStep(3);
    };

    const handleSkipSetup = () => {
        sessionStorage.setItem("glowai_onboarding", JSON.stringify({
            goal: null,
            sensitivities: [],
            routineTime: "5-10"
        }));
        onSkipSetup();
    };

    const finishSetup = () => {
        sessionStorage.setItem("glowai_onboarding", JSON.stringify({
            goal,
            sensitivities,
            routineTime
        }));
        onComplete();
    };

    const toggleSensitivity = (item: string) => {
        if (item === "None") {
            setSensitivities(["None"]);
            return;
        }
        setSensitivities((prev) => {
            // Removing 'None' if it was selected
            const filtered = prev.filter(s => s !== "None");
            if (filtered.includes(item)) {
                return filtered.filter(s => s !== item);
            }
            return [...filtered, item];
        });
    };

    // Check if current step allows progression
    const canProceed = () => {
        if (step === 1) return !!goal;
        if (step === 2) return sensitivities.length > 0;
        if (step === 3) return !!routineTime;
        return false;
    };

    return (
        <div className="absolute inset-0 bg-alabaster flex flex-col z-20 overflow-y-auto">
            {/* Top Bar */}
            <div className="sticky top-0 bg-alabaster/90 backdrop-blur-md z-30 flex flex-col">
                {/* Progress Bar */}
                <div className="w-full h-1 bg-charcoal/10">
                    <motion.div
                        className="h-full bg-champagne"
                        initial={{ width: "33.3%" }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                        transition={{ ease: "easeInOut", duration: 0.3 }}
                    />
                </div>

                <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-[11px] font-bold text-charcoal/50 uppercase tracking-widest">
                        Step {step} of 3
                    </span>
                    <div className="flex items-center gap-4">
                        {step === 2 && (
                            <button
                                onClick={handleSkipStep2}
                                className="text-[11px] font-bold text-charcoal/60 hover:text-charcoal uppercase tracking-widest transition-colors"
                            >
                                Skip step
                            </button>
                        )}
                        <button
                            onClick={handleSkipSetup}
                            className="text-[11px] font-bold text-charcoal/60 hover:text-charcoal uppercase tracking-widest transition-colors"
                        >
                            Skip setup
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col px-6 pt-8 pb-32 max-w-xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-8"
                        >
                            <div>
                                <h1 className="font-serif text-[32px] md:text-4xl text-charcoal leading-tight mb-2">
                                    What&apos;s your main skin goal?
                                </h1>
                                <p className="text-sm text-charcoal/60">
                                    We&apos;ll tailor your routine around this.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {GOAL_OPTIONS.map(opt => {
                                    const isSelected = goal === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => setGoal(opt)}
                                            className={`px-5 py-3 rounded-full text-sm font-semibold transition-all border ${isSelected
                                                    ? "border-[#c9a98a] bg-[#c9a98a]/20 text-[#c9a98a]"
                                                    : "border-charcoal/15 text-charcoal/80 bg-transparent hover:border-charcoal/30"
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-8"
                        >
                            <div>
                                <h1 className="font-serif text-[32px] md:text-4xl text-charcoal leading-tight mb-2">
                                    Any ingredients to avoid?
                                </h1>
                                <p className="text-sm text-charcoal/60">
                                    Skip if you&apos;re not sure.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {SENSITIVITY_OPTIONS.map(opt => {
                                    const isSelected = sensitivities.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => toggleSensitivity(opt)}
                                            className={`px-5 py-3 rounded-full text-sm font-semibold transition-all border ${isSelected
                                                    ? "border-[#c9a98a] bg-[#c9a98a]/20 text-[#c9a98a]"
                                                    : "border-charcoal/15 text-charcoal/80 bg-transparent hover:border-charcoal/30"
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-8"
                        >
                            <div>
                                <h1 className="font-serif text-[32px] md:text-4xl text-charcoal leading-tight mb-2">
                                    How long is your morning routine?
                                </h1>
                                <p className="text-sm text-charcoal/60">
                                    We&apos;ll match the number of product steps to this.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 w-full">
                                {TIME_OPTIONS.map(opt => {
                                    const isSelected = routineTime === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => setRoutineTime(opt)}
                                            className={`w-full text-left px-5 py-4 rounded-xl text-base font-semibold transition-all border ${isSelected
                                                    ? "border-[#c9a98a] bg-[#c9a98a]/20 text-[#c9a98a]"
                                                    : "border-charcoal/15 text-charcoal/80 bg-transparent hover:border-charcoal/30"
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Floating Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-alabaster via-alabaster space-y-4">
                <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`w-full max-w-xl mx-auto flex items-center justify-center p-4 rounded-xl font-bold uppercase tracking-widest text-[13px] transition-all transform active:scale-[0.98] ${canProceed()
                            ? "bg-bordeaux text-white hover:bg-charcoal"
                            : "bg-charcoal/10 text-charcoal/40 cursor-not-allowed"
                        }`}
                >
                    {step === 3 ? "Start scan" : "Next"}
                </button>
            </div>
        </div>
    );
}
