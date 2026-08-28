import type {
  ExcursionBookingField,
  ExcursionBookingQuestion,
  ExcursionBookingType,
  ExcursionCapacityType,
  ExcursionExtra,
  ExcursionMeetingType,
  ExcursionPlace,
  ExcursionPricingCategory,
  ExcursionRate,
  ExcursionStartTime,
  NormalizedProviderExcursion,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(record).filter((item): item is UnknownRecord => Boolean(item)) : [];
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function number(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function boolean(value: unknown): boolean {
  return value === true;
}

function id(value: unknown): string | undefined {
  const parsed = typeof value === "string" || typeof value === "number" ? String(value) : "";
  return parsed && parsed !== "undefined" && parsed !== "null" ? parsed : undefined;
}

export function htmlToPlainText(value: unknown): string {
  const source = text(value) ?? "";
  return source
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  const candidate = text(value) as T | undefined;
  return candidate && allowed.includes(candidate) ? candidate : undefined;
}

function totalMinutes(source: UnknownRecord, prefix: string): number | undefined {
  const minutes = number(source[`${prefix}Minutes`]) ?? 0;
  const hours = number(source[`${prefix}Hours`]) ?? 0;
  const days = number(source[`${prefix}Days`]) ?? 0;
  const weeks = number(source[`${prefix}Weeks`]) ?? 0;
  const total = minutes + hours * 60 + days * 1_440 + weeks * 10_080;
  return total > 0 ? total : undefined;
}

function bookingFields(value: unknown): ExcursionBookingField[] {
  return records(value).flatMap((item) => {
    const field = text(item.field);
    return field ? [{ field, required: boolean(item.required) }] : [];
  });
}

function triggerIds(value: unknown): string[] {
  return records(value).map((item) => id(item.value)).filter((item): item is string => Boolean(item));
}

function bookingQuestions(value: unknown): ExcursionBookingQuestion[] {
  return records(value).flatMap((item) => {
    const questionId = id(item.id);
    const label = text(item.label);
    if (!questionId || !label) return [];
    const context = enumValue(item.context, ["BOOKING", "PASSENGER", "EXTRA"] as const) ?? "BOOKING";
    return [{
      id: questionId,
      code: text(item.questionCode),
      label,
      help: text(item.help),
      placeholder: text(item.placeholder),
      required: boolean(item.required),
      dataType: text(item.dataType) ?? "SHORT_TEXT",
      context,
      selectMultiple: boolean(item.selectMultiple),
      options: records(item.options).flatMap((option) => {
        const value = text(option.value) ?? text(option.name);
        const optionLabel = text(option.name) ?? value;
        return value && optionLabel ? [{ label: optionLabel, value }] : [];
      }),
      pricingCategoryIds: triggerIds(item.pricingCategoryTriggers),
      rateIds: triggerIds(item.rateTriggers),
    }];
  });
}

function pricingCategories(value: unknown): ExcursionPricingCategory[] {
  return records(value).flatMap((item) => {
    const categoryId = id(item.id);
    const title = text(item.fullTitle) ?? text(item.title);
    if (!categoryId || !title || boolean(item.internalUseOnly)) return [];
    return [{
      id: categoryId,
      title,
      ticketCategory: text(item.ticketCategory),
      minAge: number(item.minAge),
      maxAge: number(item.maxAge),
      groupSize: number(item.groupSize),
      defaultCategory: boolean(item.defaultCategory),
    }];
  });
}

function rates(value: unknown): ExcursionRate[] {
  return records(value).flatMap((item) => {
    const rateId = id(item.id);
    const title = text(item.title) ?? "Standard";
    if (!rateId) return [];
    return [{
      id: rateId,
      title,
      description: htmlToPlainText(item.description) || undefined,
      pricedPerPerson: boolean(item.pricedPerPerson),
      minPerBooking: number(item.minPerBooking),
      maxPerBooking: number(item.maxPerBooking),
      pickupSelectionType: text(item.pickupSelectionType),
      dropoffSelectionType: text(item.dropoffSelectionType),
      pricingCategoryIds: Array.isArray(item.pricingCategoryIds) ? item.pricingCategoryIds.map(String) : [],
    }];
  });
}

function places(value: unknown): ExcursionPlace[] {
  return records(value).flatMap((item) => {
    const placeId = id(item.id);
    const title = text(item.title);
    if (!placeId || !title) return [];
    const location = record(item.location);
    return [{
      id: placeId,
      title,
      type: text(item.type),
      address: text(location?.wholeAddress) ?? text(location?.address),
      askForRoomNumber: boolean(item.askForRoomNumber),
    }];
  });
}

function startTimes(value: unknown): ExcursionStartTime[] {
  return records(value).flatMap((item) => {
    const startId = id(item.id);
    if (!startId) return [];
    const hour = number(item.hour);
    const minute = number(item.minute);
    const fallback = hour === undefined ? "Departure" : `${String(hour).padStart(2, "0")}:${String(minute ?? 0).padStart(2, "0")}`;
    return [{ id: startId, label: text(item.label) ?? fallback, hour, minute }];
  });
}

function extras(value: unknown): ExcursionExtra[] {
  return records(value).flatMap((item) => {
    const extraId = id(item.id);
    const title = text(item.title);
    if (!extraId || !title) return [];
    return [{
      id: extraId,
      title,
      information: htmlToPlainText(item.information) || undefined,
      included: boolean(item.included),
      free: boolean(item.free),
      pricingType: text(item.pricingTypeLabel) ?? text(item.pricingType),
      price: number(item.price),
    }];
  });
}

function photoUrl(item: UnknownRecord): string | undefined {
  const derivatives = records(item.derived);
  const preferred = derivatives.find((derived) => ["large", "preview"].includes((text(derived.name) ?? "").toLowerCase()))
    ?? derivatives[0];
  const candidate = text(preferred?.cleanUrl) ?? text(preferred?.url) ?? text(item.originalUrl);
  return candidate && /^https:\/\//i.test(candidate) ? candidate : undefined;
}

function photos(activity: UnknownRecord): NormalizedProviderExcursion["images"] {
  const source = [record(activity.keyPhoto), ...records(activity.photos)].filter((item): item is UnknownRecord => Boolean(item));
  const seen = new Set<string>();
  return source.flatMap((item) => {
    const url = photoUrl(item);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{ providerPhotoId: id(item.id), url, altText: text(item.alternateText) ?? text(item.description) }];
  });
}

export function normalizeProviderActivity(
  activityPayload: unknown,
  placesPayload: unknown,
  defaultCurrency = "USD"
): NormalizedProviderExcursion {
  const activity = record(activityPayload);
  if (!activity) throw new Error("Provider activity response is invalid.");
  const providerProductId = id(activity.id);
  const title = text(activity.title);
  if (!providerProductId || !title) throw new Error("Provider activity is missing its ID or title.");

  const defaultRateId = id(activity.defaultRateId);
  const normalizedRates = rates(activity.rates);
  const defaultRate = normalizedRates.find((rate) => rate.id === defaultRateId) ?? normalizedRates[0];
  const money = record(activity.nextDefaultPriceMoney);
  const basePrice = number(money?.amount) ?? number(activity.nextDefaultPrice) ?? 0;
  const currency = (text(money?.currency) ?? defaultCurrency).toUpperCase();
  const googlePlace = record(activity.googlePlace);
  const firstStartPoint = record(records(activity.startPoints)[0]?.location);
  const meetingType = enumValue<ExcursionMeetingType>(activity.meetingType, ["MEET_ON_LOCATION", "PICK_UP", "MEET_ON_LOCATION_OR_PICK_UP"]);
  const bookingType = enumValue<ExcursionBookingType>(activity.bookingType, ["PASS", "DATE", "DATE_AND_TIME"]);
  const capacityType = enumValue<ExcursionCapacityType>(activity.capacityType, ["FREE_SALE", "LIMITED", "ON_REQUEST"]);
  const description = htmlToPlainText(activity.description) || htmlToPlainText(activity.excerpt);
  const providerPlaces = record(placesPayload);

  return {
    providerProductId,
    providerProductCode: text(activity.externalId),
    slug: text(activity.slug),
    title: title.slice(0, 160),
    description: description.slice(0, 12_000),
    excerpt: htmlToPlainText(activity.excerpt).slice(0, 500) || undefined,
    published: activity.published !== false,
    providerModifiedAt: text(activity.lastPublished) ?? text(activity.lastModified),
    cityName: text(googlePlace?.city) ?? text(firstStartPoint?.city),
    countryName: text(googlePlace?.country),
    countryCode: (text(googlePlace?.countryCode) ?? text(firstStartPoint?.countryCode))?.toUpperCase(),
    basePrice,
    currency,
    priceUnit: defaultRate?.pricedPerPerson === false ? "per_group" : "per_person",
    priceNote: defaultRate?.pricedPerPerson === false ? "per booking" : undefined,
    durationText: text(activity.durationText),
    durationMinutes: totalMinutes(activity, "duration"),
    bookingType,
    capacityType,
    meetingType,
    minAge: number(activity.minAge),
    difficultyLevel: text(activity.difficultyLevel),
    privateActivity: boolean(activity.privateActivity),
    pickupAvailable: meetingType === "PICK_UP" || meetingType === "MEET_ON_LOCATION_OR_PICK_UP",
    customPickupAllowed: boolean(activity.customPickupAllowed),
    dropoffAvailable: boolean(activity.dropoffService),
    customDropoffAllowed: boolean(activity.customDropoffAllowed),
    bookingCutoffMinutes: totalMinutes(activity, "bookingCutoff"),
    requestDeadlineMinutes: totalMinutes(activity, "requestDeadline"),
    requirements: htmlToPlainText(activity.requirements).slice(0, 4_000) || undefined,
    attention: htmlToPlainText(activity.attention).slice(0, 4_000) || undefined,
    included: htmlToPlainText(activity.included).slice(0, 4_000) || undefined,
    excluded: htmlToPlainText(activity.excluded).slice(0, 4_000) || undefined,
    mainContactFields: bookingFields(activity.mainContactFields),
    passengerFields: bookingFields(activity.passengerFields),
    bookingQuestions: bookingQuestions(activity.bookingQuestions),
    pricingCategories: pricingCategories(activity.pricingCategories),
    rates: normalizedRates,
    pickupPlaces: places(providerPlaces?.pickupPlaces),
    dropoffPlaces: places(providerPlaces?.dropoffPlaces),
    startTimes: startTimes(activity.startTimes),
    extras: extras(activity.bookableExtras),
    images: photos(activity),
  };
}
