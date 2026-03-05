"use client";

import { useState, useEffect } from "react";

/**
 * Detects if the user is on a mobile device (phone/tablet) for camera-based flows.
 * Uses matchMedia for "pointer: coarse" and "max-width: 768px" so that
 * desktop/laptop users see the QR code and mobile users see the Start Scan CTA.
 */
export function useDeviceDetect(): { isMobile: boolean; mounted: boolean } {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");

    const update = () => {
      // Consider mobile if small viewport or touch-primary device
      setIsMobile(mediaQuery.matches || coarsePointer.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);
    coarsePointer.addEventListener("change", update);
    return () => {
      mediaQuery.removeEventListener("change", update);
      coarsePointer.removeEventListener("change", update);
    };
  }, []);

  return { isMobile, mounted };
}
