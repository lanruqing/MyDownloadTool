import { describe, expect, it } from 'vitest';
import { formatBytes, formatSpeed, formatETA } from './formatters';

describe('formatters', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
  });

  it('formats speed correctly', () => {
    expect(formatSpeed(0)).toBe('0 Bytes/s');
    expect(formatSpeed(1024)).toBe('1 KB/s');
  });

  it('formats ETA values into readable text', () => {
    expect(formatETA(-1)).toBe('∞');
    expect(formatETA(30)).toBe('30s');
    expect(formatETA(90)).toBe('1m 30s');
    expect(formatETA(3600)).toBe('1h 0m');
    expect(formatETA(90000)).toBe('1d 1h');
  });
});
