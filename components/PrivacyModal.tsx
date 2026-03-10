"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "glow-ai-privacy-accepted";

export function getPrivacyAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setPrivacyAccepted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // ignore
  }
}

interface PrivacyModalProps {
  onAccept: () => void;
  accepted: boolean;
}

export function PrivacyModal({ onAccept, accepted }: PrivacyModalProps) {
  const handleAccept = useCallback(() => {
    setPrivacyAccepted();
    onAccept();
  }, [onAccept]);

  if (accepted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
    >
      <div className="max-w-md rounded-none bg-alabaster p-8 border border-charcoal/20">
        <h2 id="privacy-title" className="font-serif text-2xl uppercase tracking-widest text-charcoal mb-4">
          Privacy &amp; Camera
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
          GlowAI uses your camera or photo uploads only to analyze your skin and hair
          and recommend products. We do not store any of your pictures on our servers
          or reuse them for other purposes. Analysis may be processed by our partners
          to provide results. By continuing, you agree to this use.
        </p>
        <Button
          variant="primary"
          fullWidth
          className="mt-8 py-4"
          onClick={handleAccept}
        >
          I understand, continue
        </Button>
      </div>
    </div>
  );
}
