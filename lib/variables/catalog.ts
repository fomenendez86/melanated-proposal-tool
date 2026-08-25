import type { ProposalData } from "@/lib/types";

export const PROPOSAL_VARIABLES = [
  { path: "client.name", label: "Client name", group: "Client" },
  { path: "client.partySize", label: "Party size", group: "Client" },
  { path: "trip.title", label: "Trip title", group: "Trip" },
  { path: "trip.startDate", label: "Start date", group: "Trip" },
  { path: "trip.endDate", label: "End date", group: "Trip" },
  { path: "trip.nights", label: "Nights", group: "Trip" },
  { path: "pricing.total", label: "Pricing total", group: "Pricing" },
  { path: "pricing.currency", label: "Pricing currency", group: "Pricing" },
  { path: "company.legalName", label: "Company legal name", group: "Company" },
  { path: "company.displayName", label: "Company name", group: "Company" },
  { path: "company.address", label: "Company address", group: "Company" },
  { path: "company.phone", label: "Company phone", group: "Company" },
  { path: "company.email", label: "Company email", group: "Company" },
  { path: "company.website", label: "Company website", group: "Company" },
] as const;

export type ProposalVariablePath = (typeof PROPOSAL_VARIABLES)[number]["path"];
export type ProposalVariableContext = Record<ProposalVariablePath, string>;

export interface ProposalVariableIssue {
  path: ProposalVariablePath | string;
  token: string;
  required: boolean;
}

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+)\s*}}/g;
const KNOWN_PATHS = new Set<string>(PROPOSAL_VARIABLES.map((variable) => variable.path));

export function variableToken(path: ProposalVariablePath) {
  return `{{${path}}}`;
}

export function resolveTemplateText(text: string, context: ProposalVariableContext) {
  return text.replace(VARIABLE_PATTERN, (token, path: string) => {
    if (!KNOWN_PATHS.has(path)) return token;
    return context[path as ProposalVariablePath] || token;
  });
}

export function findVariableIssues(
  value: unknown,
  context: ProposalVariableContext,
  requiredPaths: readonly string[] = []
): ProposalVariableIssue[] {
  const found = new Map<string, ProposalVariableIssue>();
  const required = new Set(requiredPaths);

  function visit(candidate: unknown) {
    if (typeof candidate === "string") {
      for (const match of candidate.matchAll(VARIABLE_PATTERN)) {
        const path = match[1];
        if (!KNOWN_PATHS.has(path) || !context[path as ProposalVariablePath]) {
          found.set(path, { path, token: match[0], required: required.has(path) });
        }
      }
      return;
    }
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (candidate && typeof candidate === "object") Object.values(candidate).forEach(visit);
  }

  visit(value);
  return [...found.values()].sort((left, right) => left.path.localeCompare(right.path));
}

export function resolveProposalVariables(data: ProposalData, context: ProposalVariableContext): ProposalData {
  function visit<T>(value: T): T {
    if (typeof value === "string") return resolveTemplateText(value, context) as T;
    if (Array.isArray(value)) return value.map((item) => visit(item)) as T;
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)])) as T;
    }
    return value;
  }
  return visit(data);
}
