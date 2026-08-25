import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import ProposalRenderer from "@/components/ProposalRenderer";
import SignatureCertificatePage from "@/components/sharing/SignatureCertificatePage";
import { db } from "@/lib/db/client";
import { getSharedProposal, isSharedProposalExpired, shareCookieName } from "@/lib/db/getSharedProposal";
import { proposalSignatures } from "@/lib/db/schema";

export default async function SharedProposalPrintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const record = await getSharedProposal(token); if (!record || isSharedProposalExpired(record.share.expiresAt)) notFound();
  if (record.share.accessKey) { const cookieStore = await cookies(); if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) notFound(); }
  const signatures = await db.select().from(proposalSignatures).where(eq(proposalSignatures.shareId, record.share.id));
  return <main className="bg-white"><ProposalRenderer data={record.revision.data} design={record.revision.design} />{signatures.length ? <div data-proposal-page data-proposal-section-type="signatureCertificate" style={{ breakAfter: "auto" }}><SignatureCertificatePage signatures={signatures} /></div> : null}</main>;
}
