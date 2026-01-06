/**
 * CalendarDomain tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CalendarDomain } from './CalendarDomain.js';
import { ValidationError } from './errors.js';

// Mock fileManager
vi.mock('../../utils/fileManager.js', () => ({
  getMonthReportStats: vi.fn(),
  getAvailableYearMonths: vi.fn(),
}));

import { getMonthReportStats, getAvailableYearMonths } from '../../utils/fileManager.js';

describe('CalendarDomain', () => {
  let calendarDomain: CalendarDomain;

  beforeEach(() => {
    calendarDomain = new CalendarDomain();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCalendarData', () => {
    it('should return calendar data for valid year and month', async () => {
      const mockStats = new Map();
      mockStats.set('2025-01-06', {
        planHours: 8,
        resultHours: 7.5,
        todoCount: 5,
        todoCompleted: 2,
        todoInProgress: 1,
        projectHours: { P99: 3, P34: 4.5 },
      });
      mockStats.set('2025-01-07', {
        planHours: 8,
        resultHours: 8,
        todoCount: 3,
        todoCompleted: 1,
        todoInProgress: 0,
        projectHours: { P99: 5, P34: 3 },
      });

      vi.mocked(getMonthReportStats).mockResolvedValue(mockStats);

      const result = await calendarDomain.getCalendarData({ year: 2025, month: 1 });

      expect(result.year).toBe(2025);
      expect(result.month).toBe(1);
      expect(result.days).toHaveLength(31); // January has 31 days
      
      // Check day with report
      const day6 = result.days.find(d => d.date === '2025-01-06');
      expect(day6?.hasReport).toBe(true);
      expect(day6?.planHours).toBe(8);
      expect(day6?.resultHours).toBe(7.5);

      // Check day without report
      const day1 = result.days.find(d => d.date === '2025-01-01');
      expect(day1?.hasReport).toBe(false);

      // Check summary
      expect(result.summary).toBeDefined();
      expect(result.summary?.totalPlanHours).toBe(16);
      expect(result.summary?.totalResultHours).toBe(15.5);
      expect(result.summary?.workDays).toBe(2);
      expect(result.summary?.todoCompleted).toBe(3);
      expect(result.summary?.projectHours?.P99).toBe(8);
      expect(result.summary?.projectHours?.P34).toBe(7.5);
    });

    it('should handle string input for year and month', async () => {
      vi.mocked(getMonthReportStats).mockResolvedValue(new Map());

      // TypeScript type system might complain, but runtime should handle string inputs
      const result = await calendarDomain.getCalendarData({ 
        year: '2025' as unknown as number, 
        month: '6' as unknown as number,
      });

      expect(result.year).toBe(2025);
      expect(result.month).toBe(6);
      expect(result.days).toHaveLength(30); // June has 30 days
    });

    it('should throw ValidationError for invalid year', async () => {
      await expect(
        calendarDomain.getCalendarData({ year: 1999, month: 1 })
      ).rejects.toThrow(ValidationError);

      await expect(
        calendarDomain.getCalendarData({ year: 2101, month: 1 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid month', async () => {
      await expect(
        calendarDomain.getCalendarData({ year: 2025, month: 0 })
      ).rejects.toThrow(ValidationError);

      await expect(
        calendarDomain.getCalendarData({ year: 2025, month: 13 })
      ).rejects.toThrow(ValidationError);
    });

    it('should return empty summary when no reports exist', async () => {
      vi.mocked(getMonthReportStats).mockResolvedValue(new Map());

      const result = await calendarDomain.getCalendarData({ year: 2025, month: 2 });

      expect(result.days).toHaveLength(28); // February 2025 (non-leap year)
      expect(result.summary).toBeDefined();
      expect(result.summary?.totalPlanHours).toBe(0);
      expect(result.summary?.totalResultHours).toBe(0);
      expect(result.summary?.workDays).toBe(0);
    });
  });

  describe('getAvailableYearMonths', () => {
    it('should return list of year months', async () => {
      const mockYearMonths = [
        { year: 2025, month: 1 },
        { year: 2025, month: 2 },
        { year: 2024, month: 12 },
      ];

      vi.mocked(getAvailableYearMonths).mockResolvedValue(mockYearMonths);

      const result = await calendarDomain.getAvailableYearMonths({});

      expect(result.yearMonths).toHaveLength(3);
      expect(result.yearMonths).toEqual(mockYearMonths);
    });

    it('should return empty array when no reports exist', async () => {
      vi.mocked(getAvailableYearMonths).mockResolvedValue([]);

      const result = await calendarDomain.getAvailableYearMonths({});

      expect(result.yearMonths).toHaveLength(0);
    });
  });
});

