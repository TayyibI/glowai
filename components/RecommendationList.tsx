"use client";

import React, { useState, useEffect } from "react";
import type { Product, Routine, RecommendedProduct } from "@/types/Product";
import { Card, CardTitle } from "@/components/ui/Card";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { ExternalLink, CheckCircle2, Save, Undo2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Switch } from "@/components/ui/Switch";

interface RecommendationListProps {
  routine: Routine & { hair: RecommendedProduct[] };
  showBuyNow?: boolean;
  userTags?: string[];
}

// Map the ID prefix to a beautiful brand name
function getBrandName(id: string) {
  if (id.startsWith("ponds")) return "Pond's";
  if (id.startsWith("simple")) return "Simple";
  if (id.startsWith("sunsilk")) return "Sunsilk";
  if (id.startsWith("dove")) return "Dove";
  return "Premium Brand";
}

// Helper to determine why a product was recommended
function getWhyThis(product: Product, userTags: string[]) {
  const matches = product.tags.filter(tag => userTags.includes(tag));
  if (matches.length === 0) return "A solid essential for your routine";

  const labels = matches.slice(0, 2).map(m => m.replace(/_/g, " "));
  return `Matches your ${labels.join(" + ")}`;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

function AnimatedProductCard({
  rec,
  showBuyNow,
  userTags = [],
  isActive = true,
  onToggle
}: {
  rec: RecommendedProduct;
  showBuyNow?: boolean;
  userTags?: string[];
  isActive?: boolean;
  onToggle?: (checked: boolean) => void;
}) {
  const { product, reason } = rec;
  const brandName = getBrandName(product.id);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative flex h-full flex-col rounded-none border transition-all duration-300 overflow-hidden ${isActive ? "border-charcoal/20 bg-alabaster" : "border-charcoal/10 bg-alabaster/50"
        }`}
    >
      <div className={`relative w-full overflow-hidden shrink-0 aspect-[4/5] border-b border-charcoal/20 transition-all duration-300 ${isActive ? "bg-champagne/10" : "bg-black/5 grayscale-[0.8] opacity-70"
        }`}>
        <img
          src={product.image || "/placeholder-product.jpg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-4 right-4 rounded-none border border-charcoal/20 bg-alabaster px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-charcoal">
          {product.category.replace(/_/g, " ")}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? "text-charcoal/60" : "text-charcoal/40"}`}>
            {brandName}
          </p>
          {onToggle && (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch checked={isActive} onCheckedChange={onToggle} />
            </div>
          )}
        </div>
        <h3 className={`font-serif text-xl uppercase tracking-widest mb-3 transition-colors ${isActive ? "text-charcoal" : "text-charcoal/40"}`}>
          {product.name}
        </h3>

        {product.description && (
          <p className={`text-sm leading-relaxed mb-6 transition-colors ${isActive ? "text-charcoal/80" : "text-charcoal/40"}`}>
            {product.description}
          </p>
        )}

        <div className={`mt-auto pt-6 border-t transition-colors ${isActive ? "border-charcoal/20" : "border-charcoal/10"}`}>
          <div className={`flex items-start gap-3 mb-6 p-4 border transition-colors ${isActive ? "bg-champagne/10 border-charcoal/20" : "bg-charcoal/5 border-charcoal/10 opacity-70"}`}>
            <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 transition-colors ${isActive ? "text-charcoal" : "text-charcoal/40"}`} />
            <div className={`text-sm leading-relaxed transition-colors ${isActive ? "text-charcoal" : "text-charcoal/50"}`}>
              <span className={`font-bold uppercase tracking-widest text-[10px] block mb-1 transition-colors ${isActive ? "text-charcoal" : "text-charcoal/40"}`}>Why this product for YOU</span>
              <ReactMarkdown
                components={{
                  strong: ({ node, ...props }) => <span className={`font-bold ${isActive ? "text-charcoal" : "text-charcoal/50"}`} {...props} />
                }}
              >
                {reason}
              </ReactMarkdown>
            </div>
          </div>

          {showBuyNow && product.purchaseLink && (
            <motion.a
              whileHover={isActive ? { scale: 1.02 } : {}}
              whileTap={isActive ? { scale: 0.98 } : {}}
              href={product.purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex w-full items-center justify-center gap-2 rounded-none border px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${isActive
                ? "border-charcoal/20 bg-charcoal text-white hover:bg-alabaster hover:text-charcoal"
                : "border-charcoal/10 bg-charcoal/10 text-charcoal/40 cursor-not-allowed pointer-events-none"
                }`}
            >
              Buy Now!
              <ExternalLink className="w-4 h-4" />
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

