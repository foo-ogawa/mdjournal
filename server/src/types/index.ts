/**
 * 日報管理ダッシュボード サーバー型定義
 */

// ===========================================
// プロジェクト
// ===========================================
export type ProjectCategory = 'internal' | 'client' | 'personal';

export interface Project {
  code: string;
  name: string;
  color: string;
  category: ProjectCategory;
  client?: string;
  active: boolean;
}

// ===========================================
// スケジュールアイテム（PLAN/RESULT）
// ===========================================
export interface ScheduleItemMetadata {
  priority?: 'high' | 'medium' | 'low';
  meeting_url?: string;
  duration?: number;
  related_todo?: string;
  tags?: string[];
}

export interface ScheduleItem {
  id: string;
  time: string;
  project: string;
  task: string;
  duration?: number;
  metadata?: ScheduleItemMetadata;
}

// ===========================================
// TODO
// ===========================================
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';

export interface TodoItem {
  id: string;
  project: string;
  task: string;
  status: TodoStatus;
  deadline?: string;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ===========================================
// 日報統計情報（frontmatter）
// ===========================================
export interface ReportStats {
  planHours: number;
  resultHours: number;
  todoCount: number;
  todoCompleted: number;
  todoInProgress: number;
  projectHours: Record<string, number>;
  updatedAt: string;
}

// ===========================================
// 日報
// ===========================================
export interface DailyReport {
  date: string;
  author: string;
  plan: ScheduleItem[];
  result: ScheduleItem[];
  todos: TodoItem[];
  notes?: string;
  stats?: ReportStats;
}

// ===========================================
// ルーチン
// ===========================================
export interface RoutineItem {
  id?: string;
  time?: string;
  project: string;
  task: string;
  duration?: number;
  category?: 'plan' | 'todo';  // タスク形式かTODO形式か
}

export interface MonthlyRoutineItem {
  project: string;
  task: string;
  category?: 'plan' | 'todo';
}

export interface WeeklyRoutine {
  monday?: RoutineItem[];
  tuesday?: RoutineItem[];
  wednesday?: RoutineItem[];
  thursday?: RoutineItem[];
  friday?: RoutineItem[];
  saturday?: RoutineItem[];
  sunday?: RoutineItem[];
}

export interface MonthlyRoutine {
  start_of_month?: MonthlyRoutineItem[];
  end_of_month?: MonthlyRoutineItem[];
  schedule?: RoutineItem[];  // 時間ベースのタスク
}

export interface QuarterlyRoutine {
  months: number[];
  tasks: MonthlyRoutineItem[];
  schedule?: RoutineItem[];  // 時間ベースのタスク
}

export interface YearlyRoutine {
  month: number;
  day: number;
  project: string;
  task: string;
  time?: string;  // 時間ベースのタスクの場合
}

export interface Routines {
  weekly?: WeeklyRoutine;
  adhoc?: RoutineItem[];
  monthly?: MonthlyRoutine;
  quarterly?: QuarterlyRoutine[];
  yearly?: YearlyRoutine[];
}

// ===========================================
// 設定
// ===========================================
// ===========================================
// タイムライン設定
// ===========================================
export interface TimelineConfig {
  hourHeight: number;       // 1時間あたりの高さ（ピクセル）
  maxHours: number;         // 最大表示時間
  defaultStartHour: number; // デフォルト開始時刻（スロットが空の場合の表示開始時間）
  defaultEndHour: number;   // デフォルト終了時刻（スロットが空の場合の表示終了時間）
  snapMinutes: number;      // ドラッグ時のスナップ単位（分）
}

export interface SlackConfig {
  enabled: boolean;
}

export interface Config {
  projects: Project[];
  routines: Routines;
  timeline?: TimelineConfig;
  slack?: SlackConfig;
}

// ===========================================
// カレンダー
// ===========================================
export interface DayStats {
  date: string;
  hasReport: boolean;
  planHours?: number;
  resultHours?: number;
  todoCount?: number;
  todoCompleted?: number;
}

export interface CalendarSummary {
  totalPlanHours: number;
  totalResultHours: number;
  workDays: number;
  todoCompleted: number;
  projectHours?: Record<string, number>;
}

export interface CalendarData {
  year: number;
  month: number;
  days: DayStats[];
  summary?: CalendarSummary;
}

// ===========================================
// Googleカレンダー
// ===========================================
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  meetingUrl?: string;
}

// ===========================================
// APIリクエスト/レスポンス
// ===========================================
export interface ReportResponse {
  date: string;
  content: string;
  stats: ReportStats;
}

export interface ReportSaveRequest {
  content: string;
  git?: {
    commit?: boolean;
    push?: boolean;
    message?: string;
  };
  slack?: {
    post?: boolean;
  };
}

export interface ReportSaveResponse {
  date: string;
  saved: boolean;
  stats: ReportStats;
  git?: {
    committed?: boolean;
    pushed?: boolean;
    commitHash?: string;
    error?: string;
  };
  slack?: {
    posted?: boolean;
    error?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
}

// ===========================================
// Git状態
// ===========================================
export interface GitStatus {
  branch: string;
  uncommittedChanges: number;
  modifiedFiles?: string[];
  lastCommit?: {
    hash: string;
    message: string;
    date: string;
  };
  lastPush?: string;
}

