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
      className="sticky top-0 z-40 h-16 border-b border-charcoal/20 bg-alabaster/95 backdrop-blur supports-[backdrop-filter]:bg-alabaster/80"
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-charcoal no-underline"
        >
          <span className="text-2xl font-serif uppercase tracking-widest text-charcoal">
            GlowAI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-none px-4 py-2 text-sm font-medium text-charcoal/80 transition uppercase tracking-widest hover:bg-champagne/10 hover:text-charcoal"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Search – minimal */}
        <div
          className={`hidden shrink-0 items-center gap-2 rounded-none border border-transparent bg-transparent px-3 py-2 transition sm:flex ${searchFocused ? "border-charcoal bg-alabaster" : ""
            }`}
        >
          <svg
            className="h-4 w-4 text-charcoal/50"
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
            className="w-28 border-0 bg-transparent text-sm text-charcoal placeholder:text-charcoal/50 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="rounded-none p-2 text-charcoal md:hidden"
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
        <div className="border-t border-charcoal/20 bg-alabaster px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Main mobile">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-none px-4 py-3 text-sm font-medium uppercase tracking-widest text-charcoal hover:bg-champagne/10 transition-colors"
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
