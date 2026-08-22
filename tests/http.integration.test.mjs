import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";

test("editor, PDF, immutable share, password, and approval flows", async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).database, "reachable");

  const editor = await fetch(`${baseUrl}/proposals/1/editor`);
  assert.equal(editor.status, 200);

  const pdf = await fetch(`${baseUrl}/api/proposals/1/pdf`);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("content-type"), "application/pdf");
  assert.equal(pdf.headers.get("x-proposal-overflow-pages"), "");
  assert.ok(Number(pdf.headers.get("x-proposal-pages")) >= 1);
  assert.ok((await pdf.arrayBuffer()).byteLength > 100_000);

  const shareResponse = await fetch(`${baseUrl}/api/proposals/1/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
