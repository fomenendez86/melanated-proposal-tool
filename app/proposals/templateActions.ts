"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { proposals } from "@/lib/db/schema";
import { updateTemplateFromProposal } from "@/lib/db/updateTemplateFromProposal";

export interface TemplateMutationResult {
  ok: boolean;
  formError?: string;
}

function revalidateTemplates() {
  revalidatePath("/proposals/templates");
  // The dashboard's "New proposal" dialog offers the same template list, and
  // /proposals is prerendered — without this it keeps serving the old one.
  revalidatePath("/proposals");
}

async function getTemplateRow(templateId: number) {
  const [template] = await db.select({ id: proposals.id, isTemplate: proposals.isTemplate }).from(proposals).where(eq(proposals.id, templateId));
  return template && template.isTemplate ? template : undefined;
}

export async function renameTemplateAction(
  templateId: number,
  input: { name: string; description?: string }
): Promise<TemplateMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(templateId)) return { ok: false, formError: "Template not found." };
  const name = input.name?.trim() ?? "";
  if (!name || name.length > 120) return { ok: false, formError: "Enter a template name (up to 120 characters)." };
  const description = input.description?.trim() || null;
  if (description && description.length > 500) return { ok: false, formError: "Description is too long." };

  const template = await getTemplateRow(templateId);
  if (!template) return { ok: false, formError: "Template not found." };

  try {
    db.transaction((tx) => {
      tx.update(proposals)
        .set({ templateName: name, templateDescription: description, updatedAt: new Date() })
        .where(eq(proposals.id, templateId))
        .run();
    });
  } catch {
    return { ok: false, formError: "The template could not be renamed." };
  }
  revalidateTemplates();
  return { ok: true };
}

export async function archiveTemplateAction(templateId: number): Promise<TemplateMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(templateId)) return { ok: false, formError: "Template not found." };
  const template = await getTemplateRow(templateId);
  if (!template) return { ok: false, formError: "Template not found." };

  try {
    db.transaction((tx) => {
      tx.update(proposals).set({ status: "archived", updatedAt: new Date() }).where(eq(proposals.id, templateId)).run();
    });
  } catch {
    return { ok: false, formError: "The template could not be archived." };
  }
  revalidateTemplates();
  return { ok: true };
}

export async function restoreTemplateAction(templateId: number): Promise<TemplateMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(templateId)) return { ok: false, formError: "Template not found." };
  const template = await getTemplateRow(templateId);
  if (!template) return { ok: false, formError: "Template not found." };

  try {
    db.transaction((tx) => {
      tx.update(proposals).set({ status: "draft", updatedAt: new Date() }).where(eq(proposals.id, templateId)).run();
    });
  } catch {
    return { ok: false, formError: "The template could not be restored." };
  }
  revalidateTemplates();
  return { ok: true };
}

export async function updateTemplateFromProposalAction(
  templateId: number,
  sourceProposalId: number
): Promise<TemplateMutationResult> {
  if (!(await hasValidSession())) return { ok: false, formError: "Your session expired. Sign in again." };
  if (!Number.isInteger(templateId) || !Number.isInteger(sourceProposalId)) return { ok: false, formError: "Template not found." };
  const result = await updateTemplateFromProposal(templateId, sourceProposalId);
  if (result.ok) revalidateTemplates();
  return result;
}
