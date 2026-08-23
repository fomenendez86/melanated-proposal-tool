import { asc } from "drizzle-orm";

import { db } from "./client";
import { clients } from "./schema";

export interface ClientOption {
  id: number;
  fullName: string;
}

export async function listClientOptions(): Promise<ClientOption[]> {
  return db
    .select({ id: clients.id, fullName: clients.fullName })
    .from(clients)
    .orderBy(asc(clients.fullName));
}