function getEstimatedTime(products: RecommendedProduct[], activeIds: Set<string>) {
  let time = 0;
  for (const rec of products) {
    if (activeIds.has(rec.product.id)) {
      const cat = rec.product.category.toLowerCase();
      if (cat.includes("spf") || cat.includes("sunscreen")) time += 0.5;
      else if (cat.includes("eye")) time += 0.5;
      else time += 1;
    }
  }
  return time;
}

export function RecommendationList({ routine, showBuyNow, userTags = [] }: RecommendationListProps) {
  const [maxCount, setMaxCount] = useState<number>(4);
  const [activeMorningIds, setActiveMorningIds] = useState<Set<string>>(new Set());
  const [activeEveningIds, setActiveEveningIds] = useState<Set<string>>(new Set());
  const [activeHairIds, setActiveHairIds] = useState<Set<string>>(new Set());

  const [expandMorning, setExpandMorning] = useState(false);
  const [expandEvening, setExpandEvening] = useState(false);
  const [expandHair, setExpandHair] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const onboarding = JSON.parse(sessionStorage.getItem("glowai_onboarding") || "{}");
      const rTime = onboarding.routineTime;
      let limit = 4;
      if (rTime === "Under 3 minutes" || rTime === "Under 3") limit = 2;
      else if (rTime === "5–10 minutes" || rTime === "5-10") limit = 4;
      else if (rTime === "10+ minutes" || rTime === "10+") limit = 6;
      setMaxCount(limit);

      const defaultMorning = new Set(routine.day.slice(0, limit).map(r => r.product.id));
      const defaultEvening = new Set(routine.night.slice(0, limit).map(r => r.product.id));
      const defaultHair = new Set(routine.hair.map(r => r.product.id));

      const savedMorning = localStorage.getItem("glowai_morningRoutine");
      const savedEvening = localStorage.getItem("glowai_eveningRoutine");
      const savedHair = localStorage.getItem("glowai_hairRoutine");

      if (savedMorning) setActiveMorningIds(new Set(JSON.parse(savedMorning)));
      else setActiveMorningIds(defaultMorning);

      if (savedEvening) setActiveEveningIds(new Set(JSON.parse(savedEvening)));
      else setActiveEveningIds(defaultEvening);

      if (savedHair) setActiveHairIds(new Set(JSON.parse(savedHair)));
      else setActiveHairIds(defaultHair);

    } catch (e) {
      console.warn("Failed to read routine config", e);
      setMaxCount(4);
      setActiveMorningIds(new Set(routine.day.slice(0, 4).map(r => r.product.id)));
      setActiveEveningIds(new Set(routine.night.slice(0, 4).map(r => r.product.id)));
      setActiveHairIds(new Set(routine.hair.map(r => r.product.id)));
    }
  }, [routine]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const saveRoutine = (type: 'morning' | 'evening' | 'hair') => {
    if (type === 'morning') {
      localStorage.setItem("glowai_morningRoutine", JSON.stringify(Array.from(activeMorningIds)));
      showToast("Morning routine saved");
    } else if (type === 'evening') {
      localStorage.setItem("glowai_eveningRoutine", JSON.stringify(Array.from(activeEveningIds)));
      showToast("Evening routine saved");
    } else {
      localStorage.setItem("glowai_hairRoutine", JSON.stringify(Array.from(activeHairIds)));
      showToast("Hair routine saved");
    }
  };

  const resetRecommended = () => {
    setActiveMorningIds(new Set(routine.day.slice(0, maxCount).map(r => r.product.id)));
    setActiveEveningIds(new Set(routine.night.slice(0, maxCount).map(r => r.product.id)));
    setActiveHairIds(new Set(routine.hair.map(r => r.product.id)));

    localStorage.removeItem("glowai_morningRoutine");
    localStorage.removeItem("glowai_eveningRoutine");
    localStorage.removeItem("glowai_hairRoutine");
    showToast("Reset to recommended");
  };

  const toggleProduct = (categoryId: 'morning' | 'evening' | 'hair', id: string, checked: boolean) => {
    const setter = categoryId === 'morning' ? setActiveMorningIds : categoryId === 'evening' ? setActiveEveningIds : setActiveHairIds;
    setter(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const morningVisible = expandMorning ? routine.day : routine.day.slice(0, maxCount);
  const morningHiddenCount = routine.day.length - maxCount;
  const morningSteps = Array.from(activeMorningIds).filter(id => routine.day.some(r => r.product.id === id)).length;
  const morningTime = getEstimatedTime(routine.day, activeMorningIds);

  const eveningVisible = expandEvening ? routine.night : routine.night.slice(0, maxCount);
  const eveningHiddenCount = routine.night.length - maxCount;
  const eveningSteps = Array.from(activeEveningIds).filter(id => routine.night.some(r => r.product.id === id)).length;
  const eveningTime = getEstimatedTime(routine.night, activeEveningIds);

  const hairVisible = expandHair ? routine.hair : routine.hair.slice(0, maxCount);
  const hairHiddenCount = routine.hair.length - maxCount;
  const hairSteps = Array.from(activeHairIds).filter(id => routine.hair.some(r => r.product.id === id)).length;
  const hairTime = getEstimatedTime(routine.hair, activeHairIds);

  return (
    <div className="space-y-12 relative">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-white px-6 py-3 rounded-none border border-bordeaux shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 text-champagne" />
            <span className="text-xs font-bold tracking-widest uppercase">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-charcoal/10 pb-4">
          <div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-2">Morning Routine</h2>
            <p className="text-xs font-bold text-charcoal/80 uppercase tracking-widest">
              {morningSteps} step{morningSteps !== 1 ? "s" : ""} · ~{Math.ceil(morningTime)} min
            </p>
          </div>
          <button onClick={resetRecommended} className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/50 hover:text-charcoal transition-colors">
            <Undo2 className="w-3 h-3" />
            Reset to recommended
          </button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {morningVisible.map((rec) => (
            <AnimatedProductCard
              key={rec.product.id}
              rec={rec}
              showBuyNow={showBuyNow}
              userTags={userTags}
              isActive={activeMorningIds.has(rec.product.id)}
              onToggle={(c) => toggleProduct('morning', rec.product.id, c)}
            />
          ))}
        </motion.div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-charcoal/10 pt-6">
          {morningHiddenCount > 0 && !expandMorning ? (
            <button onClick={() => setExpandMorning(true)} className="text-xs font-bold uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors">
              Show {morningHiddenCount} more product{morningHiddenCount !== 1 ? 's' : ''}
            </button>
          ) : <div />}

          <button onClick={() => saveRoutine('morning')} className="flex items-center gap-2 bg-bordeaux text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors">
            <Save className="w-4 h-4" />
            Save Morning Routine
          </button>
        </div>
      </section>

      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-charcoal/10 pb-4">
          <div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-2">Evening Routine</h2>
            <p className="text-xs font-bold text-charcoal/80 uppercase tracking-widest">
              {eveningSteps} step{eveningSteps !== 1 ? "s" : ""} · ~{Math.ceil(eveningTime)} min
            </p>
          </div>
          <button onClick={resetRecommended} className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/50 hover:text-charcoal transition-colors">
            <Undo2 className="w-3 h-3" />
            Reset to recommended
          </button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {eveningVisible.map((rec) => (
            <AnimatedProductCard
              key={rec.product.id}
              rec={rec}
              showBuyNow={showBuyNow}
              userTags={userTags}
              isActive={activeEveningIds.has(rec.product.id)}
              onToggle={(c) => toggleProduct('evening', rec.product.id, c)}
            />
          ))}
        </motion.div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-charcoal/10 pt-6">
          {eveningHiddenCount > 0 && !expandEvening ? (
            <button onClick={() => setExpandEvening(true)} className="text-xs font-bold uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors">
              Show {eveningHiddenCount} more product{eveningHiddenCount !== 1 ? 's' : ''}
            </button>
          ) : <div />}

          <button onClick={() => saveRoutine('evening')} className="flex items-center gap-2 bg-bordeaux text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors">
            <Save className="w-4 h-4" />
            Save Evening Routine
          </button>
        </div>
      </section>

      {routine.hair.length > 0 && (
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-charcoal/10 pb-4">
            <div>
              <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-2">Hair Care</h2>
              <p className="text-xs font-bold text-charcoal/80 uppercase tracking-widest">
                {hairSteps} step{hairSteps !== 1 ? "s" : ""} · ~{Math.ceil(hairTime)} min
              </p>
            </div>
            <button onClick={resetRecommended} className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/50 hover:text-charcoal transition-colors">
              <Undo2 className="w-3 h-3" />
              Reset to recommended
            </button>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {hairVisible.map((rec) => (
              <AnimatedProductCard
                key={rec.product.id}
                rec={rec}
                showBuyNow={showBuyNow}
                userTags={userTags}
                isActive={activeHairIds.has(rec.product.id)}
                onToggle={(c) => toggleProduct('hair', rec.product.id, c)}
              />
            ))}
          </motion.div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-charcoal/10 pt-6">
            {hairHiddenCount > 0 && !expandHair ? (
              <button onClick={() => setExpandHair(true)} className="text-xs font-bold uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors">
                Show {hairHiddenCount} more product{hairHiddenCount !== 1 ? 's' : ''}
              </button>
            ) : <div />}

            <button onClick={() => saveRoutine('hair')} className="flex items-center gap-2 bg-bordeaux text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors">
              <Save className="w-4 h-4" />
              Save Hair Routine
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
