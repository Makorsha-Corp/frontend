import { describe, expect, it } from 'vitest';
import { parseProductionQuantity } from './productionQuantity';

describe('parseProductionQuantity', () => {
  it('keeps fractional recipe and actual quantities', () => {
    expect(parseProductionQuantity('1.2')).toBe(1.2);
    expect(parseProductionQuantity('9.5')).toBe(9.5);
  });

  it('rejects blank and non-numeric input', () => {
    expect(parseProductionQuantity('')).toBeNull();
    expect(parseProductionQuantity('abc')).toBeNull();
  });
});
