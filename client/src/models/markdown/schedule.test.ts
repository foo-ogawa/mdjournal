/**
 * Schedule Markdown operations tests
 */
import { describe, it, expect } from 'vitest';
import {
  generateScheduleLines,
  generateScheduleMarkdown,
  parseScheduleMarkdown,
  calculateRenderSlots,
  calculateBreakSlots,
  getTimeRange,
  topPercentToTime,
} from './schedule';
import type { ScheduleItem } from '../../types';

describe('generateScheduleLines', () => {
  it('should generate lines for schedule items', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
      { id: '2', time: '09:00', project: 'P34', task: '開発作業' },
    ];

    const lines = generateScheduleLines(items);

    expect(lines).toEqual([
      '* 08:00 [P99] 朝礼',
      '* 09:00 [P34] 開発作業',
    ]);
  });

  it('should generate end time line for break (empty task)', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
      { id: '2', time: '12:00', project: '', task: '' },
    ];

    const lines = generateScheduleLines(items);

    expect(lines).toEqual([
      '* 08:00 [P99] 朝礼',
      '* 12:00',
    ]);
  });

  it('should include description as indented lines', () => {
    const items: ScheduleItem[] = [
      { 
        id: '1', 
        time: '08:00', 
        project: 'P99', 
        task: 'ミーティング',
        description: '参加者: 山田、田中\n議題: 進捗確認',
      },
    ];

    const lines = generateScheduleLines(items);

    expect(lines).toEqual([
      '* 08:00 [P99] ミーティング',
      '  参加者: 山田、田中',
      '  議題: 進捗確認',
    ]);
  });
});

describe('generateScheduleMarkdown', () => {
  it('should generate markdown with title', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
    ];

    const markdown = generateScheduleMarkdown(items, '[PLAN]');

    expect(markdown).toBe('## [PLAN]\n* 08:00 [P99] 朝礼');
  });
});

describe('parseScheduleMarkdown', () => {
  it('should parse schedule items from markdown', () => {
    const markdown = `## [PLAN]
* 08:00 [P99] 朝礼
* 09:00 [P34] 開発作業
* 12:00`;

    const items = parseScheduleMarkdown(markdown);

    expect(items).toHaveLength(3);
    expect(items[0].time).toBe('08:00');
    expect(items[0].project).toBe('P99');
    expect(items[0].task).toBe('朝礼');
    expect(items[1].time).toBe('09:00');
    expect(items[2].time).toBe('12:00');
    expect(items[2].task).toBe('');
  });

  it('should parse items with dash list marker', () => {
    const markdown = `- 08:00 [P99] タスク`;

    const items = parseScheduleMarkdown(markdown);

    expect(items).toHaveLength(1);
    expect(items[0].project).toBe('P99');
  });

  it('should parse single digit hour', () => {
    const markdown = `* 8:00 [P99] 朝礼`;

    const items = parseScheduleMarkdown(markdown);

    expect(items).toHaveLength(1);
    expect(items[0].time).toBe('08:00');
  });

  it('should parse description lines', () => {
    const markdown = `* 08:00 [P99] ミーティング
  参加者: 山田
  議題: 進捗確認
* 09:00 [P34] 開発`;

    const items = parseScheduleMarkdown(markdown);

    expect(items).toHaveLength(2);
    expect(items[0].description).toBe('参加者: 山田\n議題: 進捗確認');
    expect(items[1].description).toBeUndefined();
  });

  it('should handle empty markdown', () => {
    const items = parseScheduleMarkdown('');

    expect(items).toHaveLength(0);
  });
});

describe('calculateRenderSlots', () => {
  it('should calculate render slots with duration', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
      { id: '2', time: '09:00', project: 'P34', task: '開発' },
      { id: '3', time: '12:00', project: '', task: '' }, // Break/End time
    ];

    const slots = calculateRenderSlots(items, 8, 12, 60);

    expect(slots).toHaveLength(2); // Breaks are excluded
    expect(slots[0].duration).toBe(60); // 8:00 - 9:00
    expect(slots[1].duration).toBe(180); // 9:00 - 12:00
  });

  it('should calculate position and size', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
      { id: '2', time: '10:00', project: 'P34', task: '開発' },
    ];

    const slots = calculateRenderSlots(items, 8, 12, 60);

    expect(slots[0].top).toBe(0); // Start at beginning
    expect(slots[0].topPx).toBe(0);
    expect(slots[1].top).toBeCloseTo(100 * (2 * 60) / (12 * 60)); // 2 hours in
  });

  it('should use default duration for last item', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
    ];

    const slots = calculateRenderSlots(items);

    expect(slots[0].duration).toBe(60); // Default 60 minutes
  });

  it('should handle empty items', () => {
    const slots = calculateRenderSlots([]);

    expect(slots).toHaveLength(0);
  });

  it('should sort items by time', () => {
    const items: ScheduleItem[] = [
      { id: '2', time: '10:00', project: 'P34', task: '開発' },
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
    ];

    const slots = calculateRenderSlots(items);

    expect(slots[0].time).toBe('08:00');
    expect(slots[1].time).toBe('10:00');
  });
});

