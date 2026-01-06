/**
 * Markdown parser tests
 */
import { describe, it, expect } from 'vitest';
import { parseMarkdown, generateMarkdown, calculateStats } from './markdown.js';
import type { DailyReport, TodoItem } from '../types/index.js';

describe('parseMarkdown', () => {
  it('should parse header with author and date', () => {
    const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

## [NOTE]
`;
    const result = parseMarkdown('2025-01-06', content);
    
    expect(result.date).toBe('2025-01-06');
    expect(result.author).toBe('山田太郎');
  });

  it('should parse PLAN section items', () => {
    const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

* 08:30 [P99] タスク確認・整理
* 09:00 [P34] 開発作業
* 12:00

## [RESULT]

## [TODO]

## [NOTE]
`;
    const result = parseMarkdown('2025-01-06', content);
    
    expect(result.plan).toHaveLength(2);
    expect(result.plan[0].time).toBe('08:30');
    expect(result.plan[0].project).toBe('P99');
    expect(result.plan[0].task).toBe('タスク確認・整理');
    expect(result.plan[0].duration).toBe(30); // 08:30 to 09:00
    
    expect(result.plan[1].time).toBe('09:00');
    expect(result.plan[1].project).toBe('P34');
    expect(result.plan[1].duration).toBe(180); // 09:00 to 12:00
  });

  it('should parse RESULT section items', () => {
    const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

* 08:30 [P99] 実績タスク1
* 10:00 [P34] 実績タスク2
* 12:00

## [TODO]

## [NOTE]
`;
    const result = parseMarkdown('2025-01-06', content);
    
    expect(result.result).toHaveLength(2);
    expect(result.result[0].task).toBe('実績タスク1');
    expect(result.result[0].duration).toBe(90);
    expect(result.result[1].task).toBe('実績タスク2');
    expect(result.result[1].duration).toBe(120);
  });

  it('should parse TODO section with status marks', () => {
    const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

### P99
- [ ] 未着手タスク
- [*] 進行中タスク
- [x] 完了タスク
- [-] 保留タスク

## [NOTE]
`;
    const result = parseMarkdown('2025-01-06', content);
    
    expect(result.todos).toHaveLength(4);
    expect(result.todos[0].status).toBe('pending');
    expect(result.todos[0].task).toBe('未着手タスク');
    expect(result.todos[1].status).toBe('in_progress');
    expect(result.todos[2].status).toBe('completed');
    expect(result.todos[3].status).toBe('on_hold');
  });

  it('should parse TODO with deadline and priority', () => {
    const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

### P99
- [ ] @2025-01-10 !!! 高優先度タスク
- [ ] @2025-01-15 !! 中優先度タスク
- [ ] ! 低優先度タスク

## [NOTE]
`;
    const result = parseMarkdown('2025-01-06', content);
    
    expect(result.todos).toHaveLength(3);
    expect(result.todos[0].deadline).toBe('2025-01-10');
    expect(result.todos[0].priority).toBe('high');
    expect(result.todos[1].deadline).toBe('2025-01-15');
    expect(result.todos[1].priority).toBe('medium');
    expect(result.todos[2].priority).toBe('low');
  });

  it('should parse TODO with project code in task', () => {
    const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

### P99
- [ ] [P34] プロジェクトP34のタスク

## [NOTE]
`;
    const result = parseMarkdown('2025-01-06', content);
    
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0].project).toBe('P34');
    expect(result.todos[0].task).toBe('プロジェクトP34のタスク');
  });

  it('should parse NOTE section', () => {
    const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

## [NOTE]

本日の作業メモ:
- 障害対応が発生
- 明日に持ち越し
`;
    const result = parseMarkdown('2025-01-06', content);
    
    expect(result.notes).toContain('本日の作業メモ');
    expect(result.notes).toContain('障害対応が発生');
  });
});

describe('generateMarkdown', () => {
  it('should generate valid markdown from report', () => {
    const report: DailyReport = {
      date: '2025-01-06',
      author: '山田太郎',
      plan: [
        { id: 'p1', time: '09:00', project: 'P99', task: 'タスク確認', duration: 60 },
        { id: 'p2', time: '10:00', project: 'P34', task: '開発作業', duration: 120 },
      ],
      result: [
        { id: 'r1', time: '09:00', project: 'P99', task: 'タスク確認', duration: 60 },
      ],
      todos: [
        { id: 't1', project: 'P99', task: 'テストタスク', status: 'pending' },
      ],
      notes: 'メモ内容',
    };
    
    const markdown = generateMarkdown(report);
    
    expect(markdown).toContain('# [日報] 山田太郎 2025-01-06');
    expect(markdown).toContain('## [PLAN]');
    expect(markdown).toContain('* 09:00 [P99] タスク確認');
    expect(markdown).toContain('* 10:00 [P34] 開発作業');
    expect(markdown).toContain('## [RESULT]');
    expect(markdown).toContain('## [TODO]');
    expect(markdown).toContain('### P99');
    expect(markdown).toContain('- [ ] テストタスク');
    expect(markdown).toContain('## [NOTE]');
    expect(markdown).toContain('メモ内容');
  });

  it('should include deadline and priority in TODO', () => {
    const report: DailyReport = {
      date: '2025-01-06',
      author: '山田太郎',
      plan: [],
      result: [],
      todos: [
        { 
          id: 't1', 
          project: 'P99', 
          task: '優先タスク', 
          status: 'pending',
          deadline: '2025-01-10',
          priority: 'high',
        },
      ],
      notes: '',
    };
    
    const markdown = generateMarkdown(report);
    
    expect(markdown).toContain('@2025-01-10');
    expect(markdown).toContain('!!!');
  });
});

describe('calculateStats', () => {
  it('should calculate basic stats', () => {
    const report: DailyReport = {
      date: '2025-01-06',
      author: '山田太郎',
      plan: [
        { id: 'p1', time: '09:00', project: 'P99', task: 'タスク1', duration: 60 },
        { id: 'p2', time: '10:00', project: 'P34', task: 'タスク2', duration: 120 },
      ],
      result: [
        { id: 'r1', time: '09:00', project: 'P99', task: 'タスク1', duration: 90 },
        { id: 'r2', time: '10:30', project: 'P34', task: 'タスク2', duration: 60 },
      ],
      todos: [
        { id: 't1', project: 'P99', task: 'TODO1', status: 'pending' },
        { id: 't2', project: 'P99', task: 'TODO2', status: 'completed' },
        { id: 't3', project: 'P34', task: 'TODO3', status: 'in_progress' },
      ],
      notes: '',
    };
    
    const stats = calculateStats(report);
    
    expect(stats.planHours).toBe(3); // 60 + 120 = 180分 = 3時間
    expect(stats.resultHours).toBe(2.5); // 90 + 60 = 150分 = 2.5時間
    expect(stats.todoCount).toBe(3);
    expect(stats.todoCompleted).toBe(1);
    expect(stats.todoInProgress).toBe(1);
    expect(stats.projectHours['P99']).toBe(1.5); // 90分 = 1.5時間
    expect(stats.projectHours['P34']).toBe(1); // 60分 = 1時間
  });

  it('should handle empty report', () => {
    const report: DailyReport = {
      date: '2025-01-06',
      author: '山田太郎',
      plan: [],
      result: [],
      todos: [],
      notes: '',
    };
    
    const stats = calculateStats(report);
    
    expect(stats.planHours).toBe(0);
    expect(stats.resultHours).toBe(0);
    expect(stats.todoCount).toBe(0);
    expect(stats.todoCompleted).toBe(0);
    expect(stats.todoInProgress).toBe(0);
  });
});

describe('roundtrip (parse then generate)', () => {
  it('should preserve data through parse-generate cycle', () => {
    const originalContent = `# [日報] 山田太郎 2025-01-06

## [PLAN]

* 09:00 [P99] タスク確認・整理
* 10:00 [P34] 開発作業
* 12:00

## [RESULT]

* 09:00 [P99] タスク確認・整理
* 10:30

## [TODO]

### P99
- [ ] @2025-01-10 !!! 高優先度タスク
- [x] 完了タスク

## [NOTE]

本日のメモ
`;
    
    const parsed = parseMarkdown('2025-01-06', originalContent);
    const regenerated = generateMarkdown(parsed);
    const reparsed = parseMarkdown('2025-01-06', regenerated);
    
    // Core data should be preserved
    expect(reparsed.author).toBe(parsed.author);
    expect(reparsed.plan.length).toBe(parsed.plan.length);
    expect(reparsed.result.length).toBe(parsed.result.length);
    expect(reparsed.todos.length).toBe(parsed.todos.length);
    expect(reparsed.notes?.trim()).toBe(parsed.notes?.trim());
  });
});

