/**
 * 日報全体のMarkdown操作
 */

import type { ScheduleItem, TodoItem, DailyReport } from '../../types';

/**
 * 日報からMarkdownを生成
 */
export function generateReportMarkdown(
  report: DailyReport,
  date: string,
  author: string = '名前'
): string {
  const formatItems = (items: ScheduleItem[]) =>
    items.map((item) => `* ${item.time} [${item.project}] ${item.task}`).join('\n');
  
  const formatTodos = (items: TodoItem[]) =>
    items.map((item) => {
      const status = item.status === 'completed' ? 'x' : item.status === 'in_progress' ? '*' : item.status === 'on_hold' ? '-' : ' ';
      const deadline = item.deadline ? `@${item.deadline} ` : '';
      const priority = item.priority === 'high' ? '!!! ' : item.priority === 'medium' ? '!! ' : item.priority === 'low' ? '! ' : '';
      return `- [${status}] ${deadline}${priority}[${item.project}] ${item.task}`;
    }).join('\n');

  return `# [日報] ${author} ${date}

## [PLAN]
${formatItems(report.plan)}

## [RESULT]
${formatItems(report.result)}

## [TODO]
${formatTodos(report.todos)}

## [NOTE]
${report.notes || ''}
`;
}

/**
 * 日報のMarkdownをパース
 */
export function parseReportMarkdown(markdown: string): Partial<DailyReport> {
  const lines = markdown.split('\n');
  const plan: ScheduleItem[] = [];
  const result: ScheduleItem[] = [];
  const todos: TodoItem[] = [];
  const noteLines: string[] = [];
  
  let currentSection: 'none' | 'plan' | 'result' | 'todo' | 'note' = 'none';
  let author = '';
  let date = '';
  
  // ヘッダー解析
  const headerMatch = lines[0]?.match(/^#\s+\[日報\]\s+(.+?)\s+(\d{4}-\d{2}-\d{2})/);
  if (headerMatch) {
    author = headerMatch[1];
    date = headerMatch[2];
  }
  
  for (const line of lines) {
    // セクション検出
    if (line.match(/^##\s+\[PLAN\]/i)) {
      currentSection = 'plan';
      continue;
    } else if (line.match(/^##\s+\[RESULT\]/i)) {
      currentSection = 'result';
      continue;
    } else if (line.match(/^##\s+\[TODO\]/i)) {
      currentSection = 'todo';
      continue;
    } else if (line.match(/^##\s+\[NOTE\]/i)) {
      currentSection = 'note';
      continue;
    }
    
    // 各セクションの内容を解析
    if (currentSection === 'plan' || currentSection === 'result') {
      const itemMatch = line.match(/^[*-]\s+(\d{1,2}:\d{2})\s+\[(\w+)\]\s+(.+)$/);
      if (itemMatch) {
        const item: ScheduleItem = {
          id: `${currentSection}-${Date.now()}-${plan.length + result.length}`,
          time: itemMatch[1].padStart(5, '0'),
          project: itemMatch[2],
          task: itemMatch[3].trim(),
        };
        if (currentSection === 'plan') {
          plan.push(item);
        } else {
          result.push(item);
        }
      }
    } else if (currentSection === 'todo') {
      const todoMatch = line.match(/^-\s+\[([xX\s*-])\]\s+(.+)$/);
      if (todoMatch) {
        const statusMark = todoMatch[1];
        let taskText = todoMatch[2];
        
        // プロジェクトコードを抽出
        const projectMatch = taskText.match(/^\[(\w+)\]\s*/);
        const project = projectMatch ? projectMatch[1] : 'P99';
        if (projectMatch) {
          taskText = taskText.substring(projectMatch[0].length);
        }
        
        // 期日を抽出
        let deadline: string | undefined;
        const deadlineMatch = taskText.match(/^@(\d{4}-\d{2}-\d{2}|\d{2}-\d{2})\s*/);
        if (deadlineMatch) {
          deadline = deadlineMatch[1];
          if (deadline.length === 5) {
            deadline = `${new Date().getFullYear()}-${deadline}`;
          }
          taskText = taskText.substring(deadlineMatch[0].length);
        }
        
        // 優先度を抽出
        let priority: 'high' | 'medium' | 'low' | undefined;
        const priorityMatch = taskText.match(/^(!!!|!!|!)\s*/);
        if (priorityMatch) {
          const mark = priorityMatch[1];
          priority = mark === '!!!' ? 'high' : mark === '!!' ? 'medium' : 'low';
          taskText = taskText.substring(priorityMatch[0].length);
        }
        
        const status = statusMark.toLowerCase() === 'x' ? 'completed' 
          : statusMark === '*' ? 'in_progress' 
          : statusMark === '-' ? 'on_hold' 
          : 'pending';
        
        todos.push({
          id: `todo-${Date.now()}-${todos.length}`,
          project,
          task: taskText.trim(),
          status: status as TodoItem['status'],
          deadline,
          priority,
        });
      }
    } else if (currentSection === 'note') {
      noteLines.push(line);
    }
  }
  
  return {
    date,
    author,
    plan,
    result,
    todos,
    notes: noteLines.join('\n').trim(),
  };
}

