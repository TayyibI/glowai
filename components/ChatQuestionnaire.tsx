"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/contexts/LangContext";

interface ChatQuestionnaireProps {
  onComplete: () => void;
  onSkipSetup: () => void;
}

type Message = {
  id: string;
  role: "agent" | "user";
  text: string;
};

// ── Questions & Options (Bilingual) ──
const QUESTIONS = [
  {
    id: "goal",
    agentText: { en: "What's your main skin goal?", ur: "آپ کا مرکزی جلد کا مقصد کیا ہے؟" },
    options: [
      { key: "brighter skin", label: { en: "Brighter skin", ur: "روشن جلد" } },
      { key: "less oiliness", label: { en: "Less oiliness", ur: "کم چکنائی" } },
      { key: "fade dark spots", label: { en: "Fade dark spots", ur: "داغ دھبے کم کریں" } },
      { key: "anti-ageing", label: { en: "Anti-ageing", ur: "عمر بڑھنے سے روکیں" } },
      { key: "clear acne", label: { en: "Clear acne", ur: "کیل مہاسے صاف کریں" } },
      { key: "deep hydration", label: { en: "Deep hydration", ur: "گہری نمی" } },
    ]
  },
  {
    id: "sensitivities",
    agentText: { en: "Any ingredients to avoid?", ur: "کون سے اجزاء سے گریز کریں؟" },
    options: [
      { key: "fragrance", label: { en: "Fragrance-free", ur: "خوشبو کے بغیر" } },
      { key: "retinol", label: { en: "No retinol", ur: "ریٹینول نہیں" } },
      { key: "acids", label: { en: "No acids (AHA/BHA)", ur: "ایسڈ نہیں" } },
      { key: "paraben-free", label: { en: "Paraben-free", ur: "پیرابین کے بغیر" } },
      { key: "alcohol-free", label: { en: "Alcohol-free", ur: "الکوحل کے بغیر" } },
      { key: "none", label: { en: "None", ur: "کوئی نہیں" } },
    ]
  },
  {
    id: "routineTime",
    agentText: { en: "How long is your morning routine?", ur: "آپ کی صبح کی روٹین کتنی لمبی ہے؟" },
    options: [
      { key: "Under 3 minutes", label: { en: "Under 3 minutes", ur: "3 منٹ سے کم" } },
      { key: "5–10 minutes", label: { en: "5–10 minutes", ur: "5–10 منٹ" } },
      { key: "10+ minutes", label: { en: "10+ minutes", ur: "10+ منٹ" } },
    ]
  },
  {
    id: "hairConcern",
    agentText: { en: "What's your main hair concern?", ur: "آپ کی بالوں کی بنیادی تشویش کیا ہے؟" },
    options: [
      { key: "Hairfall", label: { en: "Hairfall / Thinning", ur: "بال گرنا / پتلے ہونا" } },
      { key: "Frizz", label: { en: "Frizz & dryness", ur: "الجھے اور خشک بال" } },
      { key: "Dandruff", label: { en: "Dandruff / Scalp", ur: "خشکی / کھوپڑی" } },
      { key: "Damage", label: { en: "Damage & breakage", ur: "نقصان اور ٹوٹنا" } },
      { key: "Shine", label: { en: "Dullness / Shine", ur: "بے رونقی / چمک" } },
      { key: "None", label: { en: "No specific concern", ur: "کوئی مخصوص مسئلہ نہیں" } },
    ]
  }
];

export function ChatQuestionnaire({ onComplete, onSkipSetup }: ChatQuestionnaireProps) {
  const { isUrdu, t } = useLang();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom smoothly
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [messages, isTyping, currentStep]);

  // Initial sequence
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    triggerAgentQuestion(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerAgentQuestion = (stepIndex: number) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const q = QUESTIONS[stepIndex];
      if (!q) return;
      setMessages(prev => [
        ...prev, 
        { 
          id: `q-${stepIndex}`, 
          role: "agent", 
          text: isUrdu ? q.agentText.ur : q.agentText.en 
        }
      ]);
    }, 1500); // 1.5s simulated typing delay
  };

  const handleOptionSelect = (optionKey: string, optionLabel: string) => {
    // 1. Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `a-${currentStep}`,
        role: "user",
        text: optionLabel
      }
    ]);

    // 2. Save answer
    const currentQuestion = QUESTIONS[currentStep];
    const newAnswers = { ...answers, [currentQuestion.id]: optionKey };
    setAnswers(newAnswers);

    // 3. Move to next step or complete
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    if (nextStep < QUESTIONS.length) {
      triggerAgentQuestion(nextStep);
    } else {
      // Finish flow
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        // Persist to session storage replicating legacy behavior
        sessionStorage.setItem("glowai_onboarding", JSON.stringify({
          goal: newAnswers.goal, 
          sensitivities: newAnswers.sensitivities === "none" ? ["none"] : [newAnswers.sensitivities], 
          routineTime: newAnswers.routineTime, 
          hairConcern: newAnswers.hairConcern,
        }));
        onComplete();
      }, 1500);
    }
  };

  const currentQ = QUESTIONS[currentStep];

  return (
    <div className="absolute inset-0 bg-clinical-white flex flex-col z-20" dir={isUrdu ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 bg-clinical-white/95 backdrop-blur-xl z-30 flex items-center justify-between px-6 py-4 border-b border-unilever-blue/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-unilever-blue flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-xs font-sans tracking-widest">{t("chat.ai_badge")}</span>
          </div>
          <span className="text-[15px] font-bold text-unilever-blue tracking-tight">{t("chat.assistant")}</span>
        </div>
        <button
          onClick={onSkipSetup}
          className="text-[12px] font-bold text-unilever-blue/60 hover:text-unilever-blue uppercase tracking-wider transition-colors duration-200"
        >
          {t("chat.skip")}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex w-full ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[75%] font-medium text-[15px] leading-relaxed shadow-sm ${
                  msg.role === "agent" 
                    ? "bg-gray-100 text-gray-900 rounded-3xl rounded-tl-sm px-5 py-3" 
                    : "bg-unilever-blue text-white rounded-3xl rounded-tr-sm px-5 py-3"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="flex justify-start w-full"
            >
              <div className="bg-gray-100 rounded-3xl rounded-tl-sm px-5 py-3 w-[72px] flex items-center justify-center gap-1.5 shadow-sm h-[48px]">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={bottomRef} className="h-2 flex-shrink-0" />
      </div>

      {/* Selectable Options Area */}
      <div className="p-4 bg-gradient-to-t from-clinical-white via-clinical-white to-transparent pt-10">
        <AnimatePresence>
          {!isTyping && currentQ && currentStep < QUESTIONS.length && messages.length > 0 && messages[messages.length - 1].role === "agent" && (
            <motion.div 
              key={`options-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
              className={`grid gap-3 w-full max-w-2xl mx-auto ${isUrdu ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 lg:grid-cols-3"}`}
            >
              {currentQ.options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleOptionSelect(opt.key, isUrdu ? opt.label.ur : opt.label.en)}
                  className="w-full border border-unilever-blue/20 text-unilever-blue bg-white rounded-xl px-4 py-3.5 font-semibold text-[14px] hover:border-unilever-blue hover:shadow-md transition-all active:bg-gray-50 flex items-center justify-center text-center"
                >
                  {isUrdu ? opt.label.ur : opt.label.en}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
