// 日報管理ダッシュボード型定義
// OpenAPI仕様に準拠

// ===========================================
// OpenAPI生成型の再エクスポート
// ===========================================
export type {
  // 設定関連
  Config,
  Project,
  TimelineConfig,
  SlackConfig,
  Routines,
  WeeklyRoutine,
  MonthlyRoutine,
  QuarterlyRoutine,
  YearlyRoutine,
  RoutineItem,
  MonthlyRoutineItem,
  // カレンダー関連
  CalendarData,
  DayStats,
  CalendarSummary,
  YearMonth,
  YearMonthsResponse,
  // 日報関連
  ReportStats,
  ReportResponse,
  ReportSaveRequest,
  ReportSaveResponse,
  GitOptions,
  SlackOptions,
  GitResult,
  SlackResult,
  // Git関連
  ExtendedGitStatus,
  UncommittedChanges,
  UnpushedCommits,
  UnpushedCommit,
  CommitInfo,
  FileStatus,
  // エラー
  ProblemDetails,
  ValidationError,
  Error as ApiError,
} from '@mdjournal/contract/schemas/types.js';

// ===========================================
// プロジェクトカテゴリ（型エイリアス）
// ===========================================
export type ProjectCategory = 'internal' | 'client' | 'personal';

// ===========================================
// スケジュールアイテム（PLAN/RESULT）
// クライアント内部でのMarkdownパース結果を表現
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
  description?: string;  // 詳細説明（2スペースインデント）
  metadata?: ScheduleItemMetadata;
}

// ===========================================
// TODO
// クライアント内部でのMarkdownパース結果を表現
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
// 日報（クライアント内部表現）
// Markdownをパースした結果の構造化データ
// ===========================================
export interface DailyReport {
  date: string;
  author?: string;
  plan: ScheduleItem[];
  result: ScheduleItem[];
  todos: TodoItem[];
  notes?: string;
  stats?: import('@mdjournal/contract/schemas/types.js').ReportStats;
}

// ===========================================
// Git状態（簡易版 - 旧API互換）
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

// ===========================================
// Googleカレンダー（未使用、将来のため保持）
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
// 連携状態（未使用、将来のため保持）
// ===========================================
export interface IntegrationStatus {
  slack: { connected: boolean; lastSync?: string };
  googleCalendar: { connected: boolean; lastSync?: string };
  git: { connected: boolean; lastSync?: string };
}
