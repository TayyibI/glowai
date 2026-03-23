"use client";

import { usePathname } from "next/navigation";
import { HeaderNavigation } from "@/components/HeaderNavigation";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLanding = pathname === "/";

    useEffect(() => {
        if (isLanding) {
            document.body.classList.remove("bg-alabaster", "text-charcoal");
            document.body.classList.add("bg-[#0a0a0a]", "text-[#f5f2ee]");
        } else {
            document.body.classList.remove("bg-[#0a0a0a]", "text-[#f5f2ee]");
            document.body.classList.add("bg-alabaster", "text-charcoal");
        }
    }, [isLanding]);

    if (isLanding) {
        return <div className="min-h-screen w-full font-sans antialiased">{children}</div>;
    }

    return (
        <>
            <HeaderNavigation />
            <div className="min-h-[calc(100vh-56px)]">{children}</div>
            <Footer />
        </>
    );
}
