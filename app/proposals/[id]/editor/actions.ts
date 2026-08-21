"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import {
  clients,
  proposalHotels,
  proposalPricing,
  proposalSections,
  proposals,
} from "@/lib/db/schema";
import type {
  ProposalEditorFieldName,
  UpdateProposalFieldsInput,
  UpdateProposalFieldsResult,
} from "@/lib/editor/proposalEditorTypes";

const LIMITS: Record<ProposalEditorFieldName, number> = {
  coverTitle: 80,
  coverSubtitle: 160,
  clientName: 120,
  coverImageUrl: 2048,
  packageName: 120,
  selectedTier: 80,
  travelDatesLabel: 120,
  passengerManifestLabel: 160,
  specialOccasion: 120,
  arrivalAirport: 80,
  departureAirport: 80,
  packageTotalLabel: 120,
  roomCategory: 120,
  mealPlan: 120,
  nights: 3,
  pricingIntro: 600,
  invoiceTotal: 14,
  commission: 14,
  amountDue: 14,
  currency: 3,
  sectionLabel: 80,
  titleLine1: 80,
  titleLine2: 80,
  titleLine3: 80,
  dividerTitle: 80,
  dividerSubtitle: 160,
  sectionImageUrl: 2048,
  cityIntro: 600,
  priceNote: 240,
  thankYouMessage: 240,
};

const FIELDS_BY_KIND = {
  cover: ["coverTitle", "coverSubtitle", "clientName", "coverImageUrl"],
  details: [
    "packageName",
    "selectedTier",
    "travelDatesLabel",
    "passengerManifestLabel",
    "specialOccasion",
    "arrivalAirport",
    "departureAirport",
    "packageTotalLabel",
  ],
  hotelBooking: ["roomCategory", "mealPlan", "nights"],
  pricing: ["pricingIntro", "invoiceTotal", "commission", "amountDue", "currency"],
  triangleDivider: ["sectionLabel", "titleLine1", "titleLine2", "titleLine3", "sectionImageUrl"],
  sectionDivider: ["dividerTitle", "dividerSubtitle", "sectionImageUrl"],
  cityToursDivider: ["cityIntro", "priceNote", "sectionImageUrl"],
  thankYou: ["thankYouMessage", "sectionImageUrl"],
} satisfies Record<UpdateProposalFieldsInput["kind"], ProposalEditorFieldName[]>;

function normalizedValues(input: UpdateProposalFieldsInput) {
  const allowed = FIELDS_BY_KIND[input.kind];
  return Object.fromEntries(
    allowed.map((field) => [field, typeof input.values[field] === "string" ? input.values[field]!.trim() : ""])
  ) as Partial<Record<ProposalEditorFieldName, string>>;
}

function validateInput(input: UpdateProposalFieldsInput) {
  const errors: Partial<Record<ProposalEditorFieldName, string>> = {};
  const values = normalizedValues(input);

  for (const field of FIELDS_BY_KIND[input.kind]) {
    const value = values[field] ?? "";
    if (value.length > LIMITS[field]) errors[field] = `Use ${LIMITS[field]} characters or fewer.`;
  }

  if (input.kind === "cover") {
    if (!values.coverTitle) errors.coverTitle = "Cover title is required.";
    if (!values.clientName) errors.clientName = "Client name is required.";
    const imageUrl = values.coverImageUrl ?? "";
    if (imageUrl && !imageUrl.startsWith("/") && !/^https:\/\//i.test(imageUrl)) {
      errors.coverImageUrl = "Use a local /path or an https:// URL.";
    }
  }

  if (input.kind === "details" && !values.packageName) {
    errors.packageName = "Package name is required.";
  }

  if (input.kind === "hotelBooking") {
    if (!values.roomCategory) errors.roomCategory = "Room category is required.";
    if (!values.mealPlan) errors.mealPlan = "Meal plan is required.";
    const nights = Number(values.nights);
    if (!Number.isInteger(nights) || nights < 1 || nights > 365) {
      errors.nights = "Enter a whole number from 1 to 365.";
    }
  }

  if (input.kind === "pricing") {
    for (const field of ["invoiceTotal", "commission", "amountDue"] as const) {
      const amount = Number(values[field]);
      if (!Number.isFinite(amount) || amount < 0) errors[field] = "Enter a valid amount of 0 or more.";
    }
    if (!/^[A-Z]{3}$/.test(values.currency ?? "")) {
      errors.currency = "Use a three-letter uppercase currency code.";
    }
  }

  const requiredByKind: Partial<Record<UpdateProposalFieldsInput["kind"], ProposalEditorFieldName[]>> = {
    triangleDivider: ["sectionLabel", "titleLine1"],
    sectionDivider: ["dividerTitle"],
    cityToursDivider: ["cityIntro"],
    thankYou: ["thankYouMessage"],
  };
  for (const field of requiredByKind[input.kind] ?? []) {
    if (!values[field]) errors[field] = "This field is required.";
  }

  for (const field of ["sectionImageUrl"] as const) {
    if (!(FIELDS_BY_KIND[input.kind] as ProposalEditorFieldName[]).includes(field)) continue;
    const imageUrl = values[field] ?? "";
    if (imageUrl && !imageUrl.startsWith("/") && !/^https:\/\//i.test(imageUrl)) {
      errors[field] = "Use a local /path or an https:// URL.";
    }
  }

  return { values, errors };
}

