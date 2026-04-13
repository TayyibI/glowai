"use client";

import { Lock } from "lucide-react";
import { motion } from "framer-motion";

interface PrivacyBadgeProps {
  /** "default" = alabaster bg version (landing page), "dark" = dark overlay version (camera view) */
  variant?: "default" | "dark" | "camera";
  className?: string;
}

export function PrivacyBadge({ variant = "default", className = "" }: PrivacyBadgeProps) {
  if (variant === "camera") {
    // Minimal inline badge for camera overlay — dark bg, small footprint
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className={`flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/15 px-3 py-1.5 ${className}`}
      >
        <Lock className="w-2.5 h-2.5 text-green-400 shrink-0" />
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/80">
          No Pictures Stored
        </span>
      </motion.div>
    );
  }

  if (variant === "dark") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`inline-flex items-center gap-2.5 bg-white/5 border border-white/15 px-4 py-2.5 ${className}`}
      >
        <Lock className="w-3 h-3 text-green-400 shrink-0" />
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/90 leading-tight">
            Privacy Guarantee
          </span>
          <span className="text-[8.5px] text-white/50 uppercase tracking-wider leading-tight mt-0.5">
            Images processed in RAM only · Never stored
          </span>
        </div>
      </motion.div>
    );
  }

  // Default: light background, landing page version
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className={`privacy-badge ${className}`}
    >
      <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--privacy-green)" }} />
      <div className="flex flex-col">
        <span className="leading-tight">Privacy Guarantee</span>
        <span className="font-normal opacity-70 text-[8.5px] leading-tight mt-0.5 tracking-wider">
          Images processed in RAM only · Never stored or sold
        </span>
      </div>
    </motion.div>
  );
}
