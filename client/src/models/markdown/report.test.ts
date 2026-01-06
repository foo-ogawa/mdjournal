/**
 * Report Markdown operations tests
 */
import { describe, it, expect } from 'vitest';
import { generateReportMarkdown, parseReportMarkdown } from './report';
import type { DailyReport, ScheduleItem, TodoItem } from '../../types';

describe('generateReportMarkdown', () => {
  it('should generate markdown for a complete report', () => {
    const report: DailyReport = {
      date: '2025-01-06',
      author: '山田太郎',
      plan: [
        { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
        { id: '2', time: '09:00', project: 'P34', task: '開発' },
      ],
      result: [
        { id: '3', time: '08:00', project: 'P99', task: '朝礼' },
        { id: '4', time: '09:30', project: 'P34', task: '開発（遅延）' },
      ],
      todos: [
        { id: '5', project: 'P34', task: 'レビュー対応', status: 'pending' },
        { id: '6', project: 'P99', task: 'ドキュメント更新', status: 'completed', deadline: '2025-01-10' },
      ],
      notes: 'メモ内容',
    };

    const markdown = generateReportMarkdown(report, '2025-01-06', '山田太郎');

    expect(markdown).toContain('# [日報] 山田太郎 2025-01-06');
    expect(markdown).toContain('## [PLAN]');
    expect(markdown).toContain('* 08:00 [P99] 朝礼');
    expect(markdown).toContain('## [RESULT]');
    expect(markdown).toContain('* 09:30 [P34] 開発（遅延）');
    expect(markdown).toContain('## [TODO]');
    expect(markdown).toContain('- [ ] [P34] レビュー対応');
    expect(markdown).toContain('- [x] @2025-01-10 [P99] ドキュメント更新');
    expect(markdown).toContain('## [NOTE]');
    expect(markdown).toContain('メモ内容');
  });

  it('should format TODO status correctly', () => {
    const report: DailyReport = {
      date: '2025-01-06',
      author: '山田太郎',
      plan: [],
      result: [],
      todos: [
        { id: '1', project: 'P99', task: '未着手', status: 'pending' },
        { id: '2', project: 'P99', task: '進行中', status: 'in_progress' },
        { id: '3', project: 'P99', task: '保留', status: 'on_hold' },
        { id: '4', project: 'P99', task: '完了', status: 'completed' },
      ],
      notes: '',
    };

    const markdown = generateReportMarkdown(report, '2025-01-06');

    expect(markdown).toContain('- [ ] [P99] 未着手');
    expect(markdown).toContain('- [*] [P99] 進行中');
    expect(markdown).toContain('- [-] [P99] 保留');
    expect(markdown).toContain('- [x] [P99] 完了');
  });

  it('should format TODO priority correctly', () => {
    const report: DailyReport = {
      date: '2025-01-06',
      author: '山田太郎',
      plan: [],
      result: [],
      todos: [
        { id: '1', project: 'P99', task: '高優先', status: 'pending', priority: 'high' },
        { id: '2', project: 'P99', task: '中優先', status: 'pending', priority: 'medium' },
        { id: '3', project: 'P99', task: '低優先', status: 'pending', priority: 'low' },
      ],
      notes: '',
    };

    const markdown = generateReportMarkdown(report, '2025-01-06');

    expect(markdown).toContain('!!! [P99] 高優先');
    expect(markdown).toContain('!! [P99] 中優先');
    expect(markdown).toContain('! [P99] 低優先');
  });

  it('should use default author name', () => {
    const report: DailyReport = {
      date: '2025-01-06',
      plan: [],
      result: [],
      todos: [],
      notes: '',
    };

    const markdown = generateReportMarkdown(report, '2025-01-06');

    expect(markdown).toContain('# [日報] 名前 2025-01-06');
  });
});

describe('parseReportMarkdown', () => {
  it('should parse header', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

## [NOTE]
`;

    const report = parseReportMarkdown(markdown);

    expect(report.date).toBe('2025-01-06');
    expect(report.author).toBe('山田太郎');
  });

  it('should parse PLAN items', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [PLAN]
* 08:00 [P99] 朝礼
* 09:00 [P34] 開発
- 10:00 [P34] レビュー

## [RESULT]
`;

    const report = parseReportMarkdown(markdown);

    expect(report.plan).toHaveLength(3);
    expect(report.plan?.[0].time).toBe('08:00');
    expect(report.plan?.[0].project).toBe('P99');
    expect(report.plan?.[0].task).toBe('朝礼');
  });

  it('should parse RESULT items', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]
* 08:00 [P99] 朝礼
* 9:30 [P34] 開発（遅延）
`;

    const report = parseReportMarkdown(markdown);

    expect(report.result).toHaveLength(2);
    expect(report.result?.[0].time).toBe('08:00');
    expect(report.result?.[1].time).toBe('09:30');
    expect(report.result?.[1].task).toBe('開発（遅延）');
  });

  it('should parse TODO items with status', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [TODO]
- [ ] [P99] 未着手
- [*] [P99] 進行中
- [-] [P99] 保留
- [x] [P99] 完了
- [X] [P99] 完了2
`;

    const report = parseReportMarkdown(markdown);

    expect(report.todos).toHaveLength(5);
    expect(report.todos?.[0].status).toBe('pending');
    expect(report.todos?.[1].status).toBe('in_progress');
    expect(report.todos?.[2].status).toBe('on_hold');
    expect(report.todos?.[3].status).toBe('completed');
    expect(report.todos?.[4].status).toBe('completed');
  });

  it('should parse TODO items with deadline', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [TODO]
- [ ] @2025-01-10 [P99] 期限付きタスク
- [ ] @01-15 [P99] 短縮形式の期限
`;

    const report = parseReportMarkdown(markdown);

    expect(report.todos?.[0].deadline).toBe('2025-01-10');
    expect(report.todos?.[1].deadline).toMatch(/^\d{4}-01-15$/); // Year is added
  });

  it('should parse TODO items with priority', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [TODO]
- [ ] !!! [P99] 高優先
- [ ] !! [P99] 中優先
- [ ] ! [P99] 低優先
`;

    const report = parseReportMarkdown(markdown);

    expect(report.todos?.[0].priority).toBe('high');
    expect(report.todos?.[1].priority).toBe('medium');
    expect(report.todos?.[2].priority).toBe('low');
  });

  it('should parse TODO items without project code', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [TODO]
- [ ] プロジェクトなしタスク
`;

    const report = parseReportMarkdown(markdown);

    expect(report.todos?.[0].project).toBe('P99'); // Default project
    expect(report.todos?.[0].task).toBe('プロジェクトなしタスク');
  });

  it('should parse NOTE section', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [NOTE]
メモ1行目
メモ2行目

空行を含むメモ
`;

    const report = parseReportMarkdown(markdown);

    expect(report.notes).toContain('メモ1行目');
    expect(report.notes).toContain('メモ2行目');
    expect(report.notes).toContain('空行を含むメモ');
  });

  it('should handle empty sections', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

## [NOTE]
`;

    const report = parseReportMarkdown(markdown);

    expect(report.plan).toHaveLength(0);
    expect(report.result).toHaveLength(0);
    expect(report.todos).toHaveLength(0);
    expect(report.notes).toBe('');
  });

  it('should handle case-insensitive section headers', () => {
    const markdown = `# [日報] 山田太郎 2025-01-06

## [plan]
* 08:00 [P99] 朝礼

## [result]
* 08:00 [P99] 朝礼

## [todo]

## [note]
メモ
`;

    const report = parseReportMarkdown(markdown);

    expect(report.plan).toHaveLength(1);
    expect(report.result).toHaveLength(1);
    expect(report.notes).toContain('メモ');
  });
});

describe('roundtrip (generate -> parse)', () => {
  it('should preserve data through roundtrip', () => {
    const original: DailyReport = {
      date: '2025-01-06',
      author: '山田太郎',
      plan: [
        { id: '1', time: '08:00', project: 'P99', task: '朝礼' },
      ],
      result: [
        { id: '2', time: '08:00', project: 'P99', task: '朝礼' },
      ],
      todos: [
        { id: '3', project: 'P34', task: 'タスク', status: 'pending' },
      ],
      notes: 'メモ',
    };

    const markdown = generateReportMarkdown(original, '2025-01-06', '山田太郎');
    const parsed = parseReportMarkdown(markdown);

    expect(parsed.date).toBe(original.date);
    expect(parsed.author).toBe(original.author);
    expect(parsed.plan).toHaveLength(original.plan.length);
    expect(parsed.plan?.[0].time).toBe(original.plan[0].time);
    expect(parsed.result).toHaveLength(original.result.length);
    expect(parsed.todos).toHaveLength(original.todos.length);
    expect(parsed.notes).toContain(original.notes);
  });
});

