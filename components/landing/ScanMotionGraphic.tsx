"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const BADGE_LABELS = [
  "Analyzing Texture...",
  "Checking Hydration...",
  "Mapping Melanin...",
];

export function ScanMotionGraphic() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-unilever-blue/20 bg-clinical-white">

      {/* 1. Your model photo */}
      <Image
        src="/images/scanner-model.jpg"
        alt="Facial Scan Model"
        fill
        quality={100}
        className="object-cover"
        priority
      />

      {/* 2. YOUR EXACT SVG MESH – now separate, fully controllable, and enhanced */}
      {/* Save the entire <svg>...</svg> you sent as: public/images/hero-mesh.svg */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10"
        style={{ transform: "translateY(+1%)" }}   // moved UP
      >
        <motion.img
          src="/images/hero-mesh.svg"
          alt="Champagne Mesh"
          className="w-[78%] md:w-[48%] pointer-events-none"   // bigger
          style={{
            mixBlendMode: "screen",
            filter: "drop-shadow(0 0 25px rgba(0, 229, 255, 0.4))",
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.72, 0.96, 0.72],
            scale: [0.96, 1.04, 0.96],
          }}
          transition={{
            duration: 4.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* 3. Sweeping Champagne Laser (stronger glow) */}
      <motion.div
        className="absolute left-0 right-0 h-[2.5px] w-full bg-scanner-cyan z-20"
        style={{ boxShadow: "0 0 20px 4px rgba(0, 229, 255, 0.7)" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{
          duration: 2.35,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
      />

      {/* 4. Floating UI badge */}
      <motion.div
        className="absolute bottom-[8%] right-[2%] flex w-max -translate-x-1/2 items-center justify-center rounded-2xl border border-unilever-blue/20 bg-clinical-white/90 backdrop-blur-sm px-6 py-3 text-xs font-bold uppercase tracking-tight text-unilever-blue z-30"
        animate={{ y: [0, -7, 0] }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="min-w-[150px] text-center">
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
      2100
    );
    return () => clearInterval(id);
  }, [labels.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={labels[index]}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="inline-block"
      >
        {labels[index]}
      </motion.span>
    </AnimatePresence>
  );
}