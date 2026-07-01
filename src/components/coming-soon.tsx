import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-20">
          <Card className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
              Coming next
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-navy-950">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              {description}
            </p>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
