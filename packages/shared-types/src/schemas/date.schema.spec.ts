import { describe, it, expect } from 'vitest';
import { calendarDateSchema } from './date.schema.js';

describe('calendarDateSchema', () => {
  it('accepts valid calendar dates', () => {
    const validDate = '2026-03-15';
    expect(calendarDateSchema.safeParse(validDate).success).toBe(true);
  });

  it('accepts valid leap year date', () => {
    expect(calendarDateSchema.safeParse('2024-02-29').success).toBe(true);
  });

  it('rejects invalid leap year date', () => {
    expect(calendarDateSchema.safeParse('2025-02-29').success).toBe(false);
  });

  it('rejects non-existent calendar date like Feb 30', () => {
    const result = calendarDateSchema.safeParse('2026-02-30');
    expect(result.success).toBe(false);
  });

  it('rejects invalid format', () => {
    expect(calendarDateSchema.safeParse('15-03-2026').success).toBe(false);
    expect(calendarDateSchema.safeParse('2026/03/15').success).toBe(false);
    expect(calendarDateSchema.safeParse('2026-3-15').success).toBe(false);
  });

  it('rejects date more than 1 day in the future', () => {
    const futureDate = new Date();
    futureDate.setUTCDate(futureDate.getUTCDate() + 10);
    const dateStr = futureDate.toISOString().slice(0, 10);
    const result = calendarDateSchema.safeParse(dateStr);
    expect(result.success).toBe(false);
  });
});
