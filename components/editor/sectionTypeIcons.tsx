import { FileText, ImageSquare, Minus, PenNib, Heart } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import type { ProposalSectionType } from "@/lib/designs/types";

/**
 * Icon per addable template block type (see lib/editor/addableSections.ts).
 * Shared by the Blocks palette, the drag ghost, and InsertionGap's menu so
 * all three insertion surfaces use one consistent icon language.
 */
export const SECTION_TYPE_ICONS: Partial<Record<ProposalSectionType, Icon>> = {
  triangleDivider: ImageSquare,
  sectionDivider: Minus,
  thankYou: Heart,
  signature: PenNib,
};

export const DEFAULT_TEMPLATE_ICON: Icon = FileText;
