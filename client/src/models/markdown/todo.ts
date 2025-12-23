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
 * TODO項目をMarkdown行として生成（共通関数）
 * 標準形式: - [{status}] [{project}] {priority}{task} @{deadline}
 */
export function generateTodoLines(todos: TodoItem[]): string[] {
  const lines: string[] = [];
  
  for (const todo of todos) {
    const statusMark = getStatusMark(todo.status);
    // 優先度（!!!:高, !!:中, !:低）- タスク名の前に配置
    const priority = todo.priority === 'high' ? '!!!' : todo.priority === 'medium' ? '!!' : todo.priority === 'low' ? '!' : '';
    // 期日はタスク名の後ろに配置
    const deadline = todo.deadline ? ` @${todo.deadline}` : '';
    // 標準形式: - [status] [project] priority task @deadline
    lines.push(`- [${statusMark}] [${todo.project}] ${priority}${todo.task}${deadline}`);
    // 詳細説明がある場合はインデントして追加
    if (todo.description) {
      const descLines = todo.description.split('\n');
      for (const descLine of descLines) {
        lines.push(`  ${descLine}`);
      }
    }
  }
  
  return lines;
}

/**
 * TODOリストからMarkdownを生成（TODOセクション + NOTEセクション）
 */
export function generateTodoMarkdown(todos: TodoItem[], notes: string): string {
  const lines: string[] = ['## [TODO]', ''];
  lines.push(...generateTodoLines(todos));
  lines.push('');
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
      let todoProject = currentProject;
      
      // プロジェクトコードを先頭から抽出 ([PXX] 形式)
      const projectMatch = taskText.match(/^\[([^\]]+)\]\s*/);
      if (projectMatch) {
        todoProject = projectMatch[1];
        taskText = taskText.substring(projectMatch[0].length);
      }
      
      // 優先度を抽出 - 先頭にある場合（!!!:高, !!:中, !:低）
      let priority: 'high' | 'medium' | 'low' | undefined;
      const priorityMatch = taskText.match(/^(!!!|!!|!)/);
      if (priorityMatch) {
        const mark = priorityMatch[1];
        priority = mark === '!!!' ? 'high' : mark === '!!' ? 'medium' : 'low';
        taskText = taskText.substring(priorityMatch[0].length);
      }
      
      // 期日を抽出 (@YYYY-MM-DD または @MM-DD) - 末尾または先頭
      let deadline: string | undefined;
      // まず末尾から探す（標準形式）
      const deadlineEndMatch = taskText.match(/\s*@(\d{4}-\d{2}-\d{2}|\d{2}-\d{2})$/);
      if (deadlineEndMatch) {
        deadline = deadlineEndMatch[1];
        taskText = taskText.substring(0, taskText.length - deadlineEndMatch[0].length);
      } else {
        // 先頭から探す（レガシー形式）
        const deadlineStartMatch = taskText.match(/^@(\d{4}-\d{2}-\d{2}|\d{2}-\d{2})\s*/);
        if (deadlineStartMatch) {
          deadline = deadlineStartMatch[1];
          taskText = taskText.substring(deadlineStartMatch[0].length);
        }
      }
      // 年がない場合は今年を補完
      if (deadline && deadline.length === 5) {
        deadline = `${new Date().getFullYear()}-${deadline}`;
      }
      
      currentTodo = {
        id: `t${Date.now()}-${i}`,
        project: todoProject,
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

