import type { CSSProperties, ReactNode } from "react";

import { renderMelanatedBlocksV1Section } from "@/components/renderers/melanatedBlocksV1";
import { renderMinimalGridV1Section } from "@/components/renderers/minimalGridV1";
import { getDefaultDocumentDesign } from "@/lib/designs/registry";
import type { DocumentDesignDescriptor } from "@/lib/designs/types";
import type { ProposalData, ProposalSection } from "@/lib/types";

/**
 * `rendererId → block-render function` routing table. Falls back to
 * `melanated-blocks-v1` for any unrecognized id — covers legacy
 * `proposal_revisions.design` snapshots and call sites that don't resolve a
 * design at all (`/preview/full-proposal`).
 */
const RENDERERS: Record<string, (section: ProposalSection) => ReactNode> = {
  "melanated-blocks-v1": renderMelanatedBlocksV1Section,
  "minimal-grid-v1": renderMinimalGridV1Section,
};

/** CSS custom properties so shared blocks (SectionHeader, PageFooter, ...)
 * can read the active design's brand colors instead of hardcoding one. */
function designStyle(design: DocumentDesignDescriptor): CSSProperties {
  return {
    "--design-primary": design.brand.primary,
    "--design-secondary": design.brand.secondary,
    "--design-accent": design.brand.accent,
  } as CSSProperties;
}

export function ProposalSectionView({ section, design = getDefaultDocumentDesign() }: { section: ProposalSection; design?: DocumentDesignDescriptor }) {
  const renderFn = RENDERERS[design.rendererId] ?? renderMelanatedBlocksV1Section;
  return <div style={designStyle(design)}>{renderFn(section)}</div>;
}

interface ProposalRendererProps {
  data: ProposalData;
  design?: DocumentDesignDescriptor;
}

export default function ProposalRenderer({ data, design }: ProposalRendererProps) {
  return (
    <>
      {data.sections.map((section, index) => (
        <div
          key={index}
          data-proposal-page
          data-proposal-page-number={index + 1}
          data-proposal-section-type={section.type}
          style={{
            breakAfter: index < data.sections.length - 1 ? "page" : "auto",
          }}
        >
          <ProposalSectionView section={section} design={design} />
        </div>
      ))}
    </>
  );
}
