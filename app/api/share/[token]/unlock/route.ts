import { scryptSync, timingSafeEqual } from "node:crypto";

import { getSharedProposal, shareCookieName } from "@/lib/db/getSharedProposal";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getSharedProposal(token);
  if (!record) return Response.json({ error: "Shared proposal not found." }, { status: 404 });
  const body = await request.json().catch(() => null) as { password?: string } | null;
  if (!record.settings.passwordHash || !record.settings.passwordSalt || !record.settings.accessKey) {
    return Response.json({ ok: true });
  }
  const candidate = scryptSync(body?.password ?? "", record.settings.passwordSalt, 32);
  const expected = Buffer.from(record.settings.passwordHash, "hex");
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json({ ok: true }, {
    headers: {
      "Set-Cookie": `${shareCookieName(token)}=${record.settings.accessKey}; Path=/share/${token}; HttpOnly; SameSite=Strict; Max-Age=86400${secure}`,
    },
  });
}
