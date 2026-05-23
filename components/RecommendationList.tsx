"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Product, Routine, RecommendedProduct } from "@/types/Product";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  ExternalLink, CheckCircle2, Save, Undo2, ChevronDown,
  Sun, Moon, Wind, ShieldCheck
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Switch } from "@/components/ui/Switch";
import { useLang } from "@/contexts/LangContext";

interface RecommendationListProps {
  routine: Routine & { hair: RecommendedProduct[] };
  showBuyNow?: boolean;
  userTags?: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getBrandName(id: string) {
  if (id.startsWith("loreal")) return "L'Oréal Paris";
  if (id.startsWith("elvive")) return "L'Oréal Elvive";
  if (id.startsWith("ponds")) return "Pond's";
  if (id.startsWith("simple")) return "Simple";
  if (id.startsWith("sunsilk")) return "Sunsilk";
  if (id.startsWith("dove")) return "Dove";
  return "L'Oréal Paris";
}

function getMatchScore(product: Product, userTags: string[]): number {
  if (userTags.length === 0) return 72;
  const matches = product.tags.filter((t) => userTags.includes(t)).length;
  const base = 60 + Math.round((matches / Math.max(product.tags.length, 1)) * 40);
  return Math.min(base, 99);
}

function getTargetArea(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("eye")) return "Periorbital";
  if (c.includes("spf") || c.includes("sunscreen")) return "Full Face";
  if (c.includes("serum")) return "Dermal Layer";
  if (c.includes("cleanser") || c.includes("wash")) return "Epidermal Surface";
  if (c.includes("moistur")) return "Barrier Function";
  if (c.includes("toner")) return "pH Regulation";
  if (c.includes("shampoo")) return "Scalp";
  if (c.includes("conditioner")) return "Hair Shaft";
  if (c.includes("mask")) return "Deep Treatment";
  return "Skin Surface";
}

function getStep(index: number): string {
  return `Step ${String(index + 1).padStart(2, "0")}`;
}

