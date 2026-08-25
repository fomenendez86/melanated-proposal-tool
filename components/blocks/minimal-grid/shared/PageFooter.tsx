interface PageFooterProps {
  pageNumber: number;
}

/**
 * A hairline rule spanning the content width with the page number
 * right-aligned beneath it — Safari Editorial's footer is a bare number,
 * bottom-right, no rule (components/blocks/shared/PageFooter.tsx).
 */
export default function PageFooter({ pageNumber }: PageFooterProps) {
  return (
    <div className="absolute inset-x-[82px] bottom-10 border-t border-[var(--design-secondary,#68727d)]/25 pt-3 text-right text-[10px] font-semibold tracking-[0.2em] text-[var(--design-secondary,#68727d)]">
      {pageNumber.toString().padStart(2, "0")}
    </div>
  );
}
