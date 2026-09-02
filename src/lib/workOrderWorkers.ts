import type { WorkspaceMember } from '@/types/workspace';

const NAME_SPLIT = /[,;]+/;

export function parseWorkerNames(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(NAME_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function joinWorkerNames(names: string[]): string {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .join(', ');
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function memberDisplayName(member: WorkspaceMember): string {
  const name = member.user_name?.trim();
  if (name) return name;
  if (member.user_email?.trim()) return member.user_email.trim();
  return `User #${member.user_id}`;
}

export interface WorkerNameResolution {
  matchedUserIds: number[];
  unmatchedNames: string[];
  displayText: string;
}

export interface WorkerToken {
  label: string;
  linkedUserId: number | null;
}

export function resolveWorkerTokens(
  text: string | null | undefined,
  members: WorkspaceMember[],
): WorkerToken[] {
  const active = members.filter((m) => m.status === 'active');
  const tokens: WorkerToken[] = [];

  for (const raw of parseWorkerNames(text)) {
    const token = raw.trim();
    if (!token) continue;
    const norm = normalize(token);
    const hit = active.find(
      (member) =>
        normalize(member.user_name) === norm || normalize(member.user_email) === norm,
    );
    if (hit) {
      tokens.push({ label: memberDisplayName(hit), linkedUserId: hit.user_id });
    } else {
      tokens.push({ label: token, linkedUserId: null });
    }
  }

  return tokens;
}

export function resolveWorkerNamesToMembers(
  names: string[],
  members: WorkspaceMember[],
): WorkerNameResolution {
  const active = members.filter((m) => m.status === 'active');
  const matchedUserIds: number[] = [];
  const unmatchedNames: string[] = [];
  const displayNames: string[] = [];

  for (const raw of names) {
    const token = raw.trim();
    if (!token) continue;
    const norm = normalize(token);
    const hit = active.find(
      (member) =>
        normalize(member.user_name) === norm || normalize(member.user_email) === norm,
    );
    if (hit) {
      if (!matchedUserIds.includes(hit.user_id)) {
        matchedUserIds.push(hit.user_id);
      }
      displayNames.push(memberDisplayName(hit));
    } else {
      unmatchedNames.push(token);
      displayNames.push(token);
    }
  }

  return {
    matchedUserIds,
    unmatchedNames,
    displayText: joinWorkerNames(displayNames),
  };
}

export function resolveWorkerTextToMembers(
  text: string | null | undefined,
  members: WorkspaceMember[],
): WorkerNameResolution {
  return resolveWorkerNamesToMembers(parseWorkerNames(text), members);
}

export function filterMemberSuggestions(
  members: WorkspaceMember[],
  query: string,
  limit = 8,
): WorkspaceMember[] {
  const q = query.trim().toLowerCase();
  const active = members.filter((m) => m.status === 'active');
  if (!q) return active.slice(0, limit);
  return active
    .filter((member) => {
      const name = normalize(member.user_name);
      const email = normalize(member.user_email);
      return name.includes(q) || email.includes(q);
    })
    .slice(0, limit);
}
