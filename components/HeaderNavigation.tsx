"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function HeaderNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 h-14 border-b border-dash-border/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-dash-text-primary no-underline"
        >
          <span className="text-xl font-bold tracking-tight text-dash-brand-blue">
            GlowAI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-dash-button px-3 py-2 text-sm font-medium text-dash-text-secondary transition hover:bg-dash-border/30 hover:text-dash-text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Search – minimal */}
        <div
          className={`hidden shrink-0 items-center gap-2 rounded-dash-input border border-transparent bg-transparent px-3 py-2 transition sm:flex ${searchFocused ? "border-dash-border bg-white shadow-dash-soft" : ""
            }`}
        >
          <svg
            className="h-4 w-4 text-dash-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search"
            aria-label="Search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-28 border-0 bg-transparent text-sm text-dash-text-primary placeholder:text-dash-text-tertiary focus:outline-none focus:ring-0"
          />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="rounded-dash-button p-2 text-dash-text-primary md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-dash-border bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Main mobile">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-dash-button px-3 py-2 text-sm font-medium text-dash-text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
