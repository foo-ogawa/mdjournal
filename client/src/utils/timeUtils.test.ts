/**
 * Time utilities tests
 */
import { describe, it, expect } from 'vitest';
import { 
  timeToMinutes, 
  minutesToTime, 
  formatDuration, 
  snapToQuarterHour,
} from './timeUtils';

describe('timeToMinutes', () => {
  it('should convert time string to minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('01:00')).toBe(60);
    expect(timeToMinutes('12:30')).toBe(750);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('should handle various time formats', () => {
    expect(timeToMinutes('08:30')).toBe(510);
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('17:00')).toBe(1020);
  });
});

describe('minutesToTime', () => {
  it('should convert minutes to time string', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(60)).toBe('01:00');
    expect(minutesToTime(750)).toBe('12:30');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('should pad single digit hours and minutes', () => {
    expect(minutesToTime(5)).toBe('00:05');
    expect(minutesToTime(65)).toBe('01:05');
    expect(minutesToTime(540)).toBe('09:00');
  });
});

describe('formatDuration', () => {
  it('should format duration with hours only', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(180)).toBe('3h');
  });

  it('should format duration with hours and minutes', () => {
    expect(formatDuration(30)).toBe('0h30m');
    expect(formatDuration(90)).toBe('1h30m');
    expect(formatDuration(150)).toBe('2h30m');
  });

  it('should handle zero duration', () => {
    expect(formatDuration(0)).toBe('0h');
  });
});

describe('snapToQuarterHour', () => {
  it('should snap to nearest quarter hour', () => {
    // Exact quarter hours
    expect(snapToQuarterHour(0)).toBe(0);
    expect(snapToQuarterHour(15)).toBe(15);
    expect(snapToQuarterHour(30)).toBe(30);
    expect(snapToQuarterHour(45)).toBe(45);
    expect(snapToQuarterHour(60)).toBe(60);
  });

  it('should round to nearest quarter hour', () => {
    // Round down (0-7 → 0)
    expect(snapToQuarterHour(5)).toBe(0);
    expect(snapToQuarterHour(7)).toBe(0);
    
    // Round up (8-14 → 15)
    expect(snapToQuarterHour(8)).toBe(15);
    expect(snapToQuarterHour(10)).toBe(15);
    expect(snapToQuarterHour(14)).toBe(15);
    
    // Round to 30 (23-37)
    expect(snapToQuarterHour(23)).toBe(30);
    expect(snapToQuarterHour(30)).toBe(30);
    expect(snapToQuarterHour(37)).toBe(30);
    
    // Round to 45 (38-52)
    expect(snapToQuarterHour(38)).toBe(45);
    expect(snapToQuarterHour(45)).toBe(45);
    expect(snapToQuarterHour(52)).toBe(45);
    
    // Round to 60 (53-67)
    expect(snapToQuarterHour(53)).toBe(60);
    expect(snapToQuarterHour(60)).toBe(60);
  });

  it('should work for larger values', () => {
    expect(snapToQuarterHour(510)).toBe(510); // 08:30
    expect(snapToQuarterHour(512)).toBe(510); // rounds to 08:30
    expect(snapToQuarterHour(520)).toBe(525); // rounds to 08:45
  });
});

describe('roundtrip (minutes <-> time)', () => {
  it('should preserve time through conversion', () => {
    const times = ['00:00', '08:30', '12:00', '17:45', '23:59'];
    
    for (const time of times) {
      const minutes = timeToMinutes(time);
      const converted = minutesToTime(minutes);
      expect(converted).toBe(time);
    }
  });
});

