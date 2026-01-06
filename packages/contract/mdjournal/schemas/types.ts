/**
 * Auto-generated TypeScript types from OpenAPI specification
 * Generated from: mdJournal API v1.0.0
 * DO NOT EDIT MANUALLY
 */

/**
 * RFC 9457 Problem Details for HTTP APIs
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */
export interface ProblemDetails {
  /** A URI reference that identifies the problem type */
  type: string;
  /** A short, human-readable summary */
  title: string;
  /** The HTTP status code */
  status: number;
  /** A human-readable explanation specific to this occurrence */
  detail?: string;
  /** A URI reference to the specific occurrence */
  instance?: string;
  /** Application-specific error code (SCREAMING_SNAKE_CASE) */
  code?: string;
  /** Request trace ID for debugging */
  traceId?: string;
  /** Detailed validation errors */
  errors?: ValidationError[];
  /** Additional properties */
  [key: string]: unknown;
}

/**
 * Validation error detail
 */
export interface ValidationError {
  /** JSON Pointer to the invalid field */
  pointer: string;
  /** Error message for this field */
  detail: string;
}

export interface Error {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
}

/** 日報の統計情報。ファイル保存時にサーバーが計算し、
YAML frontmatterとしてMarkdownファイル先頭に保存されます。
 */
export interface ReportStats {
  /** 計画時間（時間） */
  planHours: number;
  /** 実績時間（時間） */
  resultHours: number;
  /** TODO総数 */
  todoCount: number;
  /** 完了TODO数 */
  todoCompleted: number;
  /** 進行中TODO数 */
  todoInProgress: number;
  /** プロジェクト別実績時間（時間） */
  projectHours: Record<string, number>;
  /** 最終更新日時 */
  updatedAt: string;
}

export interface ReportResponse {
  /** 日報の日付 */
  date: string;
  /** 日報のMarkdownコンテンツ（frontmatterを除いた本文部分）
 */
  content: string;
  stats: ReportStats;
}

export interface ReportSaveRequest {
  /** 日報のMarkdownコンテンツ（frontmatterなしの本文のみ）。
サーバーが統計情報を計算してfrontmatterを付与して保存します。
 */
  content: string;
  git?: GitOptions;
  slack?: SlackOptions;
}

/** Git操作オプション */
export interface GitOptions {
  /** 保存後にコミットするか */
  commit?: boolean;
  /** コミット後にプッシュするか（commitがtrueの場合のみ有効） */
  push?: boolean;
  /** コミットメッセージ（省略時は自動生成） */
  message?: string;
}

/** Slack投稿オプション */
export interface SlackOptions {
  /** Slackに投稿するか */
  post?: boolean;
}

/** Git操作結果 */
export interface GitResult {
  /** コミットが成功したか */
  committed?: boolean;
  /** プッシュが成功したか */
  pushed?: boolean;
  /** コミットハッシュ */
  commitHash?: string;
  /** エラーメッセージ（失敗時） */
  error?: string;
}

/** Slack投稿結果 */
export interface SlackResult {
  /** 投稿が成功したか */
  posted?: boolean;
  /** エラーメッセージ（失敗時） */
  error?: string;
}

export interface ReportSaveResponse {
  /** 保存した日報の日付 */
  date: string;
  /** 保存が成功したか */
  saved: boolean;
  stats: ReportStats;
  git?: GitResult;
  slack?: SlackResult;
}

export interface CalendarData {
  /** 年 */
  year: number;
  /** 月 */
  month: number;
  /** 日別統計データ。各日報ファイルのfrontmatterから取得するため高速。
 */
  days: DayStats[];
  summary?: CalendarSummary;
}

export interface DayStats {
  /** 日付 */
  date: string;
  /** 日報が存在するか */
  hasReport: boolean;
  /** 計画時間（時間） */
  planHours?: number;
  /** 実績時間（時間） */
  resultHours?: number;
  /** TODO総数 */
  todoCount?: number;
  /** 完了TODO数 */
  todoCompleted?: number;
}

/** 月間サマリー */
export interface CalendarSummary {
  /** 計画時間合計 */
  totalPlanHours?: number;
  /** 実績時間合計 */
  totalResultHours?: number;
  /** 稼働日数（日報が存在する日数） */
  workDays?: number;
  /** 完了TODO数 */
  todoCompleted?: number;
  /** プロジェクト別実績時間合計（時間） */
  projectHours?: Record<string, number>;
}

export interface YearMonthsResponse {
  /** 日報が存在する年月のリスト（新しい順） */
  yearMonths: YearMonth[];
}

export interface YearMonth {
  /** 年 */
  year: number;
  /** 月（1-12） */
  month: number;
}

export interface Config {
  /** プロジェクトマスタ */
  projects?: Project[];
  routines?: Routines;
  timeline?: TimelineConfig;
  slack?: SlackConfig;
}

export interface Project {
  /** プロジェクトコード */
  code: string;
  /** プロジェクト名 */
  name: string;
  /** プロジェクトカラー（HEX形式） */
  color: string;
  /** カテゴリ */
  category: ('internal' | 'client' | 'personal');
  /** クライアント名 */
  client?: string;
  /** アクティブフラグ */
  active: boolean;
}

