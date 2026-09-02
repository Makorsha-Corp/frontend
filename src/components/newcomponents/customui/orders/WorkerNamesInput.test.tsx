import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';

import type { WorkspaceMember } from '@/types/workspace';

import WorkerNamesInput from './WorkerNamesInput';

const members: WorkspaceMember[] = [
  {
    id: 1,
    workspace_id: 1,
    user_id: 42,
    user_name: 'Shohan Chowdhury',
    user_email: 'shohan@example.com',
    user_position: 'CEO',
    role: 'owner',
    status: 'active',
    joined_at: null,
  },
];

describe('WorkerNamesInput suggestionsPlacement', () => {
  it('defaults to bottom placement', () => {
    const html = renderToString(
      <WorkerNamesInput value="" onChange={() => {}} members={members} />,
    );
    expect(html).toContain('data-suggestions-placement="bottom"');
  });

  it('supports top placement for footer forms', () => {
    const html = renderToString(
      <WorkerNamesInput
        value=""
        onChange={() => {}}
        members={members}
        suggestionsPlacement="top"
      />,
    );
    expect(html).toContain('data-suggestions-placement="top"');
  });
});

describe('WorkerNamesInput chipDisplay', () => {
  it('renders full text chips by default', () => {
    const html = renderToString(
      <WorkerNamesInput
        value="Shohan Chowdhury"
        onChange={() => {}}
        members={members}
      />,
    );
    expect(html).toContain('data-chip-display="full"');
    expect(html).toContain('border-brand-primary/30');
  });

  it('renders compact avatar mode with fixed height', () => {
    const html = renderToString(
      <WorkerNamesInput
        value="Shohan Chowdhury, Alex Beta"
        onChange={() => {}}
        members={members}
        chipDisplay="avatars"
      />,
    );
    expect(html).toContain('data-chip-display="avatars"');
    expect(html).toContain('h-9 py-0');
    expect(html).toContain('bg-brand-primary');
    expect(html).not.toContain('border-brand-primary/30');
  });

  it('shows overflow badge when more than three workers in avatar mode', () => {
    const html = renderToString(
      <WorkerNamesInput
        value="One, Two, Three, Four"
        onChange={() => {}}
        members={members}
        chipDisplay="avatars"
      />,
    );
    expect(html.replace(/<!-- -->/g, '')).toContain('+1');
  });
});
