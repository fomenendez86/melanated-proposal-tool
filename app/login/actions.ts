"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { verifyLoginPassword } from "@/lib/auth/credentials";
import { clearAttempts, isRateLimited, rateLimitKeyFromHeaders, recordFailedAttempt } from "@/lib/auth/rateLimit";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

function safeRedirectTarget(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/proposals";
  return next;
}

export async function login(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectTarget(String(formData.get("next") ?? ""));
  const headerList = await headers();
  const rateLimitKey = rateLimitKeyFromHeaders(headerList, "login");

  if (isRateLimited(rateLimitKey)) {
    redirect(`/login?error=rate-limited&next=${encodeURIComponent(next)}`);
  }

  if (!verifyLoginPassword(password)) {
    recordFailedAttempt(rateLimitKey);
    redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);
  }
  clearAttempts(rateLimitKey);

  const secure = headerList.get("x-forwarded-proto") === "https";
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure,
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(next);
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
