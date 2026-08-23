import assert from "node:assert/strict";
import test from "node:test";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // Missing in CI/prod where STUDIO_AUTH_PASSWORD is already set in the env.
}

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function studioLoginCookie() {
  // A no-JS <form action={serverAction}> submission still needs the hidden
  // $ACTION_ID_* field React embeds in the rendered HTML to identify which
  // action to run — scrape it rather than hardcoding it, since it's
  // content-addressed and changes whenever the action's source changes.
  const loginPage = await fetch(`${baseUrl}/login`);
  const html = await loginPage.text();
  const actionIdMatch = html.match(/name="(\$ACTION_ID_[a-f0-9]+)"/);
  assert.ok(actionIdMatch, "could not find the login form's action id");

  const loginForm = new FormData();
  loginForm.set(actionIdMatch[1], "");
  loginForm.set("password", process.env.STUDIO_AUTH_PASSWORD ?? "");
  loginForm.set("next", "");
  const response = await fetch(`${baseUrl}/login`, { method: "POST", body: loginForm, redirect: "manual" });
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, "login did not set a session cookie");
  return cookie.split(";")[0];
}

test("editor, PDF, immutable share, password, and approval flows", async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).database, "reachable");

  const sessionCookie = await studioLoginCookie();
  const authHeaders = { Cookie: sessionCookie };

  const editor = await fetch(`${baseUrl}/proposals/1/editor`, { headers: authHeaders });
  assert.equal(editor.status, 200);

  const pdf = await fetch(`${baseUrl}/api/proposals/1/pdf`, { headers: authHeaders });
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("content-type"), "application/pdf");
  assert.equal(pdf.headers.get("x-proposal-overflow-pages"), "");
  assert.ok(Number(pdf.headers.get("x-proposal-pages")) >= 1);
  assert.ok((await pdf.arrayBuffer()).byteLength > 100_000);

  const shareResponse = await fetch(`${baseUrl}/api/proposals/1/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ expiresInDays: 7, password: "Integration2026" }),
  });
  assert.equal(shareResponse.status, 201);
  const share = await shareResponse.json();
  assert.match(share.path, /^\/share\/[a-f0-9]{48}$/);
  const token = share.path.split("/").at(-1);

  const locked = await fetch(`${baseUrl}${share.path}`);
  assert.match(await locked.text(), /Private proposal/);
  const badUnlock = await fetch(`${baseUrl}/api/share/${token}/unlock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "wrongpass" }) });
  assert.equal(badUnlock.status, 401);
  const unlock = await fetch(`${baseUrl}/api/share/${token}/unlock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "Integration2026" }) });
  assert.equal(unlock.status, 200);
  const cookie = unlock.headers.get("set-cookie");
  assert.ok(cookie);
  const visible = await fetch(`${baseUrl}${share.path}`, { headers: { Cookie: cookie.split(";")[0] } });
  assert.match(await visible.text(), /Approve this proposal/);
  const approval = await fetch(`${baseUrl}/api/share/${token}/approve`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie.split(";")[0] }, body: JSON.stringify({ name: "Integration QA", email: "qa@example.com" }) });
  assert.equal(approval.status, 200);
});
