import PageFooter from "@/components/blocks/minimal-grid/shared/PageFooter";
import PageHeader from "@/components/blocks/minimal-grid/shared/PageHeader";
import SectionHeader from "@/components/blocks/minimal-grid/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { SignatureData } from "@/lib/types";

export default function SignatureBlock({ data }: { data: SignatureData }) {
  return (
    <div className="relative box-border h-[1056px] w-[816px] bg-[#f7f5f0] px-[82px] py-12 text-[var(--design-primary,#20252b)]">
      <PageHeader />
      <div className="mt-8">
        <SectionHeader title="Agreement" />
      </div>
      <h1 {...editableRegion("signatureTitle")} className="mt-10 text-2xl font-bold uppercase tracking-tight">{data.title}</h1>
      <p {...editableRegion("signatureMessage", "multiline")} className="mt-4 max-w-xl text-sm leading-6 text-[var(--design-secondary,#68727d)]">{data.message}</p>
      <div {...editableRegion("signatureSignersText", "collection")} className="mt-16 grid gap-x-12 gap-y-16 sm:grid-cols-2">
        {data.signers.map((signer, index) => (
          <div key={`${signer.name}-${index}`}>
            <div className="h-14 border-b border-[var(--design-secondary,#68727d)]/40" />
            <p className="mt-3 font-semibold">{signer.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.15em] text-[var(--design-secondary,#68727d)]">{signer.role}</p>
            <p className="mt-5 border-b border-[var(--design-secondary,#68727d)]/40 pb-1 text-xs text-[var(--design-secondary,#68727d)]">Date</p>
          </div>
        ))}
      </div>
      <PageFooter pageNumber={data.pageNumber} />
    </div>
  );
}
