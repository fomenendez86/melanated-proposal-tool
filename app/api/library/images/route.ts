import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { hasValidSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { libraryImages } from "@/lib/db/schema";
import { storeLibraryImage } from "@/lib/library/storage";

function parseTags(value: FormDataEntryValue | null) {
  return [...new Set(String(value ?? "").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
}

export async function POST(request: Request) {
  if (!(await hasValidSession())) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  const proposalId = Number(formData.get("proposalId"));
  const name = String(formData.get("name") ?? "").trim();
  const tags = parseTags(formData.get("tags"));
  if (!(file instanceof File) || !name || name.length > 160 || tags.some((tag) => tag.length > 40)) {
    return Response.json({ ok: false, error: "Choose an image and enter a valid name and tags." }, { status: 400 });
  }

  try {
    const stored = await storeLibraryImage(file);
    const [existing] = await db.select().from(libraryImages).where(eq(libraryImages.storageKey, stored.storageKey));
    const image = existing
      ? db
          .update(libraryImages)
          .set({ name, originalName: file.name || name, tags, archivedAt: null, updatedAt: new Date() })
          .where(eq(libraryImages.id, existing.id))
          .returning({ id: libraryImages.id })
          .get()
      : db
          .insert(libraryImages)
          .values({ name, originalName: file.name || name, tags, ...stored })
          .returning({ id: libraryImages.id })
          .get();
    if (Number.isInteger(proposalId) && proposalId > 0) revalidatePath(`/proposals/${proposalId}/editor`);
    return Response.json({ ok: true, id: image.id, url: `/api/library/images/${stored.storageKey}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The image could not be uploaded.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
