"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  fullWidth,
  ...props
}: ButtonProps) {
  const base =
    "rounded-dash-button font-semibold transition focus:outline-none focus:ring-2 focus:ring-dash-brand-blue focus:ring-offset-2 disabled:opacity-50";
  const primary =
    "bg-dash-brand-blue text-white hover:opacity-90 active:opacity-95";
  const secondary =
    "border border-dash-border bg-transparent text-dash-text-primary hover:bg-dash-border/30";

  return (
    <button
      type="button"
      className={`${base} ${variant === "primary" ? primary : secondary} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
