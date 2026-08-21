"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import { clients, proposals } from "@/lib/db/schema";
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
      } else {
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
      }
    });
  } catch {
    return { ok: false, formError: "The changes could not be saved. Try again." };
  }

  revalidatePath(`/proposals/${proposalId}/editor`);
  revalidatePath(`/proposals/${proposalId}/preview`);
  return { ok: true, savedAt: new Date().toISOString() };
}
