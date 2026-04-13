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
    "rounded-full font-sans font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-unilever-blue focus:ring-offset-2 disabled:opacity-50 px-8 py-4 flex items-center justify-center";
  const primary =
    "bg-unilever-blue text-white shadow-md hover:bg-[#001A45] hover:shadow-lg border border-transparent";
  const secondary =
    "border-2 border-unilever-blue bg-transparent text-unilever-blue hover:bg-ponds-blush/20 shadow-sm";

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
