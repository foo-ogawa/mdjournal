/**
 * TODO markdown utilities tests
 */
import { describe, it, expect } from 'vitest';
import { 
  generateTodoLines, 
  generateTodoMarkdown, 
  parseTodoMarkdown,
  isOverdue,
  isNearDeadline,
} from './todo';
import type { TodoItem } from '../../types';

describe('generateTodoLines', () => {
  it('should generate basic TODO line', () => {
    const todos: TodoItem[] = [
      { id: 't1', project: 'P99', task: 'テストタスク', status: 'pending' },
    ];
    
    const lines = generateTodoLines(todos);
    
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('- [ ] [P99] テストタスク');
  });

  it('should generate TODO with all status types', () => {
    const todos: TodoItem[] = [
      { id: 't1', project: 'P99', task: 'pending', status: 'pending' },
      { id: 't2', project: 'P99', task: 'in_progress', status: 'in_progress' },
      { id: 't3', project: 'P99', task: 'completed', status: 'completed' },
      { id: 't4', project: 'P99', task: 'on_hold', status: 'on_hold' },
    ];
    
    const lines = generateTodoLines(todos);
    
    expect(lines[0]).toContain('[ ]');
    expect(lines[1]).toContain('[*]');
    expect(lines[2]).toContain('[x]');
    expect(lines[3]).toContain('[-]');
  });

  it('should include priority markers', () => {
    const todos: TodoItem[] = [
      { id: 't1', project: 'P99', task: 'high', status: 'pending', priority: 'high' },
      { id: 't2', project: 'P99', task: 'medium', status: 'pending', priority: 'medium' },
      { id: 't3', project: 'P99', task: 'low', status: 'pending', priority: 'low' },
    ];
    
    const lines = generateTodoLines(todos);
    
    expect(lines[0]).toContain('!!!high');
    expect(lines[1]).toContain('!!medium');
    expect(lines[2]).toContain('!low');
  });

  it('should include deadline', () => {
    const todos: TodoItem[] = [
      { id: 't1', project: 'P99', task: 'タスク', status: 'pending', deadline: '2025-01-10' },
    ];
    
    const lines = generateTodoLines(todos);
    
    expect(lines[0]).toContain('@2025-01-10');
  });

  it('should include description as indented lines', () => {
    const todos: TodoItem[] = [
      { 
        id: 't1', 
        project: 'P99', 
        task: 'タスク', 
        status: 'pending',
        description: '詳細説明\n続きの行',
      },
    ];
    
    const lines = generateTodoLines(todos);
    
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('  詳細説明');
    expect(lines[2]).toBe('  続きの行');
  });
});

describe('generateTodoMarkdown', () => {
  it('should generate complete markdown with sections', () => {
    const todos: TodoItem[] = [
      { id: 't1', project: 'P99', task: 'テストタスク', status: 'pending' },
    ];
    
    const markdown = generateTodoMarkdown(todos, 'ノート内容');
    
    expect(markdown).toContain('## [TODO]');
    expect(markdown).toContain('- [ ] [P99] テストタスク');
    expect(markdown).toContain('## [NOTE]');
    expect(markdown).toContain('ノート内容');
  });
});

