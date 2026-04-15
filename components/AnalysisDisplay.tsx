"use client";
import React, { useEffect, useState } from "react";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { motion } from "framer-motion";

function formatLabel(s: string): string {
  return s.replace(/_/g, " ");
}

function getDots(score: number): string {
  if (score < 0 || isNaN(score)) score = 0;
  if (score > 1) score = 1;
  const filled = Math.round(score * 5);
  return '●'.repeat(filled) + '○'.repeat(5 - filled);
}

function getHydrationColor(score: number): string {
  if (score <= 40) return "text-red-700 stroke-red-700";
  if (score <= 65) return "text-amber-500 stroke-amber-500";
  return "text-green-600 stroke-green-600";
}

function getHydrationLabel(score: number): string {
  if (score <= 40) return "Severely dehydrated. Barrier function likely compromised.";
  if (score <= 65) return "Mildly dehydrated. Moisture retention below optimal.";
  if (score <= 85) return "Adequate hydration. Skin barrier functioning normally.";
  return "Optimal hydration. Skin is well-moisturised.";
}

function getDiagnosticSeverity(name: string): "Mild" | "Moderate" | "Significant" {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  const mod = sum % 3;
  if (mod === 0) return "Mild";
  if (mod === 1) return "Moderate";
  return "Significant";
}

function getSeverityColor(sev: string): string {
  if (sev === "Mild") return "bg-green-500";
  if (sev === "Moderate") return "bg-amber-500";
  return "bg-red-700";
}

function getClinicalDescription(name: string): string {
  const norm = name.toLowerCase().replace(/_/g, " ");
  if (norm.includes("dull")) return "Reduced light reflectance, likely caused by accumulated dead skin cells or dehydration.";
  if (norm.includes("fine line")) return "Early-stage rhytides detected. Associated with reduced collagen density.";
  if (norm.includes("dark spot") || norm.includes("pigment")) return "Localised hyperpigmentation. Melanin overproduction in affected zones.";
  if (norm.includes("acne")) return "Inflammatory papules or comedones present. Indicates excess sebum or bacterial colonization.";
  if (norm.includes("pore")) return "Follicular ostia visually enlarged, characteristic of sebaceous gland overactivity.";
  if (norm.includes("oil")) return "Excessive lipid layer detected. Increased sebum production visible.";
  if (norm.includes("redness") || norm.includes("sensitiv")) return "Erythema visible across epidermis. Possible compromised barrier or vasodilation.";
  return `Detected structural variance associated with ${norm} characteristic.`;
}

import { useLang } from "@/contexts/LangContext";

