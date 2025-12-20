/**
 * TODOのMarkdown操作
 */

import type { TodoItem } from '../../types';

/**
 * ステータスをMarkdownマークに変換
 */
function getStatusMark(status: string): string {
  switch (status) {
    case 'completed': return 'x';
    case 'in_progress': return '*';
    case 'on_hold': return '-';
    default: return ' ';
  }
}

/**
 * MarkdownマークをステータスにParse
 */
function parseStatusMark(mark: string): TodoItem['status'] {
  switch (mark.toLowerCase()) {
    case 'x': return 'completed';
    case '*': return 'in_progress';
    case '-': return 'on_hold';
    default: return 'pending';
  }
}

/**
 * TODOリストからMarkdownを生成
 */
export function generateTodoMarkdown(todos: TodoItem[], notes: string): string {
  const lines: string[] = ['## [TODO]', ''];
  
  // プロジェクト別にグループ化
  const grouped: Record<string, TodoItem[]> = {};
  for (const todo of todos) {
    if (!grouped[todo.project]) {
      grouped[todo.project] = [];
    }
    grouped[todo.project].push(todo);
  }
  
  for (const [project, items] of Object.entries(grouped)) {
    lines.push(`### ${project}`);
    for (const todo of items) {
      const statusMark = getStatusMark(todo.status);
      // 期日・優先度をタスク名の前に配置（!!!:高, !!:中, !:低）
      const deadline = todo.deadline ? `@${todo.deadline} ` : '';
      const priority = todo.priority === 'high' ? '!!! ' : todo.priority === 'medium' ? '!! ' : todo.priority === 'low' ? '! ' : '';
      lines.push(`- [${statusMark}] ${deadline}${priority}${todo.task}`);
      // 詳細説明がある場合はインデントして追加
      if (todo.description) {
        const descLines = todo.description.split('\n');
        for (const descLine of descLines) {
          lines.push(`  ${descLine}`);
        }
      }
    }
    lines.push('');
  }
  
  lines.push('## [NOTE]');
  lines.push(notes);
  
  return lines.join('\n');
}

/**
 * MarkdownからTODOリストを解析
 */
export function parseTodoMarkdown(markdown: string): { todos: TodoItem[]; notes: string } {
  const lines = markdown.split('\n');
  const todos: TodoItem[] = [];
  let currentProject = 'P99';
  let inNoteSection = false;
  const noteLines: string[] = [];
  let currentTodo: TodoItem | null = null;
  const descriptionLines: string[] = [];
  
  const savePendingTodo = () => {
    if (currentTodo) {
      if (descriptionLines.length > 0) {
        currentTodo.description = descriptionLines.join('\n');
      }
      todos.push(currentTodo);
      currentTodo = null;
      descriptionLines.length = 0;
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // NOTEセクション検出
    if (line.match(/^##\s+\[NOTE\]/i)) {
      savePendingTodo();
      inNoteSection = true;
      continue;
    }
    
    if (inNoteSection) {
      noteLines.push(line);
      continue;
    }
    
    // プロジェクトヘッダー検出
    const projectMatch = line.match(/^###\s+(\S+)/);
    if (projectMatch) {
      savePendingTodo();
      currentProject = projectMatch[1];
      continue;
    }
    
    // インデントされた行は詳細説明として扱う
    if (currentTodo && line.match(/^ {2}/)) {
      descriptionLines.push(line.substring(2)); // 先頭の2スペースを除去
      continue;
    }
    
    // TODO項目検出
    const todoMatch = line.match(/^-\s+\[([xX\s*-])\]\s+(.+)$/);
    if (todoMatch) {
      savePendingTodo();
      
      const statusMark = todoMatch[1];
      let taskText = todoMatch[2];
      
      // 期日を抽出 (@YYYY-MM-DD または @MM-DD) - 先頭にある場合
      let deadline: string | undefined;
      const deadlineMatch = taskText.match(/^@(\d{4}-\d{2}-\d{2}|\d{2}-\d{2})\s*/);
      if (deadlineMatch) {
        deadline = deadlineMatch[1];
        // 年がない場合は今年を補完
        if (deadline.length === 5) {
          deadline = `${new Date().getFullYear()}-${deadline}`;
        }
        taskText = taskText.substring(deadlineMatch[0].length);
      }
      
      // 優先度を抽出 - 先頭にある場合（!!!:高, !!:中, !:低）
      let priority: 'high' | 'medium' | 'low' | undefined;
      const priorityMatch = taskText.match(/^(!!!|!!|!)\s*/);
      if (priorityMatch) {
        const mark = priorityMatch[1];
        priority = mark === '!!!' ? 'high' : mark === '!!' ? 'medium' : 'low';
        taskText = taskText.substring(priorityMatch[0].length);
      }
      
      currentTodo = {
        id: `t${Date.now()}-${i}`,
        project: currentProject,
        task: taskText.trim(),
        status: parseStatusMark(statusMark),
        deadline,
        priority,
      };
    }
  }
  
  savePendingTodo();
  
  return {
    todos,
    notes: noteLines.join('\n').trim(),
  };
}

/**
 * 期限切れかどうかをチェック
 */
export function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

/**
 * 期限が近いかどうかをチェック（2日以内）
 */
export function isNearDeadline(deadline?: string): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 2;
}

