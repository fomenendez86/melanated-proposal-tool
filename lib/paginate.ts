import type {
  DayEntry,
  ExcursionItem,
  ExcursionListData,
  ItineraryDay,
  OverviewData,
  ProposalSection,
  TermsConditionsData,
  TermsSection,
} from "@/lib/types";

const LINE_HEIGHT = 20;

function estimateLines(text: string, charsPerLine: number): number {
  if (!text) return 1;
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

/** Greedily packs items into pages, each capped at `budget` px of estimated height. */
function packIntoPages<T>(
  items: T[],
  getHeight: (item: T) => number,
  gapBetweenItems: number,
  budget: number
): T[][] {
  const pages: T[][] = [];
  let currentPage: T[] = [];
  let currentHeight = 0;

  for (const item of items) {
    const itemHeight = getHeight(item);
    const withGap = currentPage.length > 0 ? gapBetweenItems : 0;
    const projected = currentHeight + withGap + itemHeight;

    if (projected > budget && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [item];
      currentHeight = itemHeight;
    } else {
      currentPage.push(item);
      currentHeight = projected;
    }
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

const OVERVIEW_PAGE_BUDGET = 840;
const OVERVIEW_DAY_GAP = 24;

function estimateDayHeight(day: ItineraryDay): number {
  const titleHeight = LINE_HEIGHT + 4; // "Day N: date" line + mt-1
  const activityHeight = day.activities.reduce((sum, activity) => {
    const text = `- ${activity.time ? `${activity.time}: ` : ""}${activity.description}`;
    return sum + estimateLines(text, 90) * LINE_HEIGHT;
  }, 0);
  const activityGaps = Math.max(0, day.activities.length - 1) * 2; // space-y-0.5
  return titleHeight + activityHeight + activityGaps;
}

export function paginateOverview(
  data: OverviewData,
  startPageNumber: number
): ProposalSection[] {
  const pages = packIntoPages(
    data.days,
    estimateDayHeight,
    OVERVIEW_DAY_GAP,
    OVERVIEW_PAGE_BUDGET
  );

  return pages.map((days, index) => ({
    type: "overview" as const,
    data: { days, pageNumber: startPageNumber + index },
  }));
}

// ---------------------------------------------------------------------------
// Excursion list
// ---------------------------------------------------------------------------

const EXCURSION_PAGE_BUDGET = 880;
const EXCURSION_ITEM_GAP = 51; // divider (3px) + my-6 (24px top + 24px bottom)
const EXCURSION_IMAGE_HEIGHT = 140;

function estimateExcursionItemHeight(item: ExcursionItem): number {
  const titleLines = estimateLines(item.title, 40);
  const descriptionLines = estimateLines(item.description, 45);
  const textColumnHeight = titleLines * LINE_HEIGHT + 8 + descriptionLines * LINE_HEIGHT;
  return Math.max(textColumnHeight, EXCURSION_IMAGE_HEIGHT);
}

export function paginateExcursionList(
  data: ExcursionListData,
  startPageNumber: number
): ProposalSection[] {
  const pages = packIntoPages(
    data.items,
    estimateExcursionItemHeight,
    EXCURSION_ITEM_GAP,
    EXCURSION_PAGE_BUDGET
  );

  return pages.map((items, index) => ({
    type: "excursionList" as const,
    data: { items, pageNumber: startPageNumber + index },
  }));
}

// ---------------------------------------------------------------------------
// Terms & conditions
// ---------------------------------------------------------------------------

const TERMS_NO_TITLE_BUDGET = 816;
const TERMS_WITH_TITLE_BUDGET = 736;
const TERMS_SECTION_GAP = 20;

function estimateTermsSectionHeight(section: TermsSection): number {
  const headingHeight = LINE_HEIGHT + 4; // heading + mt-1
  const paragraphHeights = section.paragraphs.map((paragraph) =>
    paragraph
      .split("\n")
      .reduce((sum, line) => sum + estimateLines(line, 90) * LINE_HEIGHT, 0)
  );
  const paragraphsTotal = paragraphHeights.reduce((a, b) => a + b, 0);
  const paragraphGaps = Math.max(0, section.paragraphs.length - 1) * 12; // space-y-3
  return headingHeight + paragraphsTotal + paragraphGaps;
}

export function paginateTermsConditions(
  data: TermsConditionsData,
  startPageNumber: number
): ProposalSection[] {
  const pages: TermsSection[][] = [];
  let currentPage: TermsSection[] = [];
  let currentHeight = 0;

  data.sections.forEach((section) => {
    const budget = pages.length === 0 && data.showTitle
      ? TERMS_WITH_TITLE_BUDGET
      : TERMS_NO_TITLE_BUDGET;
    const sectionHeight = estimateTermsSectionHeight(section);
    const withGap = currentPage.length > 0 ? TERMS_SECTION_GAP : 0;
    const projected = currentHeight + withGap + sectionHeight;

    if (projected > budget && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [section];
      currentHeight = sectionHeight;
    } else {
      currentPage.push(section);
      currentHeight = projected;
    }
  });
  if (currentPage.length > 0) pages.push(currentPage);

  return pages.map((sections, index) => ({
    type: "termsConditions" as const,
    data: {
      sections,
      pageNumber: startPageNumber + index,
      showTitle: Boolean(data.showTitle) && index === 0,
    },
  }));
}

// ---------------------------------------------------------------------------
// Day-by-day itinerary
// ---------------------------------------------------------------------------

/**
 * Mirrors the reference document's actual behavior: the first day gets its
 * own page (with the "Karibu Tanzania" sidebar), the rest are paired up two
 * per page, with a trailing solo page if the count is odd.
 */
export function paginateDayItinerary(
  days: DayEntry[],
  startPageNumber: number
): ProposalSection[] {
  if (days.length === 0) return [];

  const sections: ProposalSection[] = [
    {
      type: "dayItinerary",
      data: {
        days: [days[0]],
        pageNumber: startPageNumber,
        showWelcomeSidebar: true,
      },
    },
  ];

  const rest = days.slice(1);
  let pageNumber = startPageNumber + 1;
  for (let i = 0; i < rest.length; i += 2) {
    const pair = rest.slice(i, i + 2);
    sections.push({
      type: "dayItinerary",
      data: { days: pair, pageNumber },
    });
    pageNumber += 1;
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Renumbering
// ---------------------------------------------------------------------------

/**
 * Assigns sequential page numbers to an assembled section list, overriding
 * whatever each section (or paginate* helper) set individually. This is what
 * makes the document self-consistent regardless of how many pages any
 * paginated block ends up using — add, remove, or reorder sections freely
 * and the numbering always comes out right. Sections without a `pageNumber`
 * field (currently only "cover") are left untouched and don't consume a
 * number.
 */
export function renumberSections(
  sections: ProposalSection[],
  startAt: number
): ProposalSection[] {
  let counter = startAt;

  return sections.map((section) => {
    if (section.type === "cover") return section;

    const numbered = {
      ...section,
      data: { ...section.data, pageNumber: counter },
    } as ProposalSection;
    counter += 1;
    return numbered;
  });
}
