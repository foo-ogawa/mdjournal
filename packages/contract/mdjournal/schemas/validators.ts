/**
 * Auto-generated JSON Schemas from OpenAPI specification
 * Generated from: mdJournal API v1.0.0
 * DO NOT EDIT MANUALLY
 */

export const Error = {
    "$id": "Error",
    "type": "object",
    "properties": {
      "code": {
        "type": "string",
        "description": "エラーコード"
      },
      "message": {
        "type": "string",
        "description": "エラーメッセージ"
      }
    },
    "required": [
      "code",
      "message"
    ]
  } as const;

export const ReportStats = {
    "$id": "ReportStats",
    "type": "object",
    "description": "日報の統計情報。ファイル保存時にサーバーが計算し、\nYAML frontmatterとしてMarkdownファイル先頭に保存されます。\n",
    "properties": {
      "planHours": {
        "type": "number",
        "description": "計画時間（時間）",
        "format": "float"
      },
      "resultHours": {
        "type": "number",
        "description": "実績時間（時間）",
        "format": "float"
      },
      "todoCount": {
        "type": "integer",
        "description": "TODO総数"
      },
      "todoCompleted": {
        "type": "integer",
        "description": "完了TODO数"
      },
      "todoInProgress": {
        "type": "integer",
        "description": "進行中TODO数"
      },
      "projectHours": {
        "type": "object",
        "description": "プロジェクト別実績時間（時間）",
        "additionalProperties": {
          "type": "number",
          "format": "float"
        }
      },
      "updatedAt": {
        "type": "string",
        "description": "最終更新日時",
        "format": "date-time"
      }
    },
    "required": [
      "planHours",
      "resultHours",
      "todoCount",
      "todoCompleted",
      "todoInProgress",
      "projectHours",
      "updatedAt"
    ]
  } as const;

export const ReportResponse = {
    "$id": "ReportResponse",
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "日報の日付",
        "format": "date"
      },
      "content": {
        "type": "string",
        "description": "日報のMarkdownコンテンツ（frontmatterを除いた本文部分）\n"
      },
      "stats": {
        "$ref": "ReportStats#"
      }
    },
    "required": [
      "date",
      "content",
      "stats"
    ]
  } as const;

export const ReportSaveRequest = {
    "$id": "ReportSaveRequest",
    "type": "object",
    "properties": {
      "content": {
        "type": "string",
        "description": "日報のMarkdownコンテンツ（frontmatterなしの本文のみ）。\nサーバーが統計情報を計算してfrontmatterを付与して保存します。\n"
      },
      "git": {
        "$ref": "GitOptions#"
      },
      "slack": {
        "$ref": "SlackOptions#"
      }
    },
    "required": [
      "content"
    ]
  } as const;

export const GitOptions = {
    "$id": "GitOptions",
    "type": "object",
    "description": "Git操作オプション",
    "properties": {
      "commit": {
        "type": "boolean",
        "description": "保存後にコミットするか",
        "default": false
      },
      "push": {
        "type": "boolean",
        "description": "コミット後にプッシュするか（commitがtrueの場合のみ有効）",
        "default": false
      },
      "message": {
        "type": "string",
        "description": "コミットメッセージ（省略時は自動生成）"
      }
    }
  } as const;

export const SlackOptions = {
    "$id": "SlackOptions",
    "type": "object",
    "description": "Slack投稿オプション",
    "properties": {
      "post": {
        "type": "boolean",
        "description": "Slackに投稿するか",
        "default": false
      }
    }
  } as const;

export const GitResult = {
    "$id": "GitResult",
    "type": "object",
    "description": "Git操作結果",
    "properties": {
      "committed": {
        "type": "boolean",
        "description": "コミットが成功したか"
      },
      "pushed": {
        "type": "boolean",
        "description": "プッシュが成功したか"
      },
      "commitHash": {
        "type": "string",
        "description": "コミットハッシュ"
      },
      "error": {
        "type": "string",
        "description": "エラーメッセージ（失敗時）"
      }
    }
  } as const;

export const SlackResult = {
    "$id": "SlackResult",
    "type": "object",
    "description": "Slack投稿結果",
    "properties": {
      "posted": {
        "type": "boolean",
        "description": "投稿が成功したか"
      },
      "error": {
        "type": "string",
        "description": "エラーメッセージ（失敗時）"
      }
    }
  } as const;

