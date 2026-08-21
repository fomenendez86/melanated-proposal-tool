import ProposalRenderer from "@/components/ProposalRenderer";
import { getProposalData } from "@/lib/db/getProposalData";

export default async function FullProposalPreviewPage() {
  const data = await getProposalData(1);

  return (
    <div className="flex flex-col items-center bg-neutral-200">
      <ProposalRenderer data={data} />
    </div>
  );
}
