import { describe, expect, it } from 'vitest';
import { batchStartStepDescription } from '@/lib/batchStartStepHeadline';
import type { BatchInputStorageRow } from '@/lib/batchInputStorageCheck';

function row(partial: Partial<BatchInputStorageRow> & Pick<BatchInputStorageRow, 'required'>): BatchInputStorageRow {
  return {
    batchItemId: 1,
    itemId: 1,
    onHandStorage: 0,
    fromPriorSteps: 0,
    onHand: 0,
    factoryId: 1,
    isShort: false,
    isHighlighted: true,
    ...partial,
  };
}

describe('batchStartStepDescription', () => {
  it('prior steps cover required inputs', () => {
    const text = batchStartStepDescription({
      rows: [row({ required: 2, fromPriorSteps: 2, onHandStorage: 3.6, onHand: 5.6 })],
      batchIsDraft: false,
      hasShortage: false,
    });
    expect(text).toBe('Uses what the last step made. Storage stays as it is.');
  });

  it('storage covers the remainder', () => {
    const text = batchStartStepDescription({
      rows: [row({ required: 20, fromPriorSteps: 0, onHandStorage: 30, onHand: 30 })],
      batchIsDraft: false,
      hasShortage: false,
    });
    expect(text).toBe('Takes the rest from storage.');
  });

  it('shortage keeps short message', () => {
    const text = batchStartStepDescription({
      rows: [row({ required: 10, onHand: 2, isShort: true })],
      batchIsDraft: true,
      hasShortage: true,
    });
    expect(text).toContain('short');
  });

  it('draft first step from storage prefixes batch start', () => {
    const text = batchStartStepDescription({
      rows: [row({ required: 20, fromPriorSteps: 0, onHandStorage: 30, onHand: 30 })],
      batchIsDraft: true,
      hasShortage: false,
    });
    expect(text).toBe('Starting this step begins the batch. Takes the rest from storage.');
  });
});