// ── Diagnostic row (clinical list item) ──────────────────────────────────────
function DiagnosticRow({
  rec,
  index,
  showBuyNow,
  userTags = [],
  isActive = true,
  onToggle,
}: {
  rec: RecommendedProduct;
  index: number;
  showBuyNow?: boolean;
  userTags?: string[];
  isActive?: boolean;
  onToggle?: (checked: boolean) => void;
}) {
  const { product, reason } = rec;
  const brandName = getBrandName(product.id);
  const matchScore = getMatchScore(product, userTags);
  const targetArea = getTargetArea(product.category);
  const barRef = useRef<HTMLDivElement>(null);
  const [barAnimated, setBarAnimated] = useState(false);
  const { t } = useLang();

  // Animate bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setBarAnimated(true), 200 + index * 120);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className={`diagnostic-row transition-all duration-200 ease-in-out ${!isActive ? "opacity-50" : ""}`}
    >
      {/* Left: Step number + thumbnail */}
      <div className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-2 shrink-0">
        <span className="font-mono text-[9px] uppercase tracking-tight text-unilever-blue/40 font-bold">
          {getStep(index)}
        </span>
        <div className={`w-16 h-16 sm:w-20 sm:h-20 border border-unilever-blue/10 overflow-hidden shrink-0 transition-all duration-200 ${isActive ? "bg-ponds-blush/10" : "bg-unilever-blue/5 grayscale"}`}>
          <img
            src={product.image || "/placeholder-product.jpg"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Center: Product data */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-unilever-blue/40 mb-0.5">
              {brandName}
            </p>
            <h3 className={`font-sans text-base sm:text-lg uppercase tracking-wide truncate transition-colors ${isActive ? "text-unilever-blue" : "text-unilever-blue/40"}`}>
              {product.name}
            </h3>
          </div>

          {/* Toggle */}
          {onToggle && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
              <Switch checked={isActive} onCheckedChange={onToggle} />
            </div>
          )}
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3">
          <span className="text-[9px] uppercase tracking-[0.12em] text-unilever-blue/50 font-bold">
            {t("row.category")} <span className="text-unilever-blue/70">{product.category.replace(/_/g, " ")}</span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.12em] text-unilever-blue/50 font-bold">
            {t("row.target")} <span className="text-unilever-blue/70">{targetArea}</span>
          </span>
        </div>

        {/* Match Score bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8.5px] uppercase tracking-tight text-unilever-blue/40 font-bold">{t("row.efficacy")}</span>
            <span className="text-[8.5px] font-mono font-bold text-[#C2A878]">{matchScore}%</span>
          </div>
          <div className="match-bar-track">
            <div
              ref={barRef}
              className="match-bar-fill"
              style={{ width: barAnimated && isActive ? `${matchScore}%` : "0%" }}
            />
          </div>
        </div>

        {/* Why this */}
        <div className={`flex items-start gap-2 text-xs leading-relaxed transition-colors ${isActive ? "text-unilever-blue/70" : "text-unilever-blue/30"}`}>
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#C2A878]" />
          <div>
            <span className="font-bold uppercase tracking-tight text-[9px] text-unilever-blue/40 block mb-0.5">{t("row.rationale")}</span>
            <ReactMarkdown
              components={{
                strong: ({ node, ...props }) => <span className="font-bold text-unilever-blue/80" {...props} />,
                p: ({ node, ...props }) => <span {...props} />,
              }}
            >
              {reason}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Right: CTA */}
      {showBuyNow && product.purchaseLink && (
        <div className="shrink-0 flex flex-col items-start sm:items-end justify-center sm:justify-between self-stretch mt-2 sm:mt-0">
          <motion.a
            whileHover={isActive ? { scale: 1.03 } : {}}
            whileTap={isActive ? { scale: 0.97 } : {}}
            href={product.purchaseLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-6 sm:px-4 py-3 sm:py-2.5 text-[10px] sm:text-[9px] font-bold uppercase tracking-tight border transition-all duration-200 ease-in-out w-full sm:w-auto justify-center ${
              isActive
                ? "border-unilever-blue/25 bg-unilever-blue text-white hover:bg-clinical-white hover:text-unilever-blue"
                : "border-unilever-blue/10 bg-unilever-blue/5 text-unilever-blue/30 pointer-events-none"
            }`}
          >
            {t("row.order")}
            <ExternalLink className="w-3.5 sm:w-3 h-3.5 sm:h-3" />
          </motion.a>
        </div>
      )}
    </motion.div>
  );
}

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

// ── PDF generation ───────────────────────────────────────────────────────────
function generateRoutinePDF(
  day: RecommendedProduct[],
  night: RecommendedProduct[],
  hair: RecommendedProduct[],
  activeMorningIds: Set<string>,
  activeEveningIds: Set<string>,
  activeHairIds: Set<string>
) {
  // Merge day + night, deduplicate by product id, label with time-of-day
  const combinedMap = new Map<string, { rec: RecommendedProduct; time: string }>();
  for (const rec of day) {
    if (!activeMorningIds.has(rec.product.id)) continue;
    combinedMap.set(rec.product.id, { rec, time: "AM" });
  }
  for (const rec of night) {
    if (!activeEveningIds.has(rec.product.id)) continue;
    if (combinedMap.has(rec.product.id)) {
      combinedMap.get(rec.product.id)!.time = "AM + PM";
    } else {
      combinedMap.set(rec.product.id, { rec, time: "PM" });
    }
  }
  const combined = Array.from(combinedMap.values());
  const activeHair = hair.filter((r) => activeHairIds.has(r.product.id));
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const productRow = (item: { rec: RecommendedProduct; time: string }, idx: number) => `
    <div class="product">
      <div class="step">Step ${String(idx + 1).padStart(2, "0")}</div>
      <div class="product-header">
        <div class="product-name">${item.rec.product.name}</div>
        <div class="product-time">${item.time}</div>
      </div>
      <div class="product-category">${item.rec.product.category.replace(/_/g, " ")}</div>
      ${item.rec.product.description ? `<div class="product-desc">${item.rec.product.description}</div>` : ""}
      ${item.rec.reason ? `<div class="product-reason">Why this product: ${item.rec.reason.replace(/\*\*/g, "")}</div>` : ""}
      ${item.rec.product.purchaseLink ? `<div class="product-link">Buy now: <a href="${item.rec.product.purchaseLink}">${item.rec.product.purchaseLink}</a></div>` : ""}
    </div>`;

  const hairRow = (rec: RecommendedProduct, idx: number) => `
    <div class="product">
      <div class="step">Step ${String(idx + 1).padStart(2, "0")}</div>
      <div class="product-header">
        <div class="product-name">${rec.product.name}</div>
        <div class="product-time">HAIR</div>
      </div>
      <div class="product-category">${rec.product.category.replace(/_/g, " ")}</div>
      ${rec.product.description ? `<div class="product-desc">${rec.product.description}</div>` : ""}
      ${rec.reason ? `<div class="product-reason">Why this product: ${rec.reason.replace(/\*\*/g, "")}</div>` : ""}
      ${rec.product.purchaseLink ? `<div class="product-link">Buy now: <a href="${rec.product.purchaseLink}">${rec.product.purchaseLink}</a></div>` : ""}
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>GlowAI Routine — ${date}</title>
  <style>
    @page { size: A4; margin: 18mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1a1a2e; font-size: 10pt; line-height: 1.4; }
    .header { border-bottom: 2px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 20pt; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; }
    .header-right { text-align: right; }
    .subtitle { font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: #555; }
    .date { font-size: 7.5pt; color: #999; margin-top: 3px; }
    .section-title { font-size: 12pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 22px 0 12px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
    .product { padding: 10px 0; border-bottom: 1px solid #f2f2f2; page-break-inside: avoid; }
    .product-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 2px; }
    .product-name { font-weight: 700; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.04em; flex: 1; }
    .product-time { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #fff; background: #1a1a2e; padding: 2px 7px; white-space: nowrap; flex-shrink: 0; }
    .product-category { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; }
    .product-desc { font-size: 8.5pt; color: #444; line-height: 1.5; margin-bottom: 3px; }
    .product-reason { font-size: 8pt; color: #666; font-style: italic; margin-bottom: 3px; }
    .product-link { font-size: 7.5pt; color: #1a1a2e; word-break: break-all; }
    .product-link a { color: #1a1a2e; }
    .step { font-size: 7pt; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #bbb; margin-bottom: 2px; }
    .empty { color: #999; font-style: italic; font-size: 9pt; padding: 10px 0; }
    .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 7pt; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">GlowAI</div>
    <div class="header-right">
      <div class="subtitle">Personalised Beauty Routine</div>
      <div class="date">Generated ${date}</div>
    </div>
  </div>

  <div class="section-title">Skincare Routine (AM &amp; PM)</div>
  ${combined.length === 0 ? '<p class="empty">No products selected.</p>' : combined.map(productRow).join("")}

  ${activeHair.length > 0 ? `
  <div class="section-title">Hair Care Routine</div>
  ${activeHair.map(hairRow).join("")}` : ""}

  <div class="footer">
    GlowAI — Powered by L'Oréal Paris &nbsp;|&nbsp; AI-generated personalised routine — consult a dermatologist for clinical advice
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups to save your routine as PDF."); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  icon,
  steps,
  time,
  onReset,
}: {
  title: string;
  icon: React.ReactNode;
  steps: number;
  time: number;
  onReset: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-5 gap-3 border-b border-unilever-blue/10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center border border-unilever-blue/15 text-unilever-blue/60">
          {icon}
        </div>
        <div>
          <h2 className="font-sans text-2xl uppercase tracking-tight text-unilever-blue">{title}</h2>
          <p className="text-[9px] font-mono font-bold uppercase tracking-tight text-unilever-blue/40 mt-0.5">
            {steps === 1 ? t("rec.1_active") : steps + " " + t("rec.active_products")} &nbsp;·&nbsp; ~{Math.ceil(time)} {t("rec.min")}
          </p>
        </div>
      </div>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight text-unilever-blue/40 hover:text-unilever-blue transition-all duration-200 ease-in-out"
      >
        <Undo2 className="w-3 h-3" />
        {t("rec.reset")}
      </button>
    </div>
  );
}

// ── Section footer (expand only) ─────────────────────────────────────────────
function SectionFooter({
  hiddenCount,
  expanded,
  onExpand,
}: {
  hiddenCount: number;
  expanded: boolean;
  onExpand: () => void;
}) {
  const { t } = useLang();
  if (hiddenCount <= 0 || expanded) return null;
  return (
    <div className="pt-5 border-t border-unilever-blue/8 mt-2">
      <button
        onClick={onExpand}
        className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight text-unilever-blue/50 hover:text-unilever-blue transition-all duration-200 ease-in-out"
      >
        <ChevronDown className="w-3.5 h-3.5" />
        {hiddenCount === 1 ? t("rec.show_1_more") : t("rec.show_more").replace("{n}", String(hiddenCount))}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function RecommendationList({ routine, showBuyNow, userTags = [] }: RecommendationListProps) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"morning" | "evening" | "hair">("morning");
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

      const defaultMorning = new Set(routine.day.slice(0, limit).map((r) => r.product.id));
      const defaultEvening = new Set(routine.night.slice(0, limit).map((r) => r.product.id));
      const defaultHair = new Set(routine.hair.map((r) => r.product.id));

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
      setActiveMorningIds(new Set(routine.day.slice(0, 4).map((r) => r.product.id)));
      setActiveEveningIds(new Set(routine.night.slice(0, 4).map((r) => r.product.id)));
      setActiveHairIds(new Set(routine.hair.map((r) => r.product.id)));
    }
  }, [routine]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleSavePDF = () => {
    generateRoutinePDF(routine.day, routine.night, routine.hair, activeMorningIds, activeEveningIds, activeHairIds);
    showToast("Opening print dialog — choose 'Save as PDF'");
  };

  const resetRecommended = () => {
    setActiveMorningIds(new Set(routine.day.slice(0, maxCount).map((r) => r.product.id)));
    setActiveEveningIds(new Set(routine.night.slice(0, maxCount).map((r) => r.product.id)));
    setActiveHairIds(new Set(routine.hair.map((r) => r.product.id)));
    localStorage.removeItem("glowai_morningRoutine");
    localStorage.removeItem("glowai_eveningRoutine");
    localStorage.removeItem("glowai_hairRoutine");
    showToast("Reset to recommended");
  };

  const toggleProduct = (category: "morning" | "evening" | "hair", id: string, checked: boolean) => {
    const setter =
      category === "morning" ? setActiveMorningIds :
        category === "evening" ? setActiveEveningIds :
          setActiveHairIds;
    setter((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const morningVisible = expandMorning ? routine.day : routine.day.slice(0, maxCount);
  const morningHiddenCount = routine.day.length - maxCount;
  const morningSteps = Array.from(activeMorningIds).filter((id) => routine.day.some((r) => r.product.id === id)).length;
  const morningTime = getEstimatedTime(routine.day, activeMorningIds);

  const eveningVisible = expandEvening ? routine.night : routine.night.slice(0, maxCount);
  const eveningHiddenCount = routine.night.length - maxCount;
  const eveningSteps = Array.from(activeEveningIds).filter((id) => routine.night.some((r) => r.product.id === id)).length;
  const eveningTime = getEstimatedTime(routine.night, activeEveningIds);

  const hairVisible = expandHair ? routine.hair : routine.hair.slice(0, maxCount);
  const hairHiddenCount = routine.hair.length - maxCount;
  const hairSteps = Array.from(activeHairIds).filter((id) => routine.hair.some((r) => r.product.id === id)).length;
  const hairTime = getEstimatedTime(routine.hair, activeHairIds);

  return (
    <div className="space-y-16 relative">

      {/* ── Report header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-unilever-blue/10 gap-4">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-unilever-blue/40 mb-1">{t("rec.routine_protocol")}</p>
          <h2 className="font-sans text-3xl uppercase tracking-tight text-unilever-blue">{t("rec.prescribed")}</h2>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-ponds-blush/10 border border-unilever-blue/10 px-4 py-3 shrink-0">
            <ShieldCheck className="w-4 h-4 text-unilever-blue/50" />
            <span className="text-[9px] font-bold uppercase tracking-tight text-unilever-blue/50">{t("rec.ai_verified")}</span>
          </div>
          <button
            onClick={handleSavePDF}
            className="flex items-center gap-2 bg-unilever-blue text-white px-5 py-3 text-[9px] font-bold uppercase tracking-tight hover:opacity-90 transition-opacity duration-200 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            Save Routine as PDF
          </button>
        </div>
      </div>

      {/* ── Tabs selector ─────────────────────────────────────────────── */}
      <div className="flex space-x-2 border-b border-unilever-blue/10 pb-0 overflow-x-auto scroller-none">
        <button
          onClick={() => setActiveTab("morning")}
          className={`px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-tight border-b-2 transition-all shrink-0 ${
            activeTab === "morning" ? "border-unilever-blue text-unilever-blue" : "border-transparent text-unilever-blue/40 hover:text-unilever-blue/70"
          }`}
        >
          {t("rec.morning_tab")}
        </button>
        <button
          onClick={() => setActiveTab("evening")}
          className={`px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-tight border-b-2 transition-all shrink-0 ${
            activeTab === "evening" ? "border-unilever-blue text-unilever-blue" : "border-transparent text-unilever-blue/40 hover:text-unilever-blue/70"
          }`}
        >
          {t("rec.evening_tab")}
        </button>
        {routine.hair.length > 0 && (
          <button
            onClick={() => setActiveTab("hair")}
            className={`px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-tight border-b-2 transition-all shrink-0 ${
              activeTab === "hair" ? "border-unilever-blue text-unilever-blue" : "border-transparent text-unilever-blue/40 hover:text-unilever-blue/70"
            }`}
          >
            {t("rec.hair_tab")}
          </button>
        )}
      </div>

      {/* ── Local toast ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-unilever-blue text-white px-6 py-3 border border-bordeaux shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 text-[#C2A878]" />
            <span className="text-[9px] font-bold tracking-tight uppercase">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ROUTINE CARDS ─────────────────────────────────────────────── */}
      {/* MORNING */}
      {activeTab === "morning" && (
        <section>
          <SectionHeader
            title={t("rec.morning_title")}
            icon={<Sun className="w-4 h-4" />}
            steps={morningSteps}
            time={morningTime}
            onReset={resetRecommended}
          />

          <div className="card-clinical divide-y-0">
            {morningVisible.map((rec, i) => (
              <DiagnosticRow
                key={rec.product.id}
                rec={rec}
                index={i}
                showBuyNow={showBuyNow}
                userTags={userTags}
                isActive={activeMorningIds.has(rec.product.id)}
                onToggle={(c) => toggleProduct("morning", rec.product.id, c)}
              />
            ))}
          </div>

          <SectionFooter
            hiddenCount={morningHiddenCount}
            expanded={expandMorning}
            onExpand={() => setExpandMorning(true)}
          />
        </section>
      )}

      {/* EVENING */}
      {activeTab === "evening" && (
        <section>
          <SectionHeader
            title={t("rec.evening_title")}
            icon={<Moon className="w-4 h-4" />}
            steps={eveningSteps}
            time={eveningTime}
            onReset={resetRecommended}
          />

          <div className="card-clinical divide-y-0">
            {eveningVisible.map((rec, i) => (
              <DiagnosticRow
                key={rec.product.id}
                rec={rec}
                index={i}
                showBuyNow={showBuyNow}
                userTags={userTags}
                isActive={activeEveningIds.has(rec.product.id)}
                onToggle={(c) => toggleProduct("evening", rec.product.id, c)}
              />
            ))}
          </div>

          <SectionFooter
            hiddenCount={eveningHiddenCount}
            expanded={expandEvening}
            onExpand={() => setExpandEvening(true)}
          />
        </section>
      )}

      {/* HAIR CARE */}
      {activeTab === "hair" && routine.hair.length > 0 && (
        <section>
          <SectionHeader
            title={t("rec.hair_title")}
            icon={<Wind className="w-4 h-4" />}
            steps={hairSteps}
            time={hairTime}
            onReset={resetRecommended}
          />

          <div className="card-clinical divide-y-0">
            {hairVisible.map((rec, i) => (
              <DiagnosticRow
                key={rec.product.id}
                rec={rec}
                index={i}
                showBuyNow={showBuyNow}
                userTags={userTags}
                isActive={activeHairIds.has(rec.product.id)}
                onToggle={(c) => toggleProduct("hair", rec.product.id, c)}
              />
            ))}
          </div>

          <SectionFooter
            hiddenCount={hairHiddenCount}
            expanded={expandHair}
            onExpand={() => setExpandHair(true)}
          />
        </section>
      )}
    </div>
  );
}
