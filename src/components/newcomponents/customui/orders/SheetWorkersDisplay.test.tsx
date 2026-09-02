import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';

import type { WorkspaceMember } from '@/types/workspace';
import { resolveWorkerTokens } from '@/lib/workOrderWorkers';

import SheetWorkersDisplay from './SheetWorkersDisplay';

const members: WorkspaceMember[] = [
  {
    id: 1,
    workspace_id: 1,
    user_id: 42,
    user_name: 'Shohan Chowdhury',
    user_email: 'shohan@example.com',
    user_position: null,
    role: 'owner',
    status: 'active',
    joined_at: null,
  },
];

describe('SheetWorkersDisplay', () => {
  it('renders empty state', () => {
    const html = renderToString(<SheetWorkersDisplay workers="" members={members} />);
    expect(html).toContain('No workers');
  });

  it('renders overlapping avatars for one worker', () => {
    const html = renderToString(
      <SheetWorkersDisplay workers="Shohan Chowdhury" members={members} />,
    );
    expect(html).toContain('SC');
    expect(html).toContain('bg-brand-primary');
  });

  it('caps visible avatars and shows +N overflow', () => {
    const workers = 'Shohan Chowdhury, Alex Beta, Casey Gamma, Dana Delta';
    const html = renderToString(<SheetWorkersDisplay workers={workers} members={members} />);
    expect(html.replace(/<!-- -->/g, '')).toContain('+1');
  });

  it('uses purple for linked members and muted for free-text names', () => {
    const tokens = resolveWorkerTokens('Shohan Chowdhury, shohan', members);
    expect(tokens[0]?.linkedUserId).toBe(42);
    expect(tokens[1]?.linkedUserId).toBeNull();

    const html = renderToString(
      <SheetWorkersDisplay workers="Shohan Chowdhury, shohan" members={members} />,
    );
    expect(html).toContain('bg-brand-primary');
    expect(html).toContain('bg-muted-foreground/35');
  });
});
