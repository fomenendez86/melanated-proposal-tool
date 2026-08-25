import type { ProposalSection } from "@/lib/types";

export type ProposalPageStatus = "ready" | "warning" | "error" | "hidden";

export interface ProposalPageMeta {
  id: string;
  pageNumber: number;
  type: ProposalSection["type"];
  sourceSectionId?: number;
  sourceRefId?: number | null;
  eyebrow: string;
  title: string;
  description: string;
  status: ProposalPageStatus;
}

function pageStatus(section: ProposalSection): ProposalPageStatus {
  switch (section.type) {
    case "cover":
      if (!section.data.title.trim()) return "error";
      return section.data.imageUrl.trim() ? "ready" : "warning";
    case "fromOwners":
      return section.data.paragraphs.length > 0 ? "ready" : "error";
    case "details":
      return section.data.rows.some((row) => !row.value.trim()) ? "warning" : "ready";
    case "triangleDivider":
      if (section.data.titleLines.length === 0) return "error";
      return section.data.imageUrl.trim() ? "ready" : "warning";
    case "hotel":
      if (!section.data.name.trim() || !section.data.description.trim()) return "error";
      return Object.values(section.data.images).every((image) => image.trim()) ? "ready" : "warning";
    case "dayItinerary":
      return section.data.days.length > 0 ? "ready" : "error";
    case "sectionDivider":
      if (!section.data.title.trim()) return "error";
      return section.data.imageUrl.trim() ? "ready" : "warning";
    case "cityToursDivider":
      if (!section.data.city.trim() || !section.data.intro.trim()) return "error";
      return section.data.imageUrl.trim() ? "ready" : "warning";
    case "excursionList":
      return section.data.items.length > 0 ? "ready" : "error";
    case "twoColumnList":
      return section.data.leftColumn.length + section.data.rightColumn.length > 0 ? "ready" : "error";
    case "importantItems":
      return section.data.rows.length > 0 ? "ready" : "error";
    case "weather":
      return section.data.tables.length > 0 ? "ready" : "error";
    case "termsConditions":
      return section.data.sections.length > 0 ? "ready" : "error";
    case "thankYou":
      if (!section.data.message.trim()) return "error";
      return section.data.imageUrl.trim() ? "ready" : "warning";
    case "signature":
      return section.data.title.trim() && section.data.signers.length > 0 ? "ready" : "error";
    case "overview":
    case "pricing":
      return "ready";
    case "flightDetails":
      return section.data.legs.length > 0 ? "ready" : "warning";
    case "transportDetails":
      return section.data.legs.length > 0 ? "ready" : "warning";
  }
}

function pageCopy(
  section: ProposalSection
): Omit<ProposalPageMeta, "id" | "pageNumber" | "type" | "status"> {
  switch (section.type) {
    case "cover":
      return { eyebrow: "Opening", title: "Cover", description: section.data.subtitle || section.data.title };
    case "fromOwners":
      return { eyebrow: "Introduction", title: "From the Owners", description: `${section.data.paragraphs.length} introduction paragraphs` };
    case "details":
      return { eyebrow: "Trip setup", title: "Proposal Details", description: `${section.data.rows.length} client and trip details` };
    case "overview": {
      const days = section.data.days.map((day) => day.dayNumber);
      const range = days.length > 1 ? `Days ${days[0]}–${days.at(-1)}` : `Day ${days[0] ?? "—"}`;
      return { eyebrow: "Itinerary", title: "Trip Overview", description: range };
    }
    case "triangleDivider":
      return { eyebrow: section.data.sectionLabel, title: section.data.titleLines.map((line) => line.text).join(" "), description: "Visual section divider" };
    case "hotel":
      return { eyebrow: "Accommodation", title: section.data.name, description: `${section.data.roomCategory} · ${section.data.mealPlan}` };
    case "dayItinerary": {
      const days = section.data.days.map((day) => day.dayNumber);
      const range = days.length > 1 ? `Days ${days[0]}–${days.at(-1)}` : `Day ${days[0] ?? "—"}`;
      return { eyebrow: "Itinerary", title: range, description: "Day-by-day experience" };
    }
    case "sectionDivider":
      return { eyebrow: "Section", title: section.data.title, description: section.data.subtitle ?? "Visual section divider" };
    case "cityToursDivider":
      return { eyebrow: "Tours & excursions", title: section.data.city, description: "Destination introduction" };
    case "excursionList":
      return { eyebrow: "Tours & excursions", title: "Excursion Options", description: `${section.data.items.length} experiences on this page` };
    case "twoColumnList":
      return { eyebrow: "Trip details", title: section.data.title, description: `${section.data.leftColumn.length + section.data.rightColumn.length} content groups` };
    case "pricing":
      return { eyebrow: "Commercial", title: "Pricing & Payments", description: `${section.data.paymentSchedule.length} scheduled payments` };
    case "importantItems":
      return { eyebrow: "Travel preparation", title: "Important Items", description: `${section.data.rows.length} requirements` };
    case "weather":
      return { eyebrow: "Travel preparation", title: "Weather", description: `${section.data.tables.length} destination profiles` };
    case "termsConditions":
      return { eyebrow: "Legal", title: section.data.showTitle ? "Terms & Conditions" : "Terms continued", description: `${section.data.sections.length} terms sections` };
    case "thankYou":
      return { eyebrow: "Closing", title: "Thank You", description: section.data.message };
    case "signature":
      return { eyebrow: "Agreement", title: section.data.title, description: `${section.data.signers.length} signer${section.data.signers.length === 1 ? "" : "s"}` };
    case "flightDetails":
      return { eyebrow: "Logistics", title: "Flights", description: `${section.data.legs.length} flight leg${section.data.legs.length === 1 ? "" : "s"}` };
    case "transportDetails":
      return { eyebrow: "Logistics", title: "Ground Transportation", description: `${section.data.legs.length} leg${section.data.legs.length === 1 ? "" : "s"}` };
  }
}

export function buildProposalPageMeta(sections: ProposalSection[]): ProposalPageMeta[] {
  return sections.map((section, index) => ({
    id: `${section.type}-${index + 1}`,
    pageNumber: index + 1,
    type: section.type,
    sourceSectionId: section.editorSource?.sectionId,
    sourceRefId: section.editorSource?.refId,
    status: pageStatus(section),
    ...pageCopy(section),
  }));
}