export async function updateProposalFields(
  proposalId: number,
  input: UpdateProposalFieldsInput
): Promise<UpdateProposalFieldsResult> {
  if (
    !Number.isInteger(proposalId) ||
    proposalId < 1 ||
    !input ||
    typeof input !== "object" ||
    !(input.kind in FIELDS_BY_KIND) ||
    !input.values ||
    typeof input.values !== "object"
  ) {
    return { ok: false, formError: "Invalid proposal update." };
  }

  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
  if (!proposal) return { ok: false, formError: "Proposal not found." };

  const sectionKinds = ["triangleDivider", "sectionDivider", "cityToursDivider", "thankYou"] as const;
  const needsSection = sectionKinds.some((kind) => kind === input.kind);
  const [sourceSection] = needsSection && Number.isInteger(input.sourceSectionId)
    ? await db
        .select()
        .from(proposalSections)
        .where(
          and(
            eq(proposalSections.id, input.sourceSectionId!),
            eq(proposalSections.proposalId, proposalId)
          )
        )
    : [];
  if (needsSection && (!sourceSection || sourceSection.sectionType !== input.kind)) {
    return { ok: false, formError: "This proposal section could not be verified." };
  }

  if (input.kind === "hotelBooking") {
    const [booking] = Number.isInteger(input.sourceRefId)
      ? await db
          .select()
          .from(proposalHotels)
          .where(
            and(
              eq(proposalHotels.id, input.sourceRefId!),
              eq(proposalHotels.proposalId, proposalId)
            )
          )
      : [];
    if (!booking) return { ok: false, formError: "This hotel booking could not be verified." };
  }

  const { values, errors } = validateInput(input);
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };

  try {
    db.transaction((transaction) => {
      if (input.kind === "cover") {
        transaction
          .update(proposals)
          .set({
            coverTitle: values.coverTitle!,
            coverSubtitle: values.coverSubtitle || null,
            coverImageUrl: values.coverImageUrl || null,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposalId))
          .run();
        transaction
          .update(clients)
          .set({ fullName: values.clientName! })
          .where(eq(clients.id, proposal.leadClientId))
          .run();
      } else if (input.kind === "details") {
        transaction
          .update(proposals)
          .set({
            packageName: values.packageName!,
            selectedTier: values.selectedTier || null,
            travelDatesLabel: values.travelDatesLabel || null,
            passengerManifestLabel: values.passengerManifestLabel || null,
            specialOccasion: values.specialOccasion || null,
            arrivalAirport: values.arrivalAirport || null,
            departureAirport: values.departureAirport || null,
            packageTotalLabel: values.packageTotalLabel || null,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposalId))
          .run();
      } else if (input.kind === "hotelBooking") {
        transaction
          .update(proposalHotels)
          .set({
            roomCategory: values.roomCategory!,
            mealPlan: values.mealPlan!,
            nights: Number(values.nights),
          })
          .where(
            and(
              eq(proposalHotels.id, input.sourceRefId!),
              eq(proposalHotels.proposalId, proposalId)
            )
          )
          .run();
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      } else if (input.kind === "pricing") {
        transaction
          .update(proposalPricing)
          .set({
            introText: values.pricingIntro || null,
            invoiceTotal: Number(values.invoiceTotal),
            commission: Number(values.commission),
            amountDue: Number(values.amountDue),
            currency: values.currency!,
          })
          .where(eq(proposalPricing.proposalId, proposalId))
          .run();
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      } else if (sourceSection) {
        const currentPayload = (sourceSection.payload ?? {}) as Record<string, unknown>;
        let payload: Record<string, unknown>;

        if (input.kind === "triangleDivider") {
          const currentLines = Array.isArray(currentPayload.titleLines)
            ? currentPayload.titleLines as Array<{ text: string; style: "bold" | "script" }>
            : [];
          const lineValues = [values.titleLine1, values.titleLine2, values.titleLine3].filter(
            (line): line is string => Boolean(line)
          );
          payload = {
            ...currentPayload,
            sectionLabel: values.sectionLabel,
            imageUrl: values.sectionImageUrl,
            titleLines: lineValues.map((text, index) => ({
              text,
              style: currentLines[index]?.style ?? (index === 1 ? "script" : "bold"),
            })),
          };
        } else if (input.kind === "sectionDivider") {
          payload = {
            ...currentPayload,
            title: values.dividerTitle,
            subtitle: values.dividerSubtitle || undefined,
            imageUrl: values.sectionImageUrl,
          };
        } else if (input.kind === "cityToursDivider") {
          payload = {
            ...currentPayload,
            intro: values.cityIntro,
            priceNote: values.priceNote,
            imageUrl: values.sectionImageUrl,
          };
        } else {
          payload = {
            ...currentPayload,
            message: values.thankYouMessage,
            imageUrl: values.sectionImageUrl,
          };
        }

        transaction
          .update(proposalSections)
          .set({ payload })
          .where(
            and(
              eq(proposalSections.id, sourceSection.id),
              eq(proposalSections.proposalId, proposalId)
            )
          )
          .run();
        transaction.update(proposals).set({ updatedAt: new Date() }).where(eq(proposals.id, proposalId)).run();
      }
    });
  } catch {
    return { ok: false, formError: "The changes could not be saved. Try again." };
  }

  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true, savedAt: new Date().toISOString() };
}
