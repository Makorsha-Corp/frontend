import { describe, expect, it } from 'vitest';
import { resolvePurchaseOrderDestinationLabel } from './resolvePurchaseOrderDestinationLabel';

describe('resolvePurchaseOrderDestinationLabel', () => {
  const lookups = {
    factories: [{ id: 1, name: 'Mill A' }],
    machines: [{ id: 10, name: 'Loom 1' }],
    projectComponents: [
      { id: 99, name: 'Electrical', project_id: 5, project_name: 'Expansion' },
    ],
  };

  it('resolves storage factory', () => {
    expect(
      resolvePurchaseOrderDestinationLabel(
        { destination_type: 'storage', destination_id: 1 },
        lookups,
      ),
    ).toBe('Storage (Mill A)');
  });

  it('resolves machine destination', () => {
    expect(
      resolvePurchaseOrderDestinationLabel(
        { destination_type: 'machine', destination_id: 10 },
        lookups,
      ),
    ).toBe('Machine (Loom 1)');
  });

  it('resolves project component id to project and component names', () => {
    expect(
      resolvePurchaseOrderDestinationLabel(
        { destination_type: 'project', destination_id: 99 },
        lookups,
      ),
    ).toBe('Project · Expansion / Electrical');
  });

  it('falls back when component is unknown', () => {
    expect(
      resolvePurchaseOrderDestinationLabel(
        { destination_type: 'project', destination_id: 404 },
        lookups,
      ),
    ).toBe('Component #404');
  });
});
