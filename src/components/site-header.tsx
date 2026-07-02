import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";

const NAV_LINKS = [
  { href: "/chat", label: "Chat" },
  { href: "/advisory", label: "Advisory" },
  { href: "/learning", label: "Learning" },
  { href: "/compute", label: "Compute" },
  { href: "/sources", label: "Source Library" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="relative flex h-16 items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold text-navy-950"
          >
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
            <span className="text-sm sm:text-base">
              The Tax Whisperer<span className="text-accent-dark"> UK</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/80 hover:text-navy-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LinkButton href="/sign-in" variant="ghost" className="hidden lg:inline-flex">
            Sign in
          </LinkButton>
          <LinkButton
            href="/chat"
            variant="primary"
            className="whitespace-nowrap px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <span className="sm:hidden">Try free</span>
            <span className="hidden sm:inline">Try Chat free</span>
          </LinkButton>
        </div>
      </Container>
    </header>
  );
}
