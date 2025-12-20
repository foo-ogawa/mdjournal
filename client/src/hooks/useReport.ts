/**
 * 日報管理フック
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { reportApi } from '../api/client';
import type { DailyReport, ReportStats, ScheduleItem, TodoItem } from '../types';
import dayjs from 'dayjs';

interface UseReportReturn {
  // 状態
  report: DailyReport | null;
  markdownContent: string;
  stats: ReportStats | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  isDirty: boolean;
  
  // アクション
  loadReport: (date: string) => Promise<void>;
  saveReport: (options?: { git?: { commit?: boolean; push?: boolean; message?: string }; slack?: { post?: boolean } }) => Promise<boolean>;
  deleteReport: () => Promise<boolean>;
  
  // 日報データ操作
  updatePlan: (plan: ScheduleItem[]) => void;
  updateResult: (result: ScheduleItem[]) => void;
  updateTodos: (todos: TodoItem[]) => void;
  updateNotes: (notes: string) => void;
  updateMarkdown: (content: string) => void;
  
  // TODO操作
  addTodo: (todo: Omit<TodoItem, 'id'>) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  toggleTodoStatus: (id: string) => void;
  
  // PLAN/RESULT操作
  addScheduleItem: (type: 'plan' | 'result', item: Omit<ScheduleItem, 'id'>) => void;
  updateScheduleItem: (type: 'plan' | 'result', id: string, updates: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (type: 'plan' | 'result', id: string) => void;
  
  // ルーチン適用
  applyRoutine: (routineItems: ScheduleItem[]) => void;
  
  // 計画を実績にコピー
  copyPlanToResult: () => void;
}

export function useReport(initialDate?: string): UseReportReturn {
  const [currentDate, setCurrentDate] = useState(initialDate || dayjs().format('YYYY-MM-DD'));
  const [report, setReport] = useState<DailyReport | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // 日報読み込み
  const loadReport = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    setCurrentDate(date);
    
    try {
      const response = await reportApi.get(date);
      if (response) {
        setStats(response.stats);
        // Markdownからパースした日報オブジェクト
        setReport(parseReportFromMarkdown(date, response.content));
      } else {
        // 新規日報 - 前日の未完了TODOを持ち越し
        const newReport = createEmptyReport(date);
        
        // 前日の日報から未完了TODOを取得
        const previousDate = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
        try {
          const previousReport = await reportApi.get(previousDate);
          if (previousReport) {
            const previousReportData = parseReportFromMarkdown(previousDate, previousReport.content);
            // 未完了のTODOのみを持ち越し（completed以外）
            const incompleteTodos = previousReportData.todos.filter(
              todo => todo.status !== 'completed'
            );
            // IDを再生成して追加
            newReport.todos = incompleteTodos.map((todo, index) => ({
              ...todo,
              id: `carryover-${Date.now()}-${index}`,
            }));
          }
        } catch {
          // 前日の日報がない場合は無視
        }
        
        setReport(newReport);
        setStats(null);
      }
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // 日報保存
  const saveReport = useCallback(async (options?: { git?: { commit?: boolean; push?: boolean }; slack?: { post?: boolean } }) => {
    if (!report) return false;
    
    setSaving(true);
    setError(null);
    
    try {
      const content = generateMarkdownFromReport(report);
      const response = await reportApi.save(currentDate, {
        content,
        git: options?.git,
        slack: options?.slack,
      });
      
      if (response.saved) {
        setStats(response.stats);
        setIsDirty(false);
        
        // 保存後、サーバーから最新データを再取得（frontmatter等が更新されている可能性）
        const latestResponse = await reportApi.get(currentDate);
        if (latestResponse) {
          setReport(parseReportFromMarkdown(currentDate, latestResponse.content));
          setStats(latestResponse.stats);
        }
        
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
      return false;
    } finally {
      setSaving(false);
    }
  }, [report, currentDate]);

  // 日報削除
  const deleteReport = useCallback(async () => {
    try {
      const result = await reportApi.delete(currentDate);
      if (result) {
        setReport(null);
        setStats(null);
        setIsDirty(false);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
      return false;
    }
  }, [currentDate]);

  // PLAN更新
  const updatePlan = useCallback((plan: ScheduleItem[]) => {
    setReport(prev => prev ? { ...prev, plan } : null);
    setIsDirty(true);
  }, []);

  // RESULT更新
  const updateResult = useCallback((result: ScheduleItem[]) => {
    setReport(prev => prev ? { ...prev, result } : null);
    setIsDirty(true);
  }, []);

  // TODO更新
  const updateTodos = useCallback((todos: TodoItem[]) => {
    setReport(prev => prev ? { ...prev, todos } : null);
    setIsDirty(true);
  }, []);

  // NOTE更新
  const updateNotes = useCallback((notes: string) => {
    setReport(prev => prev ? { ...prev, notes } : null);
    setIsDirty(true);
  }, []);

  // Markdown直接更新
  const updateMarkdown = useCallback((content: string) => {
    const parsed = parseReportFromMarkdown(currentDate, content);
    setReport(parsed);
    setIsDirty(true);
  }, [currentDate]);

  // TODO追加
  const addTodo = useCallback((todo: Omit<TodoItem, 'id'>) => {
    setReport(prev => {
      if (!prev) return null;
      const newTodo: TodoItem = {
        ...todo,
        id: `t${Date.now()}`,
      };
      return { ...prev, todos: [...prev.todos, newTodo] };
    });
    setIsDirty(true);
  }, []);

  // TODO更新
  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        todos: prev.todos.map(t => t.id === id ? { ...t, ...updates } : t),
      };
    });
    setIsDirty(true);
  }, []);

  // TODO削除
  const deleteTodo = useCallback((id: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        todos: prev.todos.filter(t => t.id !== id),
      };
    });
    setIsDirty(true);
  }, []);

  // TODOステータス切り替え（未着手→進行中→完了→保留→未着手）
  const toggleTodoStatus = useCallback((id: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        todos: prev.todos.map(t => {
          if (t.id !== id) return t;
          const nextStatus: Record<string, TodoItem['status']> = {
            'pending': 'in_progress',
            'in_progress': 'completed',
            'completed': 'on_hold',
            'on_hold': 'pending',
          };
          return { ...t, status: nextStatus[t.status] || 'pending' };
        }),
      };
    });
    setIsDirty(true);
  }, []);

  // スケジュールアイテム追加
  const addScheduleItem = useCallback((type: 'plan' | 'result', item: Omit<ScheduleItem, 'id'>) => {
    setReport(prev => {
      if (!prev) return null;
      const newItem: ScheduleItem = {
        ...item,
        id: `${type[0]}${Date.now()}`,
      };
      const items = [...prev[type], newItem].sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [type]: items };
    });
    setIsDirty(true);
  }, []);

  // スケジュールアイテム更新
  const updateScheduleItem = useCallback((type: 'plan' | 'result', id: string, updates: Partial<ScheduleItem>) => {
    setReport(prev => {
      if (!prev) return null;
      const items = prev[type].map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      // 時間でソート
      items.sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, [type]: items };
    });
    setIsDirty(true);
  }, []);

  // スケジュールアイテム削除
  const deleteScheduleItem = useCallback((type: 'plan' | 'result', id: string) => {
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [type]: prev[type].filter(item => item.id !== id),
      };
    });
    setIsDirty(true);
  }, []);

  // ルーチン適用
  const applyRoutine = useCallback((routineItems: ScheduleItem[]) => {
    setReport(prev => {
      if (!prev) return null;
      const newItems = routineItems.map((item, index) => ({
        ...item,
        id: `p${Date.now()}-${index}`,
      }));
      const merged = [...prev.plan, ...newItems].sort((a, b) => a.time.localeCompare(b.time));
      return { ...prev, plan: merged };
    });
    setIsDirty(true);
  }, []);

  // 計画を実績にコピー
  const copyPlanToResult = useCallback(() => {
    setReport(prev => {
      if (!prev) return null;
      const resultItems = prev.plan.map((item, index) => ({
        ...item,
        id: `r${Date.now()}-${index}`,
      }));
      return { ...prev, result: resultItems };
    });
    setIsDirty(true);
  }, []);

  // 初期読み込み
  useEffect(() => {
    if (initialDate) {
      loadReport(initialDate);
    }
  }, [initialDate, loadReport]);

  // 現在のreportから生成されるMarkdown（リアルタイム）
  const currentMarkdown = useMemo(() => {
    if (!report) return '';
    return generateMarkdownFromReport(report);
  }, [report]);

  return {
    report,
    markdownContent: currentMarkdown, // 常に最新のreportから生成
    stats,
    loading,
    saving,
    error,
    isDirty,
    loadReport,
    saveReport,
    deleteReport,
    updatePlan,
    updateResult,
    updateTodos,
    updateNotes,
    updateMarkdown,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoStatus,
    addScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    applyRoutine,
    copyPlanToResult,
  };
}

// ===========================================
// ヘルパー関数
// ===========================================

function createEmptyReport(date: string): DailyReport {
  return {
    date,
    author: '',
    plan: [],
    result: [],
    todos: [],
    notes: '',
  };
}

function parseReportFromMarkdown(date: string, content: string): DailyReport {
  const report: DailyReport = createEmptyReport(date);
  const lines = content.split('\n');
  let currentSection = '';
  let currentTodoProject = 'P99'; // TODOセクション内の現在のプロジェクト
  const noteLines: string[] = [];

  // ヘッダー解析
  const headerMatch = lines[0]?.match(/^#\s+\[日報\]\s+(.+?)\s+(\d{4}-\d{2}-\d{2})/);
  if (headerMatch) {
    report.author = headerMatch[1];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // セクション検出
    if (line.match(/^##\s+\[PLAN\]/i)) { currentSection = 'plan'; continue; }
    if (line.match(/^##\s+\[RESULT\]/i)) { currentSection = 'result'; continue; }
    if (line.match(/^##\s+\[TODO\]/i)) { currentSection = 'todo'; continue; }
    if (line.match(/^##\s+\[NOTE\]/i)) { currentSection = 'note'; continue; }

    // TODOセクション内のプロジェクトヘッダー検出 (### P99 など)
    if (currentSection === 'todo' && line.match(/^###\s+(.+)$/)) {
      const projectMatch = line.match(/^###\s+(.+)$/);
      if (projectMatch) {
        currentTodoProject = projectMatch[1].trim();
      }
      continue;
    }

    // PLAN/RESULT のパース
    if ((currentSection === 'plan' || currentSection === 'result') && line.startsWith('*')) {
      // 通常形式: * 08:30 [P99] タスク名
      const match = line.match(/^\*\s+(\d{2}:\d{2})\s+\[([^\]]+)\]\s+(.+)$/);
      if (match) {
        const item: ScheduleItem = {
          id: `${currentSection[0]}${i}`,
          time: match[1],
          project: match[2],
          task: match[3],
        };
        if (currentSection === 'plan') {
          report.plan.push(item);
        } else {
          report.result.push(item);
        }
        continue;
      }
      
      // 終了時刻のみの行: * 18:00（休憩スロットとして追加）
      const endTimeMatch = line.match(/^\*\s+(\d{2}:\d{2})\s*$/);
      if (endTimeMatch) {
        // 休憩スロット（task が空）として追加
        const breakItem: ScheduleItem = {
          id: `break${currentSection[0]}${i}`,
          time: endTimeMatch[1],
          project: '',
          task: '', // 空のtaskは休憩を示す
        };
        if (currentSection === 'plan') {
          report.plan.push(breakItem);
        } else {
          report.result.push(breakItem);
        }
      }
    }

    // TODO のパース（新形式: - [x] @2025-12-18 !!! タスク名）
    if (currentSection === 'todo' && line.startsWith('-')) {
      // 新形式: - [x] @YYYY-MM-DD !!! タスク名
      const newFormatMatch = line.match(/^-\s+\[([xX\s\*\->])\]\s+(?:@(\d{4}-\d{2}-\d{2})\s+)?(?:(!!!|!!|!)\s+)?(.+)$/);
      if (newFormatMatch) {
        const priorityMap: Record<string, TodoItem['priority']> = {
          '!!!': 'high',
          '!!': 'medium',
          '!': 'low',
        };
        const todo: TodoItem = {
          id: `t${i}`,
          status: parseStatusMark(newFormatMatch[1]),
          project: currentTodoProject,
          deadline: newFormatMatch[2],
          priority: newFormatMatch[3] ? priorityMap[newFormatMatch[3]] : undefined,
          task: newFormatMatch[4].trim(),
        };
        report.todos.push(todo);
        continue;
      }
      
      // 旧形式: - [x] [プロジェクト] タスク名（期限）
      const oldFormatMatch = line.match(/^-\s+\[([xX\s\*\->])\]\s+(?:\[([^\]]+)\]\s+)?(.+?)(?:（([^）]+)）)?$/);
      if (oldFormatMatch) {
        const todo: TodoItem = {
          id: `t${i}`,
          status: parseStatusMark(oldFormatMatch[1]),
          project: oldFormatMatch[2] || currentTodoProject,
          task: oldFormatMatch[3],
          deadline: oldFormatMatch[4],
        };
        report.todos.push(todo);
      }
    }

    // TODO の詳細説明（インデントされた行）
    if (currentSection === 'todo' && line.match(/^\s{2,}/) && report.todos.length > 0) {
      const lastTodo = report.todos[report.todos.length - 1];
      const descLine = line.trim();
      if (lastTodo.description) {
        lastTodo.description += '\n' + descLine;
      } else {
        lastTodo.description = descLine;
      }
      continue;
    }

    // NOTE のパース
    if (currentSection === 'note' && !line.startsWith('##')) {
      noteLines.push(line);
    }
  }

  report.notes = noteLines.join('\n').trim();

  return report;
}

function generateMarkdownFromReport(report: DailyReport): string {
  const lines: string[] = [];
  
  lines.push(`# [日報] ${report.author || '名前'} ${report.date}`);
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
  
  // TODO（プロジェクト別にグループ化）
  lines.push('## [TODO]');
  lines.push('');
  
  // プロジェクト別にグループ化
  const todosByProject: Record<string, typeof report.todos> = {};
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
  
  if (Object.keys(todosByProject).length === 0) {
    lines.push('');
  }
  
  // NOTE
  lines.push('## [NOTE]');
  lines.push('');
  lines.push(report.notes || '');
  
  return lines.join('\n');
}


/**
 * スケジュールアイテムをMarkdown行として生成
 * 休憩スロット（task が空）は終了時刻行として出力
 */
function generateScheduleLines(items: ScheduleItem[], lines: string[]): void {
  for (const item of items) {
    if (!item.task) {
      // 休憩スロット（task が空）は終了時刻行として出力
      lines.push(`* ${item.time}`);
    } else {
      lines.push(`* ${item.time} [${item.project}] ${item.task}`);
    }
  }
}

function getStatusMark(status: string): string {
  switch (status) {
    case 'completed': return 'x';
    case 'in_progress': return '*';
    case 'on_hold': return '-';
    default: return ' ';
  }
}

function parseStatusMark(mark: string): TodoItem['status'] {
  switch (mark.toLowerCase()) {
    case 'x': return 'completed';
    case '*': return 'in_progress';
    case '-': return 'on_hold';
    case '>': return 'on_hold';
    default: return 'pending';
  }
}