export const ReportSaveResponse = {
    "$id": "ReportSaveResponse",
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "保存した日報の日付",
        "format": "date"
      },
      "saved": {
        "type": "boolean",
        "description": "保存が成功したか"
      },
      "stats": {
        "$ref": "ReportStats#"
      },
      "git": {
        "$ref": "GitResult#"
      },
      "slack": {
        "$ref": "SlackResult#"
      }
    },
    "required": [
      "date",
      "saved",
      "stats"
    ]
  } as const;

export const CalendarData = {
    "$id": "CalendarData",
    "type": "object",
    "properties": {
      "year": {
        "type": "integer",
        "description": "年"
      },
      "month": {
        "type": "integer",
        "description": "月"
      },
      "days": {
        "type": "array",
        "description": "日別統計データ。各日報ファイルのfrontmatterから取得するため高速。\n",
        "items": {
          "$ref": "DayStats#"
        }
      },
      "summary": {
        "$ref": "CalendarSummary#"
      }
    },
    "required": [
      "year",
      "month",
      "days"
    ]
  } as const;

export const DayStats = {
    "$id": "DayStats",
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "日付",
        "format": "date"
      },
      "hasReport": {
        "type": "boolean",
        "description": "日報が存在するか"
      },
      "planHours": {
        "type": "number",
        "description": "計画時間（時間）",
        "format": "float"
      },
      "resultHours": {
        "type": "number",
        "description": "実績時間（時間）",
        "format": "float"
      },
      "todoCount": {
        "type": "integer",
        "description": "TODO総数"
      },
      "todoCompleted": {
        "type": "integer",
        "description": "完了TODO数"
      }
    },
    "required": [
      "date",
      "hasReport"
    ]
  } as const;

export const CalendarSummary = {
    "$id": "CalendarSummary",
    "type": "object",
    "description": "月間サマリー",
    "properties": {
      "totalPlanHours": {
        "type": "number",
        "description": "計画時間合計",
        "format": "float"
      },
      "totalResultHours": {
        "type": "number",
        "description": "実績時間合計",
        "format": "float"
      },
      "workDays": {
        "type": "integer",
        "description": "稼働日数（日報が存在する日数）"
      },
      "todoCompleted": {
        "type": "integer",
        "description": "完了TODO数"
      },
      "projectHours": {
        "type": "object",
        "description": "プロジェクト別実績時間合計（時間）",
        "additionalProperties": {
          "type": "number",
          "format": "float"
        }
      }
    }
  } as const;

export const YearMonthsResponse = {
    "$id": "YearMonthsResponse",
    "type": "object",
    "properties": {
      "yearMonths": {
        "type": "array",
        "description": "日報が存在する年月のリスト（新しい順）",
        "items": {
          "$ref": "YearMonth#"
        }
      }
    },
    "required": [
      "yearMonths"
    ]
  } as const;

export const YearMonth = {
    "$id": "YearMonth",
    "type": "object",
    "properties": {
      "year": {
        "type": "integer",
        "description": "年"
      },
      "month": {
        "type": "integer",
        "description": "月（1-12）"
      }
    },
    "required": [
      "year",
      "month"
    ]
  } as const;

export const Config = {
    "$id": "Config",
    "type": "object",
    "properties": {
      "projects": {
        "type": "array",
        "description": "プロジェクトマスタ",
        "items": {
          "$ref": "Project#"
        }
      },
      "routines": {
        "$ref": "Routines#"
      },
      "timeline": {
        "$ref": "TimelineConfig#"
      },
      "slack": {
        "$ref": "SlackConfig#"
      }
    }
  } as const;

export const Project = {
    "$id": "Project",
    "type": "object",
    "properties": {
      "code": {
        "type": "string",
        "description": "プロジェクトコード"
      },
      "name": {
        "type": "string",
        "description": "プロジェクト名"
      },
      "color": {
        "type": "string",
        "description": "プロジェクトカラー（HEX形式）",
        "pattern": "^#[0-9A-Fa-f]{6}$"
      },
      "category": {
        "type": "string",
        "description": "カテゴリ名（自由文字列）"
      },
      "client": {
        "type": "string",
        "description": "クライアント名"
      },
      "active": {
        "type": "boolean",
        "description": "アクティブフラグ"
      }
    },
    "required": [
      "code",
      "name",
      "color",
      "category",
      "active"
    ]
  } as const;

export const TimelineConfig = {
    "$id": "TimelineConfig",
    "type": "object",
    "description": "タイムライン表示設定",
    "properties": {
      "hourHeight": {
        "type": "integer",
        "description": "1時間あたりの高さ（ピクセル）"
      },
      "maxHours": {
        "type": "integer",
        "description": "最大表示時間"
      },
      "defaultStartHour": {
        "type": "integer",
        "description": "デフォルト開始時刻"
      },
      "defaultEndHour": {
        "type": "integer",
        "description": "デフォルト終了時刻"
      },
      "snapMinutes": {
        "type": "integer",
        "description": "ドラッグ時のスナップ単位（分）"
      }
    }
  } as const;

