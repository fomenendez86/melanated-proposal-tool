import { KeyRound } from "lucide-react";

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
    <main className="grid min-h-screen place-items-center bg-editor-shell px-4">
      <div className="w-full max-w-sm rounded-2xl border border-editor-border bg-editor-panel p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-editor-brand">
          <KeyRound className="size-5" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-editor-text-strong">Proposal Studio</h1>
        </div>
        <p className="mt-1 text-sm leading-5 text-editor-text-muted">Sign in to continue.</p>

        <form action={login} className="mt-5 space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <label className="block text-xs font-semibold text-editor-text">
            Password
            <input
              type="password"
              name="password"
              required
              autoFocus
              className={`mt-1.5 h-11 w-full rounded-lg border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`}
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
            className={`h-11 w-full rounded-xl bg-editor-brand text-sm font-semibold text-white transition hover:bg-editor-brand-hover ${editorFocusRing}`}
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
