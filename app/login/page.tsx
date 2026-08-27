import { Check, FileText, Key, Sparkle } from "@phosphor-icons/react/ssr";

import { EditorNotice, editorFocusRing } from "@/components/editor/EditorUi";

import { login } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Incorrect password.",
  "rate-limited": "Too many attempts. Try again in a few minutes.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Sign-in failed.") : null;

  return (
    <main className="grid min-h-dvh w-full bg-editor-panel font-editor md:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-[620px] overflow-hidden bg-editor-text-strong p-10 text-white md:flex md:flex-col">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-editor-brand/45 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-editor-md bg-editor-accent text-white shadow-lg">
            <Sparkle className="size-5" weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Melanated Safaris</p>
            <p className="text-xs text-white/55">Proposal Studio</p>
          </div>
        </div>
        <div className="relative my-auto max-w-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-editor-accent">Design. Personalize. Send.</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.04em]">Every client journey, beautifully presented.</h1>
          <p className="mt-5 text-sm leading-6 text-white/65">Build polished travel proposals from one focused workspace.</p>
          <div className="mt-8 space-y-3 text-sm text-white/80">
            <p className="flex items-center gap-2"><Check className="size-4 text-editor-accent" weight="duotone" aria-hidden="true" /> Visual document editing</p>
            <p className="flex items-center gap-2"><Check className="size-4 text-editor-accent" weight="duotone" aria-hidden="true" /> Reusable itineraries and templates</p>
            <p className="flex items-center gap-2"><Check className="size-4 text-editor-accent" weight="duotone" aria-hidden="true" /> Client sharing, pricing, and approval</p>
          </div>
        </div>
        <p className="relative text-xs text-white/40">Private workspace · Authorized access only</p>
      </section>

      <section className="flex min-h-dvh items-center justify-center p-6 sm:min-h-[620px] sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <span className="grid size-11 place-items-center rounded-editor-md bg-editor-text-strong text-white"><FileText className="size-5" weight="duotone" aria-hidden="true" /></span>
            <div><p className="font-semibold text-editor-text-strong">Proposal Studio</p><p className="text-xs text-editor-text-muted">Melanated Safaris</p></div>
          </div>
          <span className="grid size-10 place-items-center rounded-editor-md bg-editor-inset text-editor-brand">
            <Key className="size-5" weight="duotone" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em] text-editor-text-strong">Welcome back</h2>
          <p className="mt-2 text-sm leading-5 text-editor-text-muted">Enter your workspace password to continue.</p>

          <form action={login} className="mt-7 space-y-4">
            <input type="hidden" name="next" value={next ?? ""} />
            <label className="block text-xs font-semibold text-editor-text">
              Password
              <input
                type="password"
                name="password"
                required
                autoFocus
                className={`mt-2 h-12 w-full rounded-editor-md border border-editor-border bg-editor-raised px-3 text-sm shadow-sm ${editorFocusRing}`}
              />
            </label>
            {errorMessage ? (
              <div role="alert">
                <EditorNotice tone="danger" className="px-3 py-2 text-xs">
                  {errorMessage}
                </EditorNotice>
              </div>
            ) : null}
            <button
              type="submit"
              className={`h-12 w-full rounded-editor-md bg-editor-brand text-sm font-semibold text-white shadow-sm transition hover:bg-editor-brand-hover ${editorFocusRing}`}
            >
              Sign in to Proposal Studio
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
