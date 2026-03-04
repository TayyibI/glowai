"use client";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { Card, CardTitle } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Droplets, Sparkles, AlertCircle } from "lucide-react";
const CONFIDENCE_LOW_THRESHOLD = 0.6;
function formatLabel(s: string): string {
  return s.replace(/_/g, " ");
}
function getHydrationColor(score: number): string {
  if (score >= 80) return "text-emerald-500 stroke-emerald-500";
  if (score >= 60) return "text-blue-500 stroke-blue-500";
  if (score >= 40) return "text-amber-500 stroke-amber-500";
  return "text-red-500 stroke-red-500";
}
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colorClass = getHydrationColor(percentage);
  return (
    <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-100"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={colorClass.split(' ')[1]}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-dash-text-primary">{percentage}</span>
      </div>
    </div>
  );
}
export function AnalysisDisplay({ result }: { result: AnalysisResult }) {
  const isLowConfidence = result.overallConfidence < CONFIDENCE_LOW_THRESHOLD;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-dash-border/60 bg-white/80 backdrop-blur-md shadow-xl sm:p-8">
        <div className="flex flex-col items-start gap-3 mb-6 sm:flex-row sm:items-center sm:mb-8">
          <div className="p-2 bg-gradient-to-br from-dash-brand-blue/20 to-purple-500/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-dash-brand-blue" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold m-0 tracking-tight text-dash-text-primary">Your AI Skin & Hair Profile</CardTitle>
            <p className="text-sm text-dash-text-secondary mt-1">Personalized decoding of your unique attributes</p>
          </div>
        </div>
        {isLowConfidence && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex gap-3 rounded-2xl border border-amber-200/50 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm items-start"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Results are less certain. We recommend gentler, general products. For best
              results, use a clear, well-lit selfie next time.
            </p>
          </motion.div>
        )}
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Hydration Score Column */}
          <div className="flex flex-col items-center justify-center bg-gray-50/50 p-5 rounded-3xl border border-dash-border/40 min-w-[0] md:min-w-[220px]">
            <div className="flex items-center gap-2 mb-4 text-dash-text-tertiary">
              <Droplets className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Hydration</h3>
            </div>

            <CircularProgress percentage={result.face.hydrationScore} />

            <div className="mt-4 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-dash-border/50 ${getHydrationColor(result.face.hydrationScore).split(' ')[0]}`}>
                {result.face.hydrationLevel}
              </span>
            </div>
          </div>
          {/* Details Column */}
          <div className="flex-1 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-5 rounded-2xl border border-dash-border/60 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-dash-text-tertiary mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-dash-brand-blue"></span>
                  Skin Tone
                </p>
                <p className="text-lg font-bold text-dash-text-primary capitalize bg-clip-text">
                  {formatLabel(result.face.skinTone)}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-5 rounded-2xl border border-dash-border/60 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-dash-text-tertiary mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Skin Type
                </p>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-dash-text-primary capitalize">
                    {formatLabel(result.face.skinType)}
                  </span>
                  {result.face.skinType === 'dry' && <div className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-700">Needs Care</div>}
                  {result.face.skinType === 'oily' && <div className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-100 text-blue-700">Prone to Shine</div>}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-white p-6 rounded-2xl border border-dash-border/60 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-dash-text-tertiary mb-4 border-b border-dash-border/40 pb-2">
                  Detected Concerns
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {result.face.concerns.length > 0
                    ? result.face.concerns.map((c, i) => (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                        key={c}
                        className="px-4 py-2 bg-gradient-to-br from-red-50 to-orange-50/50 border border-red-100/80 text-red-700 text-sm font-bold rounded-xl capitalize shadow-sm flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {formatLabel(c)}
                      </motion.span>
                    ))
                    : <span className="text-sm font-medium text-dash-text-tertiary italic">Healthy profile detected</span>}
                </div>
              </motion.div>
            </div>
            {result.hair && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 grid gap-4 sm:grid-cols-2"
              >
                <div className="bg-white p-5 rounded-2xl border border-dash-border/60 shadow-sm hover:border-dash-brand-blue/30 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-dash-text-tertiary mb-2">
                    Hair Color
                  </p>
                  <p className="text-lg font-bold text-dash-text-primary capitalize flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-sm" style={{ backgroundColor: result.hair.color.replace('_', '') === 'darkbrown' ? '#3e2723' : result.hair.color.includes('blonde') ? '#f3e5ab' : result.hair.color.includes('black') ? '#111' : '#795548' }} />
                    {formatLabel(result.hair.color)}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-dash-border/60 shadow-sm hover:border-dash-brand-blue/30 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-dash-text-tertiary mb-2">
                    Hair Type
                  </p>
                  <p className="text-lg font-bold text-dash-text-primary capitalize">
                    {formatLabel(result.hair.type)}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <p className="text-[10px] text-dash-text-tertiary uppercase tracking-wider font-semibold">
            AI Confidence: {Math.round(result.overallConfidence * 100)}%
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

