import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ProposalSectionView } from "@/components/ProposalRenderer";
import ResponsiveProposalDocument from "@/components/sharing/ResponsiveProposalDocument";
import ShareComments from "@/components/sharing/ShareComments";
import SharePricingConfigurator from "@/components/sharing/SharePricingConfigurator";
import ShareSignature from "@/components/sharing/ShareSignature";
import { ShareApproval, SharePasswordForm } from "@/components/sharing/ShareClientActions";
import { getSharedProposal, isSharedProposalExpired, recordShareEvent, shareCookieName } from "@/lib/db/getSharedProposal";
import { getShareCommentThreads } from "@/lib/db/getShareComments";
import { getSharedPricingState } from "@/lib/db/getSharedPricing";
import { db } from "@/lib/db/client";
import { proposalSignatures } from "@/lib/db/schema";
import { buildProposalPageMeta } from "@/lib/editor/proposalPageMeta";
import { eq } from "drizzle-orm";

export default async function SharedProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await getSharedProposal(token);
  if (!record) notFound();
  if (isSharedProposalExpired(record.share.expiresAt)) {
    return <main className="grid min-h-dvh place-items-center bg-stone-100 p-5 text-center"><div><h1 className="text-3xl font-semibold">This proposal has expired</h1><p className="mt-3 text-stone-600">Contact your travel advisor for an updated proposal.</p></div></main>;
  }
  if (record.share.accessKey) {
    const cookieStore = await cookies();
    if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) return <SharePasswordForm token={token} />;
  }
  await recordShareEvent(record.share.proposalId, record.share.id, "opened");
  const pricingState = await getSharedPricingState(record.share.id, record.revision.data);
  const signatureSection = record.revision.data.sections.find((section) => section.type === "signature");
  const existingSignatures = signatureSection ? await db.select({ id: proposalSignatures.id }).from(proposalSignatures).where(eq(proposalSignatures.shareId, record.share.id)) : [];
  const commentThreads = await getShareCommentThreads(record.share.id);
  const commentSections = buildProposalPageMeta(record.revision.data.sections).map((page) => ({ sectionKey: page.id, title: page.title }));
  const pages = record.revision.data.sections.map((section, index) => <ProposalSectionView key={`${section.type}-${index}`} section={section} design={record.revision.design} />);
  return <main className="min-h-dvh bg-stone-200"><header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-black/10 bg-white/95 px-4 backdrop-blur sm:px-8"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Melanated Safaris</p><h1 className="text-sm font-semibold text-stone-900 sm:text-base">Your travel proposal</h1></div><p className="text-xs text-stone-500">Shared {record.share.createdAt.toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })}</p></header><ResponsiveProposalDocument pages={pages} width={record.revision.design.page.widthPx} height={record.revision.design.page.heightPx} trackingToken={token} pageLabels={record.revision.data.sections.map((section) => section.type)}/>{pricingState && pricingState.items.some((item) => item.optional) ? <SharePricingConfigurator token={token} initial={pricingState} /> : null}{signatureSection && signatureSection.type === "signature" ? <ShareSignature token={token} roles={signatureSection.data.signers.map((signer) => signer.role)} alreadySigned={existingSignatures.length > 0} /> : <ShareApproval token={token}/>}<ShareComments token={token} sections={commentSections} initialThreads={commentThreads} /><footer className="py-8 text-center text-xs text-stone-500">This approval applies to the revision shared on {record.revision.createdAt.toLocaleDateString()}.</footer></main>;
}
