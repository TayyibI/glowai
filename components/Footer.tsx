"use client";

import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#help" },
      { label: "Status", href: "#status" },
    ],
  },

];

const LEGAL = [
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms of Service", href: "#terms" },
  { label: "Cookie Policy", href: "#cookies" },
];

export function Footer() {
  return (
    <footer className="border-t border-dash-border bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-dash-brand-blue">
              GlowAI
            </Link>
            <p className="mt-3 text-sm text-dash-text-secondary">
              AI-powered beauty and wellness insights for everyone, everywhere.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="#linkedin"
                className="text-dash-text-tertiary transition hover:text-dash-brand-blue"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="#twitter"
                className="text-dash-text-tertiary transition hover:text-dash-brand-blue"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-dash-text-primary">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-dash-text-secondary transition hover:text-dash-text-link"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar: legal + copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-dash-border pt-8 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {LEGAL.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-dash-text-tertiary transition hover:text-dash-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-sm text-dash-text-tertiary">
            © {new Date().getFullYear()} GlowAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
