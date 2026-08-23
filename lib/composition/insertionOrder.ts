export type InsertionAnchor = number | null | undefined;

export interface InsertionOrders {
  orders: number[];
  shifts: Array<{ id: number; sortOrder: number }>;
}

/**
 * Resolves sortOrder values for inserting `count` new rows relative to an
 * existing row (`afterSectionId`), reusing the shift-by-10 pattern already
 * used by duplicateProposalSection: rows after the anchor move out of the
 * way by `count * 10`, and the new rows fill the freed gap right after it.
 * `afterSectionId === undefined` appends at the end (no shifts, matches the
 * pre-existing default behavior); `null` inserts before every row.
 * Returns null when a numeric anchor isn't found among `rows`.
 */
export function resolveInsertionOrders(
  rows: Array<{ id: number; sortOrder: number }>,
  afterSectionId: InsertionAnchor,
  count: number
): InsertionOrders | null {
  if (afterSectionId === undefined) {
    const base = rows.reduce((max, row) => Math.max(max, row.sortOrder), 0);
    return { orders: Array.from({ length: count }, (_, i) => base + (i + 1) * 10), shifts: [] };
  }
  const targetSortOrder = afterSectionId === null ? 0 : rows.find((row) => row.id === afterSectionId)?.sortOrder;
  if (targetSortOrder === undefined) return null;
  const shifts = rows
    .filter((row) => row.sortOrder > targetSortOrder)
    .map((row) => ({ id: row.id, sortOrder: row.sortOrder + count * 10 }));
  const orders = Array.from({ length: count }, (_, i) => targetSortOrder + i + 1);
  return { orders, shifts };
}
