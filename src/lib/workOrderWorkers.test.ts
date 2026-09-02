import { describe, expect, it } from 'vitest';

import type { WorkspaceMember } from '@/types/workspace';

import {
  parseWorkerNames,
  resolveWorkerNamesToMembers,
  resolveWorkerTextToMembers,
  resolveWorkerTokens,
} from '@/lib/workOrderWorkers';

function member(overrides: Partial<WorkspaceMember>): WorkspaceMember {
  return {
    id: overrides.id ?? 1,
    workspace_id: 1,
    user_id: overrides.user_id ?? 1,
    user_name: overrides.user_name ?? 'Test User',
    user_email: overrides.user_email ?? null,
    user_position: null,
    role: 'member',
    status: 'active',
    joined_at: null,
    ...overrides,
  };
}

describe('workOrderWorkers', () => {
  it('parses comma and semicolon separated names', () => {
    expect(parseWorkerNames('Ali, Rahim; Karim')).toEqual(['Ali', 'Rahim', 'Karim']);
  });

  it('matches workspace members by name', () => {
    const result = resolveWorkerTextToMembers('Jane Worker, Bob', [
      member({ user_id: 42, user_name: 'Jane Worker' }),
    ]);
    expect(result.matchedUserIds).toEqual([42]);
    expect(result.unmatchedNames).toEqual(['Bob']);
  });

  it('resolveWorkerTokens marks linked vs free-text chips', () => {
    const tokens = resolveWorkerTokens('Jane Worker, Bob (contractor)', [
      member({ user_id: 42, user_name: 'Jane Worker' }),
    ]);
    expect(tokens).toEqual([
      { label: 'Jane Worker', linkedUserId: 42 },
      { label: 'Bob (contractor)', linkedUserId: null },
    ]);
  });
});
