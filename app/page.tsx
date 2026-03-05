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
    <main className="relative min-h-screen overflow-x-hidden bg-ivory">
      {/* Full-viewport hero */}
      <section className="relative flex min-h-[100vh] flex-col items-center justify-center px-4 py-12 sm:px-6">
        <motion.div
          className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl shadow-blush-glow"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={HERO_IMAGE}
              alt="AI skin and hair analysis – premium beauty tech"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown/60 via-transparent to-brown/20" />
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
          <h1 className="text-3xl font-semibold tracking-tight text-brown sm:text-4xl">
            AI Skin &amp; Hair Analysis
          </h1>
          <p className="mt-2 text-brown/80 text-sm sm:text-base">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-nude bg-blush px-6 py-4 font-semibold text-white shadow-blush-glow backdrop-blur-glass transition hover:bg-blush/90 active:scale-[0.98]"
            >
              <ScanLine className="h-5 w-5" />
              Start Skin &amp; Hair Analysis
            </button>
          </motion.div>
        )}
      </section>
    </main>
  );
}
