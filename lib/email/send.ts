import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface EmailMessage { to: string[]; subject: string; text: string }
export interface EmailDeliveryResult { provider: string; status: "sent" | "file" | "link_only"; messageId?: string }

function safeHeader(value: string) { return value.replace(/[\r\n]+/g, " ").trim(); }

export async function deliverEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (provider === "webhook") {
    const url = process.env.EMAIL_WEBHOOK_URL;
    if (!url) throw new Error("EMAIL_WEBHOOK_URL is required for the webhook email provider.");
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(message), signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Email webhook returned ${response.status}.`);
    const body = await response.json().catch(() => null) as { id?: string } | null;
    return { provider: "webhook", status: "sent", messageId: body?.id };
  }
  if (provider === "file" || process.env.NODE_ENV !== "production") {
    const directory = path.resolve(process.env.EMAIL_OUTBOX_DIRECTORY ?? "data/outbox");
    await mkdir(directory, { recursive: true });
    const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID()}`;
    const eml = [`To: ${message.to.map(safeHeader).join(", ")}`, `Subject: ${safeHeader(message.subject)}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "", message.text].join("\r\n");
    await writeFile(path.join(directory, `${id}.eml`), eml, { encoding: "utf8", flag: "wx" });
    return { provider: "file", status: "file", messageId: id };
  }
  return { provider: "none", status: "link_only" };
}
