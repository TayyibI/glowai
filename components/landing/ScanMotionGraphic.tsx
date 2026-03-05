"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BADGE_LABELS = [
  "Analyzing Texture...",
  "Checking Hydration...",
  "Mapping Melanin...",
];

export function ScanMotionGraphic() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      {/* Glowing horizontal laser line – Blush Pink with matching glow */}
      <motion.div
        className="absolute left-0 right-0 h-px w-full origin-center"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(244, 172, 183, 0.3) 20%, rgba(244, 172, 183, 0.95) 50%, rgba(244, 172, 183, 0.3) 80%, transparent 100%)",
          boxShadow:
            "0 0 20px rgba(244, 172, 183, 0.6), 0 0 40px rgba(244, 172, 183, 0.3)",
        }}
        animate={{ y: ["0%", "100%"] }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Futuristic facial tracking dots – SVG pulse */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {[
          [50, 30],
          [35, 38],
          [65, 38],
          [30, 52],
          [70, 52],
          [50, 58],
          [42, 68],
          [58, 68],
        ].map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="1.2"
            fill="rgba(255, 255, 255, 0.7)"
            stroke="rgba(244, 172, 183, 0.9)"
            strokeWidth="0.4"
            initial={{ opacity: 0.4, scale: 0.8 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.12,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Subtle target frame */}
      <motion.div
        className="absolute inset-[15%] rounded-full border border-blush/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          boxShadow: "inset 0 0 30px rgba(244, 172, 183, 0.2)",
        }}
      />

      {/* Floating UI badge – drifts and cycles text */}
      <motion.div
        className="absolute bottom-[18%] left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border border-nude/60 bg-white/90 px-4 py-2.5 backdrop-blur-glass text-sm font-medium text-brown shadow-glass"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="min-w-[180px] text-center">
          <CycleBadgeLabels labels={BADGE_LABELS} />
        </span>
      </motion.div>
    </div>
  );
}

function CycleBadgeLabels({ labels }: { labels: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % labels.length),
      2200
    );
    return () => clearInterval(id);
  }, [labels.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={labels[index]}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
        className="inline-block"
      >
        {labels[index]}
      </motion.span>
    </AnimatePresence>
  );
}
