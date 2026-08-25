import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { libraryImages } from "@/lib/db/schema";
import { readLibraryImage } from "@/lib/library/storage";

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const [image] = await db
    .select({ mimeType: libraryImages.mimeType })
    .from(libraryImages)
    .where(eq(libraryImages.storageKey, key));
  if (!image) return new Response("Not found", { status: 404 });
  const bytes = await readLibraryImage(key);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(bytes, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
