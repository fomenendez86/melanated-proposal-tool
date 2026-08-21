interface PageFooterProps {
  pageNumber: number;
}

export default function PageFooter({ pageNumber }: PageFooterProps) {
  return (
    <div className="absolute bottom-8 right-[82px] text-xs text-neutral-600">
      {pageNumber.toString().padStart(2, "0")}
    </div>
  );
}
