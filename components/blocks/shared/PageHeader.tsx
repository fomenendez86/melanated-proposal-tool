import BrandWordmark from "@/components/blocks/shared/BrandWordmark";

interface PageHeaderProps {
  variant?: "centered" | "proposalOnly";
}

export default function PageHeader({ variant = "centered" }: PageHeaderProps) {
  if (variant === "proposalOnly") {
    return (
      <div className="text-right text-[10px] font-sans uppercase tracking-wide">
        Proposal
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-end text-[10px] font-sans uppercase tracking-wide">
      <div className="absolute inset-x-0 text-center font-semibold">
        <BrandWordmark />
      </div>
      <div className="text-right">Proposal</div>
    </div>
  );
}