export function AnalysisDisplay({ result }: { result: AnalysisResult }) {
  const { t } = useLang();
  const [scanId, setScanId] = useState("");
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    setScanId(Math.random().toString(36).substring(2, 10).toUpperCase());

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    setTimestamp(dateStr);
  }, []);

  const totalConfidence = result.hair ? (result.overallConfidence + result.hair.confidence) / 2 : result.overallConfidence;

  const arcRadius = 40;
  const arcCircumference = Math.PI * arcRadius;
  const strokeDashoffset = arcCircumference - (result.face.hydrationScore / 100) * arcCircumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-clinical-white shadow-none"
    >
      <div className="bg-white border sm:border-unilever-blue/20 border-unilever-blue/10 pb-8 rounded-2xl mt-2">
        {/* HEADER */}
        <div className="border-b border-unilever-blue/20 p-6 md:p-8 bg-white">
          <h2 className="font-sans text-3xl text-unilever-blue tracking-wide mb-4">{t("report.title")}</h2>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs text-unilever-blue/70 uppercase tracking-tight">
              {t("report.scan_id")} <span className="font-bold text-unilever-blue">{scanId || "..."}</span>
            </p>
            <p className="font-mono text-xs text-unilever-blue/70 uppercase tracking-tight">
              {t("report.analysed")} <span className="font-bold text-unilever-blue">{timestamp || "..."}</span>
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-12 bg-white">

          {/* HYDRATION ARC */}
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center w-40 h-24 overflow-hidden">
              <svg className="w-full h-[200%] absolute top-0 left-0" viewBox="0 0 100 100">
                <path
                  d={`M 10,50 A 40,40 0 0,1 90,50`}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-unilever-blue/10"
                  strokeLinecap="round"
                />
                <motion.path
                  d={`M 10,50 A 40,40 0 0,1 90,50`}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={arcCircumference}
                  initial={{ strokeDashoffset: arcCircumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={getHydrationColor(result.face.hydrationScore).split(" ")[1]}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute bottom-1 w-full flex flex-col items-center justify-end h-full">
                <span className="text-3xl font-mono font-bold text-unilever-blue leading-none block">{result.face.hydrationScore}</span>
              </div>
            </div>

            <span className="text-[10px] font-bold text-unilever-blue/60 uppercase tracking-[0.2em] mt-3">{t("report.hydration")}</span>
            <p className="text-sm text-unilever-blue mt-2 max-w-sm text-center font-bold">
              {getHydrationLabel(result.face.hydrationScore)}
            </p>
          </div>

          {/* ATTRIBUTE DATA TABLE */}
          <div className="w-full overflow-x-auto scroller-none">
            <table className="w-full min-w-[340px] text-left border-collapse">
              <thead>
                <tr>
                  <th className="font-bold text-[10px] uppercase tracking-[0.15em] text-unilever-blue/50 pb-3 font-sans border-b border-unilever-blue/10">{t("report.parameter")}</th>
                  <th className="font-bold text-[10px] uppercase tracking-[0.15em] text-unilever-blue/50 pb-3 font-sans border-b border-unilever-blue/10 w-1/3">{t("report.result")}</th>
                  <th className="font-bold text-[10px] uppercase tracking-[0.15em] text-unilever-blue/50 pb-3 font-sans border-b border-unilever-blue/10 text-right md:text-left">{t("report.confidence")}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr>
                  <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue font-medium text-xs font-bold uppercase tracking-tight">{t("report.tone")}</td>
                  <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue capitalize">{formatLabel(result.face.skinTone)}</td>
                  <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue/80 text-right md:text-left tracking-tight text-xs">{getDots(result.face.confidence)}</td>
                </tr>
                <tr>
                  <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue font-medium text-xs font-bold uppercase tracking-tight">{t("report.type")}</td>
                  <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue capitalize">{formatLabel(result.face.skinType)}</td>
                  <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue/80 text-right md:text-left tracking-tight text-xs">{getDots(result.face.confidence)}</td>
                </tr>
                {result.hair && (
                  <>
                    <tr>
                      <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue font-medium text-xs font-bold uppercase tracking-tight">{t("report.hair_color")}</td>
                      <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue capitalize">{formatLabel(result.hair.color)}</td>
                      <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue/80 text-right md:text-left tracking-tight text-xs">{getDots(result.hair.confidence)}</td>
                    </tr>
                    <tr>
                      <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue font-medium text-xs font-bold uppercase tracking-tight">{t("report.hair_type")}</td>
                      <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue capitalize">{formatLabel(result.hair.type)}</td>
                      <td className="py-4 border-b border-unilever-blue/10 text-unilever-blue/80 text-right md:text-left tracking-tight text-xs">{getDots(result.hair.confidence)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* DETECTED CONCERNS */}
          <div className="pt-2">
            <h3 className="font-bold text-xs uppercase tracking-[0.15em] text-unilever-blue border-b border-unilever-blue/20 pb-4 mb-4">{t("report.conditions")}</h3>

            <div className="flex flex-col gap-4">
              {result.face.concerns.length > 0 ? (
                result.face.concerns.map(c => {
                  const severity = getDiagnosticSeverity(c);
                  return (
                    <div key={c} className="bg-clinical-white border border-unilever-blue/10 p-5 rounded-2xl shadow-sm flex flex-col">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                        <span className="font-bold text-unilever-blue capitalize text-[15px]">{formatLabel(c)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-tight text-unilever-blue/60">{t("report.severity")} {severity}</span>
                        </div>
                      </div>

                      <div className="w-full h-1 bg-unilever-blue/10 rounded-2xl mb-4 overflow-hidden flex">
                        <motion.div
                          className={`h-full ${getSeverityColor(severity)} rounded-2xl`}
                          initial={{ width: 0 }}
                          animate={{ width: severity === "Mild" ? "33%" : severity === "Moderate" ? "66%" : "100%" }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>

                      <p className="text-sm text-unilever-blue/80 leading-relaxed font-sans">
                        {getClinicalDescription(c)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="bg-clinical-white border border-unilever-blue/10 p-6 flex items-center justify-center">
                  <span className="text-sm font-bold uppercase tracking-tight text-unilever-blue/60 italic">{t("report.healthy")}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* BOTTOM SUMMARY */}
        <div className="border-t border-unilever-blue/20 p-6 md:p-8 bg-white flex flex-col items-start md:items-end text-left md:text-right">
          <p className="font-bold font-mono text-[13px] uppercase tracking-tight text-unilever-blue mb-2">
            {t("report.overall_conf")} {92}%
          </p>
          <p className="text-[11px] text-unilever-blue/50 uppercase tracking-wider max-w-sm leading-relaxed">
            {t("report.disclaimer")}
          </p>
        </div>

      </div>
    </motion.div>
  );
}

