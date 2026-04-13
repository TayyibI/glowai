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
      className="sticky top-0 z-40 h-16 border-b border-unilever-blue/20 bg-clinical-white/95 backdrop-blur supports-[backdrop-filter]:bg-clinical-white/80"
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-unilever-blue no-underline"
        >
          <span className="text-2xl font-sans uppercase tracking-tight text-unilever-blue">
            GlowAI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl px-4 py-2 text-sm font-medium text-unilever-blue/80 transition uppercase tracking-tight hover:bg-ponds-blush/10 hover:text-unilever-blue"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Search – minimal */}
        <div
          className={`hidden shrink-0 items-center gap-2 rounded-2xl border border-transparent bg-transparent px-3 py-2 transition sm:flex ${searchFocused ? "border-unilever-blue bg-clinical-white" : ""
            }`}
        >
          <svg
            className="h-4 w-4 text-unilever-blue/50"
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
            className="w-28 border-0 bg-transparent text-sm text-unilever-blue placeholder:text-unilever-blue/50 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="rounded-2xl p-2 text-unilever-blue md:hidden"
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
        <div className="border-t border-unilever-blue/20 bg-clinical-white px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Main mobile">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl px-4 py-3 text-sm font-medium uppercase tracking-tight text-unilever-blue hover:bg-ponds-blush/10 transition-colors"
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
