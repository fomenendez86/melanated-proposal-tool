import ProposalRenderer from "@/components/ProposalRenderer";
import { sampleProposalData } from "@/lib/sampleProposalData";

export default function FullProposalPreviewPage() {
  return (
    <div className="flex flex-col items-center bg-neutral-200">
      <ProposalRenderer data={sampleProposalData} />
    </div>
  );
}
