"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const BASE_NAV_LINKS = [
  { href: "/chat", label: "Chat" },
  { href: "/advisory", label: "Advisory" },
  { href: "/learning", label: "Learning" },
  { href: "/compute", label: "Compute" },
  { href: "/sources", label: "Source Library" },
];

export function MobileNav({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const navLinks = isSignedIn
    ? BASE_NAV_LINKS
    : [...BASE_NAV_LINKS, { href: "/sign-in", label: "Sign in" }];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle navigation menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line text-ink"
      >
        <span className="sr-only">Menu</span>
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
          <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-30 border-b border-line bg-paper shadow-sm">
          <nav className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b border-line/60 py-3 text-sm font-medium text-ink/80 last:border-b-0 hover:text-navy-950",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
