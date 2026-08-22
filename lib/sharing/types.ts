import type { DocumentDesignDescriptor } from "@/lib/designs/types";
import type { ProposalData } from "@/lib/types";

export interface ProposalRevisionPayload {
  proposalId: number;
  createdAt: string;
  data: ProposalData;
  design: DocumentDesignDescriptor;
}

export interface ProposalShareSettingsPayload {
  token: string;
  revisionSectionId: number;
  createdAt: string;
  expiresAt: string | null;
  passwordSalt?: string;
  passwordHash?: string;
  accessKey?: string;
}

export interface CreateShareResult {
  ok: boolean;
  path?: string;
  expiresAt?: string | null;
  formError?: string;
}

export interface SharedProposalRecord {
  settingsSectionId: number;
  settings: ProposalShareSettingsPayload;
  revision: ProposalRevisionPayload;
}
