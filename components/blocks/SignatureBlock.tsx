import PageFooter from "@/components/blocks/shared/PageFooter";
import PageHeader from "@/components/blocks/shared/PageHeader";
import SectionHeader from "@/components/blocks/shared/SectionHeader";
import { editableRegion } from "@/lib/editor/editableRegions";
import type { SignatureData } from "@/lib/types";

export default function SignatureBlock({ data }: { data: SignatureData }) {
  return <div className="relative box-border h-[1056px] w-[816px] bg-white px-[82px] py-12 text-[var(--design-primary,#1c202b)]"><PageHeader /><div className="mt-8"><SectionHeader title="Agreement" /></div><h1 {...editableRegion("signatureTitle")} className="mt-12 text-center text-3xl font-bold uppercase tracking-widest">{data.title}</h1><p {...editableRegion("signatureMessage", "multiline")} className="mx-auto mt-6 max-w-xl text-center text-sm leading-7 text-[var(--design-primary,#1c202b)]/70">{data.message}</p><div {...editableRegion("signatureSignersText", "collection")} className="mt-20 grid gap-x-12 gap-y-20 sm:grid-cols-2">{data.signers.map((signer, index) => <div key={`${signer.name}-${index}`}><div className="h-16 border-b border-[var(--design-primary,#1c202b)]"/><p className="mt-3 font-semibold">{signer.name}</p><p className="mt-1 text-xs uppercase tracking-widest text-[var(--design-primary,#1c202b)]/55">{signer.role}</p><p className="mt-5 border-b border-[var(--design-primary,#1c202b)] pb-1 text-xs text-[var(--design-primary,#1c202b)]/45">Date</p></div>)}</div><PageFooter pageNumber={data.pageNumber} /></div>;
}
