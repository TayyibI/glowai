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
    "rounded-btn font-semibold transition focus:outline-none focus:ring-2 focus:ring-blush focus:ring-offset-2 disabled:opacity-50";
  const primary =
    "bg-blush text-white hover:bg-blush/90 active:opacity-95";
  const secondary =
    "border border-nude bg-transparent text-brown hover:bg-nude/40";

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
