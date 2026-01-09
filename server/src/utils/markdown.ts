/**
 * Markdown パーサー・ジェネレーター
 * 
 * 日報のMarkdown形式を解析・生成する
 */

import type { DailyReport, ReportStats, ScheduleItem, TodoItem, TodoStatus } from '../types/index.js';

/**
 * Markdownコンテンツをパースして DailyReport オブジェクトに変換
 */
export function parseMarkdown(date: string, content: string): DailyReport {
  const report: DailyReport = {
    date,
    author: '',
    plan: [],
    result: [],
    todos: [],
    notes: '',
  };

  const lines = content.split('\n');
  let currentSection = '';
  let currentProject = '';
  const noteLines: string[] = [];
  let todoIdCounter = 0;
  let scheduleIdCounter = 0;
  
  // 終了時刻を保持（セクションごと）
  let planEndTime = '';
  let resultEndTime = '';

  // ヘッダー解析: # [日報] 著者名 日付
  const headerMatch = lines[0]?.match(/^#\s+\[日報\]\s+(.+?)\s+(\d{4}-\d{2}-\d{2})/);
  if (headerMatch) {
    report.author = headerMatch[1];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // セクション検出
    if (line.match(/^##\s+\[PLAN\]/i)) {
      currentSection = 'plan';
      continue;
    }
    if (line.match(/^##\s+\[RESULT\]/i)) {
      currentSection = 'result';
      continue;
    }
    if (line.match(/^##\s+\[TODO\]/i)) {
      currentSection = 'todo';
      continue;
    }
    if (line.match(/^##\s+\[NOTE\]/i)) {
      currentSection = 'note';
      continue;
    }

    // PLAN/RESULT のパース
    if ((currentSection === 'plan' || currentSection === 'result') && line.startsWith('*')) {
      // 時刻 [プロジェクト] タスク名 形式
      const match = line.match(/^\*\s+(\d{2}:\d{2})\s+\[([^\]]+)\]\s+(.+)$/);
      if (match) {
        const item: ScheduleItem = {
          id: `${currentSection[0]}${scheduleIdCounter++}`,
          time: match[1],
          project: match[2],
          task: match[3].trim(),
        };
        
        // メタデータ脚注のパース
        const footnoteMatch = item.task.match(/\[\^([^\]]+)\]$/);
        if (footnoteMatch) {
          item.task = item.task.replace(/\[\^[^\]]+\]$/, '').trim();
        }

        if (currentSection === 'plan') {
          report.plan.push(item);
        } else {
          report.result.push(item);
        }
      } else {
        // 終了時刻のみの行をチェック（* 17:00 のような形式）
        const endTimeMatch = line.match(/^\*\s+(\d{2}:\d{2})\s*$/);
        if (endTimeMatch) {
          const endTime = endTimeMatch[1];
          const items = currentSection === 'plan' ? report.plan : report.result;
          
          // 直前のアイテムのdurationを計算（休憩時間の前のアイテム）
          if (items.length > 0) {
            const lastItem = items[items.length - 1];
            if (lastItem.duration === undefined) {
              const startMinutes = timeToMinutes(lastItem.time);
              const endMinutes = timeToMinutes(endTime);
              lastItem.duration = endMinutes - startMinutes;
            }
          }
          
          // 最終終了時刻を更新
          if (currentSection === 'plan') {
            planEndTime = endTime;
          } else {
            resultEndTime = endTime;
          }
        }
      }
    }

    // TODOセクション内のプロジェクトグループ
    if (currentSection === 'todo' && line.match(/^###\s+/)) {
      const projectMatch = line.match(/^###\s+(\S+)/);
      if (projectMatch) {
        currentProject = projectMatch[1];
      }
      continue;
    }

    // TODO のパース
    if (currentSection === 'todo' && line.match(/^-\s+\[/)) {
      const todo = parseTodoLine(line, `t${todoIdCounter++}`, currentProject);
      if (todo) {
        // 詳細説明のパース（次の行が2スペースインデント）
        const descLines: string[] = [];
        let j = i + 1;
        while (j < lines.length && lines[j].match(/^\s{2}\S/)) {
          descLines.push(lines[j].trim());
          j++;
        }
        if (descLines.length > 0) {
          todo.description = descLines.join('\n');
        }
        report.todos.push(todo);
      }
    }

    // NOTE のパース
    if (currentSection === 'note' && !line.startsWith('##')) {
      noteLines.push(line);
    }
  }

  report.notes = noteLines.join('\n').trim();

  // durationを計算（終了時刻を考慮）
  calculateDurationsWithEndTime(report.plan, planEndTime);
  calculateDurationsWithEndTime(report.result, resultEndTime);

  return report;
}

/**
 * TODO行をパース
 */
function parseTodoLine(line: string, id: string, defaultProject: string): TodoItem | null {
  // - [ステータス] @期日 !!! タスク名 or - [ステータス] @期日 !!! [プロジェクト] タスク名
  const match = line.match(/^-\s+\[([xX\s*\->])\]\s*(.*)$/);
  if (!match) return null;

  const status = parseStatusMark(match[1]);
  let remainder = match[2].trim();

  // 期日パース @YYYY-MM-DD
  let deadline: string | undefined;
  const deadlineMatch = remainder.match(/@(\d{4}-\d{2}-\d{2})\s*/);
  if (deadlineMatch) {
    deadline = deadlineMatch[1];
    remainder = remainder.replace(deadlineMatch[0], '').trim();
  }

  // 優先度パース !!! / !! / !
  let priority: 'high' | 'medium' | 'low' | undefined;
  if (remainder.startsWith('!!!')) {
    priority = 'high';
    remainder = remainder.slice(3).trim();
  } else if (remainder.startsWith('!!')) {
    priority = 'medium';
    remainder = remainder.slice(2).trim();
  } else if (remainder.startsWith('!')) {
    priority = 'low';
    remainder = remainder.slice(1).trim();
  }

  // プロジェクトコードパース [P99]
  let project = defaultProject || 'P99';
  const projectMatch = remainder.match(/^\[([^\]]+)\]\s*/);
  if (projectMatch) {
    project = projectMatch[1];
    remainder = remainder.replace(projectMatch[0], '').trim();
  }

  return {
    id,
    project,
    task: remainder,
    status,
    deadline,
    priority,
  };
}

/**
 * ステータスマーク → TodoStatus
 */
function parseStatusMark(mark: string): TodoStatus {
  switch (mark.toLowerCase().trim()) {
    case 'x': return 'completed';
    case '*': return 'in_progress';
    case '-': return 'on_hold';
    case '>': return 'on_hold';
    default: return 'pending';
  }
}

/**
 * TodoStatus → ステータスマーク
 */
function getStatusMark(status: TodoStatus): string {
  switch (status) {
    case 'completed': return 'x';
    case 'in_progress': return '*';
    case 'on_hold': return '-';
    default: return ' ';
  }
}

/**
 * 優先度 → 記号
 */
function getPriorityMark(priority?: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high': return '!!! ';
    case 'medium': return '!! ';
    case 'low': return '! ';
    default: return '';
  }
}

/**
 * スケジュールアイテムのdurationを計算（終了時刻を考慮）
 * 既にdurationが設定されている場合はスキップ（休憩前のアイテム）
 */
function calculateDurationsWithEndTime(items: ScheduleItem[], endTime: string): void {
  for (let i = 0; i < items.length; i++) {
    // 既にdurationが設定されている場合はスキップ（休憩前のアイテムなど）
    if (items[i].duration !== undefined) {
      continue;
    }
    
    const startMinutes = timeToMinutes(items[i].time);
    let endMinutes: number;
    
    if (i < items.length - 1) {
      // 次のアイテムの開始時刻を終了時刻とする
      endMinutes = timeToMinutes(items[i + 1].time);
    } else if (endTime) {
      // 最後のアイテムは終了時刻を使用
      endMinutes = timeToMinutes(endTime);
    } else {
      // 終了時刻がない場合は1時間継続したものとして計算
      endMinutes = startMinutes + 60;
    }
    
    items[i].duration = endMinutes - startMinutes;
  }
}

/**
 * 時刻文字列 → 分
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 分を加算した時刻文字列を返す
 */
function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * スケジュールアイテムをMarkdown行として生成（休憩時間を考慮）
 */
function generateScheduleLines(items: ScheduleItem[], lines: string[]): void {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    lines.push(`* ${item.time} [${item.project}] ${item.task}`);
    
    // 休憩判定: このアイテムの終了時刻と次のアイテムの開始時刻が異なる場合
    if (item.duration !== undefined) {
      const endTime = addMinutesToTime(item.time, item.duration);
      
      if (i < items.length - 1) {
        const nextItem = items[i + 1];
        // 終了時刻と次の開始時刻が異なる場合、終了時刻行を出力（休憩）
        if (endTime !== nextItem.time) {
          lines.push(`* ${endTime}`);
        }
      } else {
        // 最後のアイテムは終了時刻を出力
        lines.push(`* ${endTime}`);
      }
    }
  }
}

/**
 * DailyReport オブジェクトからMarkdownコンテンツを生成
 */
export function generateMarkdown(report: DailyReport): string {
  const lines: string[] = [];

  lines.push(`# [日報] ${report.author} ${report.date}`);
  lines.push('');

  // PLAN
  lines.push('## [PLAN]');
  lines.push('');
  generateScheduleLines(report.plan, lines);
  lines.push('');

  // RESULT
  lines.push('## [RESULT]');
  lines.push('');
  generateScheduleLines(report.result, lines);
  lines.push('');

  // TODO - プロジェクト別グループ化
  lines.push('## [TODO]');
  lines.push('');

  // プロジェクトごとにグループ化
  const todosByProject: Record<string, TodoItem[]> = {};
  for (const todo of report.todos) {
    if (!todosByProject[todo.project]) {
      todosByProject[todo.project] = [];
    }
    todosByProject[todo.project].push(todo);
  }

  for (const [project, todos] of Object.entries(todosByProject)) {
    lines.push(`### ${project}`);
    for (const todo of todos) {
      const statusMark = getStatusMark(todo.status);
      const deadlineMark = todo.deadline ? `@${todo.deadline} ` : '';
      const priorityMark = getPriorityMark(todo.priority);
      lines.push(`- [${statusMark}] ${deadlineMark}${priorityMark}${todo.task}`);
      if (todo.description) {
        for (const descLine of todo.description.split('\n')) {
          lines.push(`  ${descLine}`);
        }
      }
    }
  }
  lines.push('');

  // NOTE
  if (report.notes) {
    lines.push('## [NOTE]');
    lines.push('');
    lines.push(report.notes);
  }

  return lines.join('\n');
}

/**
 * 統計情報を計算
 */
export function calculateStats(report: DailyReport): ReportStats {
  const projectHours: Record<string, number> = {};

  let planMinutes = 0;
  for (const item of report.plan) {
    planMinutes += item.duration || 0;
  }

  let resultMinutes = 0;
  for (const item of report.result) {
    const duration = item.duration || 0;
    resultMinutes += duration;
    projectHours[item.project] = (projectHours[item.project] || 0) + duration / 60;
  }

  return {
    planHours: planMinutes / 60,
    resultHours: resultMinutes / 60,
    todoCount: report.todos.length,
    todoCompleted: report.todos.filter(t => t.status === 'completed').length,
    todoInProgress: report.todos.filter(t => t.status === 'in_progress').length,
    projectHours,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * frontmatter付きMarkdownを生成
 */
export function generateMarkdownWithFrontmatter(report: DailyReport, stats: ReportStats): string {
  const frontmatter = [
    '---',
    `planHours: ${stats.planHours}`,
    `resultHours: ${stats.resultHours}`,
    `todoCount: ${stats.todoCount}`,
    `todoCompleted: ${stats.todoCompleted}`,
    `todoInProgress: ${stats.todoInProgress}`,
    `projectHours:`,
    ...Object.entries(stats.projectHours).map(([k, v]) => `  ${k}: ${v}`),
    `updatedAt: ${stats.updatedAt}`,
    '---',
    '',
  ];

  return frontmatter.join('\n') + generateMarkdown(report);
}

