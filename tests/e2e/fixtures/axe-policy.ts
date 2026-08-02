import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type AxeBestPracticeAllowEntry = {
  ruleId: string;
  selector: string;
  reason: string;
  expiresOn: string;
};

export type AxeBestPracticePolicy = {
  maxUnapprovedWarnings: number;
  entries: AxeBestPracticeAllowEntry[];
};

function todayUtcDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function loadAxeBestPracticePolicy(
  policyPath = resolve(process.cwd(), 'config/axe-best-practice-policy.json'),
  now = new Date(),
): AxeBestPracticePolicy {
  const raw = JSON.parse(readFileSync(policyPath, 'utf8')) as AxeBestPracticePolicy;
  if (!Number.isInteger(raw.maxUnapprovedWarnings) || raw.maxUnapprovedWarnings < 0) {
    throw new Error('axe policy maxUnapprovedWarnings must be a non-negative integer');
  }
  if (!Array.isArray(raw.entries)) {
    throw new Error('axe policy entries must be an array');
  }
  const today = todayUtcDateString(now);
  for (const [index, entry] of raw.entries.entries()) {
    if (!entry.ruleId || !entry.selector || !entry.reason || !entry.expiresOn) {
      throw new Error(`axe policy entries[${index}] requires ruleId, selector, reason, expiresOn`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.expiresOn)) {
      throw new Error(`axe policy entries[${index}] expiresOn must be YYYY-MM-DD`);
    }
    if (entry.expiresOn < today) {
      throw new Error(`axe policy entries[${index}] expired on ${entry.expiresOn}`);
    }
  }
  return raw;
}

export type CompactAxeWarning = {
  route: string;
  ruleId: string;
  impact: string | null | undefined;
  help: string;
  selectors: string[];
};

export function compactBestPracticeWarnings(
  route: string,
  violations: Array<{ id: string; impact?: string | null; help: string; nodes: Array<{ target: unknown[] }> }>,
): CompactAxeWarning[] {
  return violations.map((violation) => ({
    route,
    ruleId: violation.id,
    impact: violation.impact,
    help: violation.help,
    selectors: violation.nodes.flatMap((node) => node.target.map(String)),
  }));
}

export function filterUnapprovedWarnings(
  warnings: CompactAxeWarning[],
  policy: AxeBestPracticePolicy,
): CompactAxeWarning[] {
  return warnings.filter((warning) => {
    const approved = policy.entries.some((entry) => (
      entry.ruleId === warning.ruleId
      && warning.selectors.some((selector) => selector.includes(entry.selector) || entry.selector === '*')
    ));
    return !approved;
  });
}
