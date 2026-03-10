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
    "rounded-none font-sans font-semibold transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-bordeaux disabled:opacity-50";
  const primary =
    "bg-bordeaux text-white border border-bordeaux hover:bg-transparent hover:text-bordeaux";
  const secondary =
    "border border-charcoal bg-transparent text-charcoal hover:bg-champagne/10";

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
