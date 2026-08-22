export interface ItineraryDraftActivity {
  timeRange: string;
  description: string;
}

export interface ItineraryDraftDay {
  dayNumber: number;
  date: string;
  subtitle: string;
  highlightLine: string;
  activities: ItineraryDraftActivity[];
  paragraphs: string[];
  images: string[];
}

function validImageUrl(value: string) {
  return !value || value.startsWith("/") || /^https:\/\//i.test(value);
}

export function parseItineraryEditorText(text: string): ItineraryDraftDay[] | null {
  const days: ItineraryDraftDay[] = [];
  let current: ItineraryDraftDay | null = null;

  const finish = () => {
    if (!current) return true;
    if (current.activities.length === 0 || current.paragraphs.length === 0) return false;
    days.push(current);
    current = null;
    return true;
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^\[Day\s+(\d+)]$/i)?.[1];
    if (heading) {
      if (!finish()) return null;
      current = {
        dayNumber: Number(heading),
        date: "",
        subtitle: "",
        highlightLine: "",
        activities: [],
        paragraphs: [],
        images: [],
      };
      continue;
    }
    if (!current) return null;
    if (line.startsWith("Date:")) current.date = line.slice(5).trim();
    else if (line.startsWith("Subtitle:")) current.subtitle = line.slice(9).trim();
    else if (line.startsWith("Highlight:")) current.highlightLine = line.slice(10).trim();
    else if (line.startsWith("Activity:")) {
      const activity = line.slice(9).trim();
      const separator = activity.indexOf("|");
      if (separator < 0) return null;
      const timeRange = activity.slice(0, separator).trim();
      const description = activity.slice(separator + 1).trim();
      if (!description) return null;
      current.activities.push({ timeRange, description });
    } else if (line.startsWith("Paragraph:")) {
      const paragraph = line.slice(10).trim();
      if (!paragraph) return null;
      current.paragraphs.push(paragraph);
    } else if (line.startsWith("Image:")) {
      const imageUrl = line.slice(6).trim();
      if (!imageUrl || !validImageUrl(imageUrl)) return null;
      current.images.push(imageUrl);
    } else return null;
  }

  if (!finish() || days.length === 0) return null;
  const numbers = days.map((day) => day.dayNumber);
  if (new Set(numbers).size !== numbers.length || numbers.some((number, index) => number !== index + 1)) return null;
  return days;
}

function singleLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function serializeItineraryEditorDays(days: ItineraryDraftDay[]) {
  return days
    .map((day, index) => [
      `[Day ${index + 1}]`,
      `Date: ${singleLine(day.date)}`,
      `Subtitle: ${singleLine(day.subtitle)}`,
      `Highlight: ${singleLine(day.highlightLine)}`,
      ...day.activities.map((activity) =>
        `Activity: ${singleLine(activity.timeRange)} | ${singleLine(activity.description)}`
      ),
      ...day.paragraphs.map((paragraph) => `Paragraph: ${singleLine(paragraph)}`),
      ...day.images.filter((url) => singleLine(url)).map((url) => `Image: ${singleLine(url)}`),
    ].join("\n"))
    .join("\n\n");
}

export function validateItineraryEditorDays(days: ItineraryDraftDay[]) {
  const errors: string[] = [];
  if (days.length === 0) errors.push("Add at least one day.");
  days.forEach((day, index) => {
    if (day.activities.length === 0) errors.push(`Day ${index + 1} needs at least one activity.`);
    if (day.activities.some((activity) => !singleLine(activity.description))) {
      errors.push(`Day ${index + 1} has an activity without a description.`);
    }
    if (day.paragraphs.length === 0 || day.paragraphs.some((paragraph) => !singleLine(paragraph))) {
      errors.push(`Day ${index + 1} needs at least one complete paragraph.`);
    }
    if (day.images.some((url) => !validImageUrl(singleLine(url)))) {
      errors.push(`Day ${index + 1} has an invalid image URL.`);
    }
  });
  return errors;
}

export function itineraryMayOverflow(day: ItineraryDraftDay) {
  const textWeight = day.paragraphs.reduce((total, paragraph) => total + paragraph.length, 0) / 280;
  const contentWeight = day.activities.length + day.images.length * 1.75 + textWeight;
  return contentWeight > 8;
}
