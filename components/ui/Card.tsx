"use client";

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function Card({ children, className = "", compact }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-clinical-white shadow-soft border border-black/[0.04] ${compact ? "p-8" : "p-12"} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <h3
      className={`font-sans font-bold text-unilever-blue ${className}`}
      style={{ fontSize: "18px" }}
    >
      {children}
    </h3>
  );
}
