import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-navy-950 text-paper/80">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold text-paper">The Tax Whisperer UK</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">
            Plain-English UK tax and pensions guidance, every claim traced back
            to a real source.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-paper">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/60">
            <li><Link href="/chat" className="hover:text-paper">Chat</Link></li>
            <li><Link href="/advisory" className="hover:text-paper">Advisory</Link></li>
            <li><Link href="/learning" className="hover:text-paper">Learning</Link></li>
            <li><Link href="/compute" className="hover:text-paper">Tax Computation</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-paper">Trust</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/60">
            <li><Link href="/sources" className="hover:text-paper">Source Library</Link></li>
            <li><Link href="/about" className="hover:text-paper">About</Link></li>
            <li><Link href="/changelog" className="hover:text-paper">Changelog</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-paper">Disclaimer</p>
          <p className="mt-3 text-sm leading-relaxed text-paper/60">
            The Tax Whisperer UK is an educational and informational tool. It is
            not a substitute for regulated financial, tax, or legal advice, and
            it is not a regulated financial adviser. Always have a qualified
            professional review anything before you file or rely on it.
          </p>
        </div>
      </Container>

      <div className="border-t border-white/10 py-6">
        <Container className="text-xs text-paper/40">
          © {new Date().getFullYear()} The Tax Whisperer UK.
        </Container>
      </div>
    </footer>
  );
}
