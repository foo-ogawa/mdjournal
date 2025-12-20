# mdJournal 外部連携仕様書

## 1. 概要

本ドキュメントは、mdJournalの外部システム連携に関する技術仕様を定義する。

---

## 2. Slack連携

### 2.1 概要

Slack Appを使用して、日報の投稿およびTODO情報の取得を行う。

### 2.2 必要な権限（OAuth Scopes）

```
channels:read
chat:write
chat:write.public
users:read
reactions:read
bookmarks:read
stars:read
```

### 2.3 設定ファイル

```yaml
# config/integrations.yaml
slack:
  enabled: true
  bot_token: "${SLACK_BOT_TOKEN}"  # 環境変数から取得
  signing_secret: "${SLACK_SIGNING_SECRET}"
  
  daily_report:
    channel_id: "C0123456789"      # 投稿先チャンネル
    channel_name: "#daily-report"  # 表示用
    auto_post: false               # 自動投稿の有効/無効
    post_time: "09:00"             # 自動投稿時刻
    
  todo_sync:
    enabled: true
    sources:
      - type: "stars"              # スター付きメッセージ
      - type: "bookmarks"          # ブックマーク
      - type: "reminders"          # リマインダー
```

### 2.4 日報投稿フォーマット

#### 2.4.1 Block Kit形式

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "📋 日報 - サンプル太郎 2025-12-18"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*【計画】*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• 08:30 `P99` タスク確認・整理、日報返信\n• 09:00 `P99` 新人研修サポート\n• 09:30 `P34` クライアントA MTG"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*【実績】*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• 08:30 `P99` タスク確認・整理、日報返信"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*【TODO】*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "☐ `P99` ブラウザ等アップデート\n🔄 `P99` 社内規定作成"
      }
    }
  ]
}
```

#### 2.4.2 テキスト形式（フォールバック）

```
📋 日報 - サンプル太郎 2025-12-18

【計画】
• 08:30 [P99] タスク確認・整理、日報返信
• 09:00 [P99] 新人研修サポート
• 09:30 [P34] クライアントA MTG

【実績】
• 08:30 [P99] タスク確認・整理、日報返信

【TODO】
☐ [P99] ブラウザ等アップデート
🔄 [P99] 社内規定作成
```

### 2.5 API実装

#### POST `/api/slack/post`

```typescript
interface SlackPostRequest {
  date: string;          // YYYY-MM-DD
  format?: 'block' | 'text';
  preview?: boolean;     // プレビューのみ（実際に投稿しない）
}

interface SlackPostResponse {
  success: boolean;
  message_ts?: string;   // Slackメッセージタイムスタンプ
  channel?: string;
  preview?: string;      // プレビュー時のメッセージ内容
  error?: string;
}
```

#### GET `/api/slack/todos`

```typescript
interface SlackTodosResponse {
  todos: SlackTodoItem[];
}

interface SlackTodoItem {
  id: string;
  text: string;
  source: 'star' | 'bookmark' | 'reminder';
  channel_id: string;
  channel_name: string;
  message_ts: string;
  permalink: string;
  created_at: string;
}
```

---

## 3. Git連携

### 3.1 概要

日報ファイルの変更をGitリポジトリで管理し、自動/手動でcommit・pushを行う。

### 3.2 設定ファイル

```yaml
# config/integrations.yaml
git:
  enabled: true
  repo_path: "./data"            # Git管理対象ディレクトリ
  
  auto_commit:
    enabled: true
    on_save: true                # ファイル保存時に自動commit
    interval: null               # 定期commit間隔（秒）、nullで無効
  
  auto_push:
    enabled: false
    interval: 3600               # push間隔（秒）
  
  commit_message:
    template: "📝 Update daily report: {date}"
    include_summary: true        # 変更サマリを含める
  
  remote:
    name: "origin"
    branch: "main"
```

### 3.3 Commit メッセージテンプレート

```
📝 Update daily report: 2025-12-18

Changes:
- PLAN: 8 items
- RESULT: 3 items
- TODO: 5 items (+2 new, 1 completed)
```

### 3.4 API実装

#### GET `/api/git/status`

```typescript
interface GitStatusResponse {
  branch: string;
  clean: boolean;
  staged: string[];
  modified: string[];
  untracked: string[];
  ahead: number;          // リモートより先行しているcommit数
  behind: number;         // リモートより遅れているcommit数
}
```

#### POST `/api/git/commit`

```typescript
interface GitCommitRequest {
  message?: string;       // カスタムメッセージ（オプション）
  files?: string[];       // 特定ファイルのみcommit
}

interface GitCommitResponse {
  success: boolean;
  commit_hash?: string;
  message?: string;
  error?: string;
}
```

#### POST `/api/git/push`

```typescript
interface GitPushResponse {
  success: boolean;
  pushed_commits?: number;
  error?: string;
}
```

#### GET `/api/git/log`

```typescript
interface GitLogRequest {
  limit?: number;         // デフォルト: 20
  file?: string;          // 特定ファイルの履歴
}

interface GitLogResponse {
  commits: GitCommit[];
}

