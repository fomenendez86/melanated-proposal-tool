import type { ProposalSection } from "@/lib/types";

export type ProposalPageStatus = "ready" | "warning" | "error" | "hidden";

export interface ProposalPageMeta {
  id: string;
  pageNumber: number;
  type: ProposalSection["type"];
  eyebrow: string;
  title: string;
  description: string;
  status: ProposalPageStatus;
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
  }
}

export function buildProposalPageMeta(sections: ProposalSection[]): ProposalPageMeta[] {
  return sections.map((section, index) => ({
    id: `${section.type}-${index + 1}`,
    pageNumber: index + 1,
    type: section.type,
    status: "ready",
    ...pageCopy(section),
  }));
}
