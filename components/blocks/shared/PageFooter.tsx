interface PageFooterProps {
  pageNumber: number;
}

export default function PageFooter({ pageNumber }: PageFooterProps) {
  return (
    <div className="absolute bottom-8 right-[82px] text-xs text-[var(--design-secondary,#566b4d)]">
      {pageNumber.toString().padStart(2, "0")}
    </div>
  );
}
