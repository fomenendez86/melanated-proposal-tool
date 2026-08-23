"use server";

import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { saveProposalAsTemplate } from "@/lib/db/saveProposalAsTemplate";

export interface TemplateMutationResult {
  ok: boolean;
  formError?: string;
  id?: number;
}

export async function saveCurrentProposalAsTemplateAction(
  proposalId: number,
  input: { name: string; description?: string }
): Promise<TemplateMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(proposalId) || proposalId < 1) return { ok: false, formError: "Proposal not found." };

  const name = input.name?.trim() ?? "";
  if (!name || name.length > 120) return { ok: false, formError: "Enter a template name (up to 120 characters)." };
  const description = input.description?.trim() || null;
  if (description && description.length > 500) return { ok: false, formError: "Description is too long." };

  const result = await saveProposalAsTemplate(proposalId, { name, description });
  if (result.ok) revalidatePath("/proposals/templates");
  return result;
}
