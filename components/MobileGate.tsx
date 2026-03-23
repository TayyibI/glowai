"use client";

import { useState, useEffect } from "react";

export function MobileGate({ children }: { children: React.ReactNode }) {
    const [isMobile, setIsMobile] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    if (!mounted) {
        // Render children during SSR to prevent hydration errors and allow SEO.
        // The client will take over and hide it immediately if on desktop.
        return <>{children}</>;
    }

    if (!isMobile) {
        return (
            <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-alabaster text-charcoal p-6 text-center">
                <h1 className="font-playfair text-4xl font-semibold tracking-tight text-charcoal mb-4">
                    GlowAI is designed for mobile.
                </h1>
                <p className="text-xl text-charcoal/80">
                    Open this link on your phone for the full experience.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