describe('calculateBreakSlots', () => {
  it('should calculate break slots', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
      { id: '2', time: '12:00', project: '', task: '' }, // Break start
      { id: '3', time: '13:00', project: 'P34', task: '開発' }, // Work resumes
    ];

    const breaks = calculateBreakSlots(items, 8, 12, 60);

    expect(breaks).toHaveLength(1);
    expect(breaks[0].startTime).toBe('12:00');
    expect(breaks[0].endTime).toBe('13:00');
    expect(breaks[0].duration).toBe(60);
  });

  it('should not render last break (end of day)', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
      { id: '2', time: '18:00', project: '', task: '' }, // End of day
    ];

    const breaks = calculateBreakSlots(items);

    expect(breaks).toHaveLength(0);
  });

  it('should handle empty items', () => {
    const breaks = calculateBreakSlots([]);

    expect(breaks).toHaveLength(0);
  });
});

describe('getTimeRange', () => {
  it('should return default range for empty items', () => {
    const range = getTimeRange([]);

    expect(range.startHour).toBe(8);
    expect(range.endHour).toBe(20);
    expect(range.totalHours).toBe(12);
  });

  it('should calculate range from items', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '06:00', project: 'P99', task: '早朝' },
      { id: '2', time: '22:00', project: 'P34', task: '深夜' },
    ];

    const range = getTimeRange(items);

    expect(range.startHour).toBe(4); // 6:00 - 2 hours
    expect(range.endHour).toBe(25); // 22:00 + 1 hour + 2 hours
  });

  it('should not go below 0 for start hour', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '00:30', project: 'P99', task: '深夜' },
    ];

    const range = getTimeRange(items);

    expect(range.startHour).toBe(0);
  });

  it('should respect maxHours option', () => {
    const items: ScheduleItem[] = [
      { id: '1', time: '06:00', project: 'P99', task: '早朝' },
      { id: '2', time: '35:00', project: 'P34', task: '翌日' },
    ];

    const range = getTimeRange(items, { maxHours: 24 });

    expect(range.totalHours).toBeLessThanOrEqual(24);
  });

  it('should use custom defaults', () => {
    const range = getTimeRange([], {
      defaultStartHour: 9,
      defaultEndHour: 18,
    });

    expect(range.startHour).toBe(9);
    expect(range.endHour).toBe(18);
    expect(range.totalHours).toBe(9);
  });
});

describe('topPercentToTime', () => {
  it('should convert top percent to time', () => {
    // At 0%, should be start hour
    expect(topPercentToTime(0, 0, 8, 12)).toBe('08:00');
    
    // At 50%, should be 6 hours after start (14:00)
    expect(topPercentToTime(50, 0, 8, 12)).toBe('14:00');
    
    // At 100%, should be end hour
    expect(topPercentToTime(100, 0, 8, 12)).toBe('20:00');
  });

  it('should apply offset', () => {
    // offset 10% with 12 hours total = 1.2 hours = 72 minutes
    // 8:00 + 72 minutes = 9:12, snapped to 15 minutes = 9:15
    expect(topPercentToTime(0, 10, 8, 12)).toBe('09:15');
  });

  it('should snap to specified minutes', () => {
    // 5% should snap to nearest 15 minutes
    const time = topPercentToTime(5, 0, 8, 12, 15);
    expect(time).toMatch(/:\d{2}$/);
    const minutes = parseInt(time.split(':')[1]);
    expect(minutes % 15).toBe(0);
  });

  it('should clamp values to 0-100%', () => {
    expect(topPercentToTime(-10, 0, 8, 12)).toBe('08:00');
    expect(topPercentToTime(110, 0, 8, 12)).toBe('20:00');
  });
});