interface GitCommit {
  hash: string;
  short_hash: string;
  message: string;
  author: string;
  date: string;
  files_changed: string[];
}
```

---

## 4. Googleカレンダー連携

### 4.1 概要

Google Calendar APIを使用して、予定の取得・表示を行う。

### 4.2 認証方式

- OAuth 2.0（Desktop application）
- サービスアカウント（オプション）

### 4.3 必要な権限（Scopes）

```
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events.readonly
```

### 4.4 設定ファイル

```yaml
# config/integrations.yaml
google_calendar:
  enabled: true
  credentials_path: "./config/google-credentials.json"
  token_path: "./config/google-token.json"
  
  calendars:
    - id: "primary"
      name: "メインカレンダー"
      color: "#4285f4"
      show: true
    - id: "work@example.com"
      name: "仕事用"
      color: "#0b8043"
      show: true
    - id: "ja.japanese#holiday@group.v.calendar.google.com"
      name: "日本の祝日"
      color: "#d50000"
      show: true
  
  sync:
    range_days_before: 7    # 何日前からの予定を取得
    range_days_after: 30    # 何日後までの予定を取得
    refresh_interval: 300   # 更新間隔（秒）
```

### 4.5 API実装

#### GET `/api/gcal/events`

```typescript
interface GCalEventsRequest {
  start_date: string;      // YYYY-MM-DD
  end_date: string;        // YYYY-MM-DD
  calendar_ids?: string[]; // 特定カレンダーのみ
}

interface GCalEventsResponse {
  events: GCalEvent[];
}

interface GCalEvent {
  id: string;
  calendar_id: string;
  calendar_name: string;
  title: string;
  start: string;           // ISO 8601
  end: string;             // ISO 8601
  all_day: boolean;
  location?: string;
  description?: string;
  meeting_url?: string;    // Google Meet等のURL
  attendees?: string[];
  color: string;
}
```

#### POST `/api/gcal/import`

```typescript
interface GCalImportRequest {
  date: string;            // YYYY-MM-DD
  event_ids: string[];     // インポートする予定のID
}

interface GCalImportResponse {
  success: boolean;
  imported_count: number;
  plan_items: PlanItem[];
}
```

#### GET `/api/gcal/auth/url`

OAuth認証URLを取得

#### POST `/api/gcal/auth/callback`

OAuth認証コールバック処理

---

## 5. 勤怠管理システム連携（将来拡張）

### 5.1 概要

勤怠管理システムへAPIでデータを送信する。実装は将来拡張として予定。

### 5.2 設定ファイル

```yaml
# config/integrations.yaml
attendance:
  enabled: false
  api_url: "https://attendance.example.com/api"
  api_key: "${ATTENDANCE_API_KEY}"
  
  mapping:
    work_start: "PLAN[0].time"     # 最初のPLAN時刻
    work_end: "RESULT[-1].time"    # 最後のRESULT時刻
    break_time: 60                  # 休憩時間（分）
  
  auto_submit:
    enabled: false
    time: "18:00"
```

### 5.3 API設計（予定）

#### POST `/api/attendance/submit`

```typescript
interface AttendanceSubmitRequest {
  date: string;
  work_start: string;      // HH:MM
  work_end: string;        // HH:MM
  break_time: number;      // 分
  remarks?: string;
}
```

---

## 6. 環境変数

```bash
# .env
# Slack
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Calendar
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Git (オプション)
GIT_AUTHOR_NAME="Your Name"
GIT_AUTHOR_EMAIL="your.email@example.com"

# Attendance (将来)
ATTENDANCE_API_KEY=xxxxxxxxxxxxxxxx
```

---

## 7. エラーハンドリング

### 7.1 共通エラーレスポンス

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

### 7.2 エラーコード

| コード | 説明 |
|-------|------|
| `SLACK_AUTH_ERROR` | Slack認証エラー |
| `SLACK_CHANNEL_NOT_FOUND` | チャンネルが見つからない |
| `SLACK_POST_FAILED` | メッセージ投稿失敗 |
| `GIT_NOT_INITIALIZED` | Gitリポジトリ未初期化 |
| `GIT_COMMIT_FAILED` | Commit失敗 |
| `GIT_PUSH_FAILED` | Push失敗 |
| `GCAL_AUTH_ERROR` | Google認証エラー |
| `GCAL_FETCH_FAILED` | 予定取得失敗 |
| `INTEGRATION_DISABLED` | 連携機能が無効 |

---

## 8. セキュリティ考慮事項

### 8.1 認証情報の管理

- APIトークン等は環境変数で管理
- 設定ファイル内では`${ENV_VAR}`形式で参照
- `.env`ファイルは`.gitignore`に追加

### 8.2 OAuth トークンの保存

- Google OAuth トークンは暗号化して保存
- トークンファイルは適切なパーミッションで保護

### 8.3 ネットワークアクセス

- ローカル環境での使用を前提
- 外部APIアクセスはHTTPS必須

---

## 9. 実装優先度

| 優先度 | 連携機能 | 理由 |
|-------|---------|------|
| 高 | Git連携 | データのバージョン管理は必須 |
| 高 | Slack日報投稿 | 日常的な報告業務に直結 |
| 中 | Googleカレンダー | 予定の一元管理に有用 |
| 中 | Slack TODO取得 | TODO管理の効率化 |
| 低 | 勤怠システム | 将来拡張として検討 |

---

## 更新履歴

| バージョン | 日付 | 更新内容 |
|-----------|------|---------|
| 1.0 | 2025-12-20 | mdJournalとして公開準備 |
| 0.1 | 2025-12-18 | 初版作成 |
