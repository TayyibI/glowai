"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { ScanMotionGraphic } from "@/components/landing/ScanMotionGraphic";
import { ScanLine } from "lucide-react";
import { motion } from "framer-motion";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=80";

export default function LandingPage() {
  const router = useRouter();
  const { mounted } = useDeviceDetect();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-alabaster">
      {/* Full-viewport hero */}
      <section className="relative flex min-h-[100vh] flex-col items-center justify-center px-4 py-12 sm:px-6">
        <motion.div
          className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-none border border-champagne/30"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative aspect-[3/4] w-full">
            <ScanMotionGraphic />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-3xl font-serif uppercase tracking-widest text-charcoal sm:text-4xl">
            AI Skin &amp; Hair Analysis
          </h1>
          <p className="mt-2 text-charcoal/80 text-sm sm:text-base tracking-widest uppercase">
            Personalized insights. Clinical precision. Your device.
          </p>
        </motion.div>

        {/* CTA – visible on all devices */}
        {mounted && (
          <motion.div
            className="mt-8 w-full max-w-md px-4 pb-6 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button
              type="button"
              onClick={() => router.push("/scanner")}
              className="flex w-full items-center justify-center gap-2 bg-bordeaux text-white uppercase tracking-widest font-sans border border-bordeaux px-8 py-4 rounded-none hover:bg-transparent hover:text-bordeaux transition-all"
            >
              <ScanLine className="h-5 w-5" />
              START SKIN & HAIR SCAN
            </button>
          </motion.div>
        )}
      </section>
    </main>
  );
}
