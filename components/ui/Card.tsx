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
      className={`rounded-card bg-white shadow-card border border-nude/40 ${compact ? "p-5" : "p-6"} ${className}`}
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
      className={`text-lg font-bold text-brown ${className}`}
      style={{ fontSize: "18px" }}
    >
      {children}
    </h3>
  );
}
