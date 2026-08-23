import { createProposalShare } from "@/app/proposals/[id]/editor/shareActions";
import { hasValidSession } from "@/lib/auth/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasValidSession())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const proposalId = Number(id);
  const body = await request.json().catch(() => null) as { password?: string; expiresInDays?: number } | null;
  const result = await createProposalShare(proposalId, body ?? {});
  return Response.json(result, { status: result.ok ? 201 : 400 });
}
