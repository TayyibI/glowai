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
      className={`rounded-none bg-alabaster border border-champagne/30 ${compact ? "p-8" : "p-12"} ${className}`}
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
      className={`font-serif uppercase tracking-widest text-charcoal ${className}`}
      style={{ fontSize: "18px" }}
    >
      {children}
    </h3>
  );
}