describe('parseTodoMarkdown', () => {
  it('should parse basic TODO item', () => {
    const markdown = `## [TODO]

- [ ] [P99] テストタスク

## [NOTE]
`;
    
    const result = parseTodoMarkdown(markdown);
    
    expect(result.todos).toHaveLength(1);
    expect(result.todos[0].project).toBe('P99');
    expect(result.todos[0].task).toBe('テストタスク');
    expect(result.todos[0].status).toBe('pending');
  });

  it('should parse all status types', () => {
    const markdown = `## [TODO]

- [ ] [P99] pending
- [*] [P99] in_progress
- [x] [P99] completed
- [-] [P99] on_hold

## [NOTE]
`;
    
    const result = parseTodoMarkdown(markdown);
    
    expect(result.todos[0].status).toBe('pending');
    expect(result.todos[1].status).toBe('in_progress');
    expect(result.todos[2].status).toBe('completed');
    expect(result.todos[3].status).toBe('on_hold');
  });

  it('should parse priority markers', () => {
    const markdown = `## [TODO]

- [ ] [P99] !!!high priority
- [ ] [P99] !!medium priority
- [ ] [P99] !low priority

## [NOTE]
`;
    
    const result = parseTodoMarkdown(markdown);
    
    expect(result.todos[0].priority).toBe('high');
    expect(result.todos[0].task).toBe('high priority');
    expect(result.todos[1].priority).toBe('medium');
    expect(result.todos[2].priority).toBe('low');
  });

  it('should parse deadline at end of line', () => {
    const markdown = `## [TODO]

- [ ] [P99] タスク @2025-01-10

## [NOTE]
`;
    
    const result = parseTodoMarkdown(markdown);
    
    expect(result.todos[0].deadline).toBe('2025-01-10');
    expect(result.todos[0].task).toBe('タスク');
  });

  it('should parse notes section', () => {
    const markdown = `## [TODO]

- [ ] [P99] タスク

## [NOTE]
ノート内容
複数行のノート
`;
    
    const result = parseTodoMarkdown(markdown);
    
    expect(result.notes).toContain('ノート内容');
    expect(result.notes).toContain('複数行のノート');
  });

  it('should parse description lines', () => {
    const markdown = `## [TODO]

- [ ] [P99] タスク
  詳細説明1
  詳細説明2

## [NOTE]
`;
    
    const result = parseTodoMarkdown(markdown);
    
    expect(result.todos[0].description).toBe('詳細説明1\n詳細説明2');
  });

  it('should parse project headers', () => {
    const markdown = `## [TODO]

### P99
- [ ] タスク1

### P34
- [ ] タスク2

## [NOTE]
`;
    
    const result = parseTodoMarkdown(markdown);
    
    // Note: with [project] inline, the project header doesn't affect the task if inline project exists
    // But without inline project, it uses the header
    expect(result.todos).toHaveLength(2);
  });
});

describe('isOverdue', () => {
  it('should return false for undefined deadline', () => {
    expect(isOverdue(undefined)).toBe(false);
  });

  it('should return true for past deadline', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    expect(isOverdue(dateStr)).toBe(true);
  });

  it('should return false for today', () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    expect(isOverdue(dateStr)).toBe(false);
  });

  it('should return false for future deadline', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    expect(isOverdue(dateStr)).toBe(false);
  });
});

describe('isNearDeadline', () => {
  it('should return false for undefined deadline', () => {
    expect(isNearDeadline(undefined)).toBe(false);
  });

  it('should return true for today', () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    expect(isNearDeadline(dateStr)).toBe(true);
  });

  it('should return true for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    expect(isNearDeadline(dateStr)).toBe(true);
  });

  it('should return true for 2 days from now', () => {
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dateStr = dayAfterTomorrow.toISOString().split('T')[0];
    
    expect(isNearDeadline(dateStr)).toBe(true);
  });

  it('should return false for 3 days from now', () => {
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    const dateStr = threeDays.toISOString().split('T')[0];
    
    expect(isNearDeadline(dateStr)).toBe(false);
  });

  it('should return false for past deadline', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    expect(isNearDeadline(dateStr)).toBe(false);
  });
});

describe('roundtrip (generate then parse)', () => {
  it('should preserve data through generate-parse cycle', () => {
    const originalTodos: TodoItem[] = [
      { 
        id: 't1', 
        project: 'P99', 
        task: '高優先度タスク', 
        status: 'pending',
        priority: 'high',
        deadline: '2025-01-10',
      },
      { 
        id: 't2', 
        project: 'P34', 
        task: '進行中タスク', 
        status: 'in_progress',
      },
      { 
        id: 't3', 
        project: 'P99', 
        task: '完了タスク', 
        status: 'completed',
      },
    ];
    const originalNotes = 'テストノート';
    
    const markdown = generateTodoMarkdown(originalTodos, originalNotes);
    const parsed = parseTodoMarkdown(markdown);
    
    expect(parsed.todos).toHaveLength(3);
    
    // Check first todo
    expect(parsed.todos[0].project).toBe('P99');
    expect(parsed.todos[0].task).toBe('高優先度タスク');
    expect(parsed.todos[0].status).toBe('pending');
    expect(parsed.todos[0].priority).toBe('high');
    expect(parsed.todos[0].deadline).toBe('2025-01-10');
    
    // Check second todo
    expect(parsed.todos[1].project).toBe('P34');
    expect(parsed.todos[1].status).toBe('in_progress');
    
    // Check notes
    expect(parsed.notes).toBe('テストノート');
  });
});