export const SlackConfig = {
    "$id": "SlackConfig",
    "type": "object",
    "description": "Slack連携設定",
    "properties": {
      "enabled": {
        "type": "boolean",
        "description": "Slack連携が有効か"
      }
    }
  } as const;

export const Routines = {
    "$id": "Routines",
    "type": "object",
    "properties": {
      "weekly": {
        "$ref": "WeeklyRoutine#"
      },
      "adhoc": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      },
      "monthly": {
        "$ref": "MonthlyRoutine#"
      },
      "quarterly": {
        "type": "array",
        "items": {
          "$ref": "QuarterlyRoutine#"
        }
      },
      "yearly": {
        "type": "array",
        "items": {
          "$ref": "YearlyRoutine#"
        }
      }
    }
  } as const;

export const WeeklyRoutine = {
    "$id": "WeeklyRoutine",
    "type": "object",
    "description": "週次ルーチン（曜日別）",
    "properties": {
      "monday": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      },
      "tuesday": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      },
      "wednesday": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      },
      "thursday": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      },
      "friday": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      },
      "saturday": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      },
      "sunday": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      }
    }
  } as const;

export const MonthlyRoutine = {
    "$id": "MonthlyRoutine",
    "type": "object",
    "description": "月次ルーチン",
    "properties": {
      "start_of_month": {
        "type": "array",
        "items": {
          "$ref": "MonthlyRoutineItem#"
        }
      },
      "end_of_month": {
        "type": "array",
        "items": {
          "$ref": "MonthlyRoutineItem#"
        }
      },
      "schedule": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      }
    }
  } as const;

export const QuarterlyRoutine = {
    "$id": "QuarterlyRoutine",
    "type": "object",
    "properties": {
      "months": {
        "type": "array",
        "description": "実行月",
        "items": {
          "type": "integer"
        }
      },
      "tasks": {
        "type": "array",
        "items": {
          "$ref": "MonthlyRoutineItem#"
        }
      },
      "schedule": {
        "type": "array",
        "items": {
          "$ref": "RoutineItem#"
        }
      }
    },
    "required": [
      "months",
      "tasks"
    ]
  } as const;

export const YearlyRoutine = {
    "$id": "YearlyRoutine",
    "type": "object",
    "properties": {
      "month": {
        "type": "integer",
        "description": "実行月"
      },
      "day": {
        "type": "integer",
        "description": "実行日"
      },
      "project": {
        "type": "string"
      },
      "task": {
        "type": "string"
      },
      "time": {
        "type": "string",
        "description": "開始時刻（HH:MM形式）"
      }
    },
    "required": [
      "month",
      "day",
      "project",
      "task"
    ]
  } as const;

export const RoutineItem = {
    "$id": "RoutineItem",
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "description": "ルーチンID"
      },
      "time": {
        "type": "string",
        "description": "開始時刻（HH:MM形式）",
        "pattern": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
      },
      "project": {
        "type": "string",
        "description": "プロジェクトコード"
      },
      "task": {
        "type": "string",
        "description": "タスク名"
      },
      "duration": {
        "type": "integer",
        "description": "所要時間（分）"
      },
      "category": {
        "type": "string",
        "description": "タスク形式かTODO形式か",
        "enum": [
          "plan",
          "todo"
        ]
      }
    },
    "required": [
      "project",
      "task"
    ]
  } as const;

export const MonthlyRoutineItem = {
    "$id": "MonthlyRoutineItem",
    "type": "object",
    "properties": {
      "project": {
        "type": "string",
        "description": "プロジェクトコード"
      },
      "task": {
        "type": "string",
        "description": "タスク名"
      },
      "category": {
        "type": "string",
        "description": "タスク形式かTODO形式か",
        "enum": [
          "plan",
          "todo"
        ]
      }
    },
    "required": [
      "project",
      "task"
    ]
  } as const;

export const RoutinesMarkdownResponse = {
    "$id": "RoutinesMarkdownResponse",
    "type": "object",
    "properties": {
      "content": {
        "type": "string",
        "description": "Markdown形式のルーチン設定。\n"
      },
      "source": {
        "type": "string",
        "description": "データソース。`markdown` は `data/routines.md` から読み込み、\n`yaml` は `config/routines.yaml` から変換したことを示します。\n",
        "enum": [
          "markdown",
          "yaml"
        ]
      }
    },
    "required": [
      "content",
      "source"
    ]
  } as const;

