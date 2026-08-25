export interface ProposalActivityData {
  summary: { openings: number; totalDurationMs: number; mostViewed: string | null; leastViewed: string | null };
  pageDurations: Array<{ section: string; durationMs: number }>;
  timeline: Array<{ id: number; type: string; createdAt: string; detail: string }>;
  notificationSettings: { recipientEmail: string; firstOpenEnabled: boolean; signatureEnabled: boolean; expiryEnabled: boolean };
  threads: Array<{ id: number; sectionKey: string; status: "open" | "resolved"; orphaned: boolean; clientName: string; comments: Array<{ id: number; authorType: "client" | "seller"; authorName: string; body: string; createdAt: string }> }>;
  notes: Array<{ id: number; sectionKey: string; body: string; updatedAt: string }>;
}
