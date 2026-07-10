import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { signIn } from "@/lib/auth";

const PROVIDERS = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
] as const;

const ERROR_COPY: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already linked to a different sign-in method. Try the provider you used originally.",
  AccessDenied: "Sign-in was cancelled or denied. You can try again any time.",
  Configuration:
    "Sign-in isn't configured yet in this environment — try again shortly.",
  Default: "Something went wrong signing you in. Please try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const errorMessage = error ? ERROR_COPY[error] ?? ERROR_COPY.Default : null;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center py-16">
        <Container className="flex justify-center">
          <Card className="w-full max-w-md">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
                Welcome back
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-navy-950">
                Sign in to The Tax Whisperer UK
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                Saved chat history, cited Advisory answers, and Learning
                progress — synced wherever you sign in.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {errorMessage}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {PROVIDERS.map((provider) => (
                <form
                  key={provider.id}
                  action={async () => {
                    "use server";
                    await signIn(provider.id, {
                      redirectTo: callbackUrl ?? "/",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper-muted"
                  >
                    {provider.label}
                  </button>
                </form>
              ))}
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-ink/50">
              No passwords, ever — we only support sign-in via Google or
              GitHub. By continuing you agree this is an educational tool,
              not regulated financial or legal advice.
            </p>

            <p className="mt-4 text-center text-sm text-ink/70">
              Not ready to sign in?{" "}
              <a href="/chat" className="font-medium text-accent-dark hover:underline">
                Continue as a guest
              </a>{" "}
              — you can chat right away and sign in later to save it.
            </p>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