export const RoutinesMarkdownRequest = {
    "$id": "RoutinesMarkdownRequest",
    "type": "object",
    "properties": {
      "content": {
        "type": "string",
        "description": "保存するMarkdown形式のルーチン設定。\n"
      }
    },
    "required": [
      "content"
    ]
  } as const;

export const ExtendedGitStatus = {
    "$id": "ExtendedGitStatus",
    "type": "object",
    "properties": {
      "branch": {
        "type": "string",
        "description": "現在のブランチ名"
      },
      "uncommitted": {
        "$ref": "UncommittedChanges#"
      },
      "unpushed": {
        "$ref": "UnpushedCommits#"
      },
      "lastCommit": {
        "$ref": "CommitInfo#"
      }
    },
    "required": [
      "branch",
      "uncommitted",
      "unpushed"
    ]
  } as const;

export const UncommittedChanges = {
    "$id": "UncommittedChanges",
    "type": "object",
    "properties": {
      "count": {
        "type": "integer",
        "description": "未コミットファイル数"
      },
      "files": {
        "type": "array",
        "items": {
          "$ref": "FileStatus#"
        }
      }
    },
    "required": [
      "count",
      "files"
    ]
  } as const;

export const FileStatus = {
    "$id": "FileStatus",
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "ファイルパス"
      },
      "status": {
        "type": "string",
        "description": "ステータス（M:変更, A:追加, D:削除など）"
      }
    },
    "required": [
      "path",
      "status"
    ]
  } as const;

export const UnpushedCommits = {
    "$id": "UnpushedCommits",
    "type": "object",
    "properties": {
      "count": {
        "type": "integer",
        "description": "未プッシュコミット数"
      },
      "commits": {
        "type": "array",
        "items": {
          "$ref": "UnpushedCommit#"
        }
      }
    },
    "required": [
      "count",
      "commits"
    ]
  } as const;

export const UnpushedCommit = {
    "$id": "UnpushedCommit",
    "type": "object",
    "properties": {
      "hash": {
        "type": "string",
        "description": "コミットハッシュ（短縮形）"
      },
      "message": {
        "type": "string",
        "description": "コミットメッセージ"
      },
      "date": {
        "type": "string",
        "description": "コミット日時"
      },
      "files": {
        "type": "array",
        "description": "コミットに含まれるファイル一覧",
        "items": {
          "type": "string"
        }
      }
    },
    "required": [
      "hash",
      "message",
      "date",
      "files"
    ]
  } as const;

export const CommitInfo = {
    "$id": "CommitInfo",
    "type": "object",
    "properties": {
      "hash": {
        "type": "string",
        "description": "コミットハッシュ"
      },
      "message": {
        "type": "string",
        "description": "コミットメッセージ"
      },
      "date": {
        "type": "string",
        "description": "コミット日時"
      }
    },
    "required": [
      "hash",
      "message",
      "date"
    ]
  } as const;

// Parameter schemas
export const Report_getReportParams = {
    "$id": "Report_getReportParams",
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "format": "date"
      }
    },
    "required": [
      "date"
    ]
  } as const;

export const Report_saveReportParams = {
    "$id": "Report_saveReportParams",
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "format": "date"
      }
    },
    "required": [
      "date"
    ]
  } as const;

export const Report_deleteReportParams = {
    "$id": "Report_deleteReportParams",
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "format": "date"
      }
    },
    "required": [
      "date"
    ]
  } as const;

export const Calendar_getCalendarDataParams = {
    "$id": "Calendar_getCalendarDataParams",
    "type": "object",
    "properties": {
      "year": {
        "type": "integer",
        "minimum": 2000,
        "maximum": 2100
      },
      "month": {
        "type": "integer",
        "minimum": 1,
        "maximum": 12
      }
    },
    "required": [
      "year",
      "month"
    ]
  } as const;


// All schemas for registration
export const allSchemas = [
  Error,
  ReportStats,
  ReportResponse,
  ReportSaveRequest,
  GitOptions,
  SlackOptions,
  GitResult,
  SlackResult,
  ReportSaveResponse,
  CalendarData,
  DayStats,
  CalendarSummary,
  YearMonthsResponse,
  YearMonth,
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
  RoutinesMarkdownResponse,
  RoutinesMarkdownRequest,
  ExtendedGitStatus,
  UncommittedChanges,
  FileStatus,
  UnpushedCommits,
  UnpushedCommit,
  CommitInfo,
  Report_getReportParams,
  Report_saveReportParams,
  Report_deleteReportParams,
  Calendar_getCalendarDataParams,
] as const;