/** タイムライン表示設定 */
export interface TimelineConfig {
  /** 1時間あたりの高さ（ピクセル） */
  hourHeight?: number;
  /** 最大表示時間 */
  maxHours?: number;
  /** デフォルト開始時刻 */
  defaultStartHour?: number;
  /** デフォルト終了時刻 */
  defaultEndHour?: number;
  /** ドラッグ時のスナップ単位（分） */
  snapMinutes?: number;
}

/** Slack連携設定 */
export interface SlackConfig {
  /** Slack連携が有効か */
  enabled?: boolean;
}

export interface Routines {
  weekly?: WeeklyRoutine;
  adhoc?: RoutineItem[];
  monthly?: MonthlyRoutine;
  quarterly?: QuarterlyRoutine[];
  yearly?: YearlyRoutine[];
}

/** 週次ルーチン（曜日別） */
export interface WeeklyRoutine {
  monday?: RoutineItem[];
  tuesday?: RoutineItem[];
  wednesday?: RoutineItem[];
  thursday?: RoutineItem[];
  friday?: RoutineItem[];
  saturday?: RoutineItem[];
  sunday?: RoutineItem[];
}

/** 月次ルーチン */
export interface MonthlyRoutine {
  start_of_month?: MonthlyRoutineItem[];
  end_of_month?: MonthlyRoutineItem[];
  schedule?: RoutineItem[];
}

export interface QuarterlyRoutine {
  /** 実行月 */
  months?: number[];
  tasks?: MonthlyRoutineItem[];
  schedule?: RoutineItem[];
}

export interface YearlyRoutine {
  /** 実行月 */
  month?: number;
  /** 実行日 */
  day?: number;
  project?: string;
  task?: string;
  /** 開始時刻（HH:MM形式） */
  time?: string;
}

export interface RoutineItem {
  /** ルーチンID */
  id?: string;
  /** 開始時刻（HH:MM形式） */
  time?: string;
  /** プロジェクトコード */
  project: string;
  /** タスク名 */
  task: string;
  /** 所要時間（分） */
  duration?: number;
  /** タスク形式かTODO形式か */
  category?: ('plan' | 'todo');
}

export interface MonthlyRoutineItem {
  /** プロジェクトコード */
  project: string;
  /** タスク名 */
  task: string;
  /** タスク形式かTODO形式か */
  category?: ('plan' | 'todo');
}

export interface RoutinesMarkdownResponse {
  /** Markdown形式のルーチン設定。
 */
  content: string;
  /** データソース。`markdown` は `data/routines.md` から読み込み、
`yaml` は `config/routines.yaml` から変換したことを示します。
 */
  source: ('markdown' | 'yaml');
}

export interface RoutinesMarkdownRequest {
  /** 保存するMarkdown形式のルーチン設定。
 */
  content: string;
}

export interface ExtendedGitStatus {
  /** 現在のブランチ名 */
  branch: string;
  uncommitted: UncommittedChanges;
  unpushed: UnpushedCommits;
  lastCommit?: CommitInfo;
}

export interface UncommittedChanges {
  /** 未コミットファイル数 */
  count: number;
  files: FileStatus[];
}

export interface FileStatus {
  /** ファイルパス */
  path: string;
  /** ステータス（M:変更, A:追加, D:削除など） */
  status: string;
}

export interface UnpushedCommits {
  /** 未プッシュコミット数 */
  count: number;
  commits: UnpushedCommit[];
}

export interface UnpushedCommit {
  /** コミットハッシュ（短縮形） */
  hash: string;
  /** コミットメッセージ */
  message: string;
  /** コミット日時 */
  date: string;
  /** コミットに含まれるファイル一覧 */
  files: string[];
}

export interface CommitInfo {
  /** コミットハッシュ */
  hash: string;
  /** コミットメッセージ */
  message: string;
  /** コミット日時 */
  date: string;
}

// Operation-specific types
export interface Report_getReportParams {
  /** 日付（YYYY-MM-DD形式） */
  'date': string;
}

export type Report_getReportInput = Report_getReportParams;

export interface Report_saveReportParams {
  /** 日付（YYYY-MM-DD形式） */
  'date': string;
}

export type Report_saveReportInput = Report_saveReportParams & { data: ReportSaveRequest };

export interface Report_deleteReportParams {
  /** 日付（YYYY-MM-DD形式） */
  'date': string;
}

export type Report_deleteReportInput = Report_deleteReportParams;

export interface Calendar_getCalendarDataParams {
  /** 年（YYYY形式） */
  'year': number;
  /** 月（1-12） */
  'month': number;
}

export type Calendar_getCalendarDataInput = Calendar_getCalendarDataParams;

export type Calendar_getAvailableYearMonthsInput = Record<string, never>;

export type Config_getConfigInput = Record<string, never>;

export type Config_updateConfigInput = { data: Config };

export type Config_getRoutinesMarkdownInput = Record<string, never>;

export type Config_saveRoutinesMarkdownInput = { data: RoutinesMarkdownRequest };

export type Git_getStatusInput = Record<string, never>;
