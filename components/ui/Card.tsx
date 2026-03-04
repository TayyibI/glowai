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
      className={`rounded-dash-card bg-dash-surface shadow-dash-soft ${compact ? "p-5" : "p-6"} ${className}`}
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
      className={`text-lg font-bold text-dash-text-primary ${className}`}
      style={{ fontSize: "18px" }}
    >
      {children}
    </h3>
  );
}
