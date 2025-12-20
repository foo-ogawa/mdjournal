# mdJournal 設定ファイル仕様書

## 1. 概要

本ドキュメントは、mdJournalで使用する設定ファイル（YAML形式）の仕様を定義する。

---

## 2. 設定ファイル一覧

| ファイル | 説明 |
|---------|------|
| `mdjournal.config.yaml` | ルート設定ファイル |
| `config/projects.yaml` | プロジェクトマスタ |
| `config/routines.yaml` | ルーチン定義 |
| `config/integrations.yaml` | 外部連携設定 |

---

## 3. mdjournal.config.yaml（ルート設定）

### 3.1 スキーマ

```yaml
# 各設定ファイルへのパス（このファイルからの相対パス）
projects: string           # プロジェクト定義ファイルのパス
routines: string           # ルーチン定義ファイルのパス

# 日報ディレクトリ
reports: string            # 日報ファイルの保存ディレクトリ

# タイムライン設定
timeline:
  hourHeight: number       # 1時間あたりの高さ（ピクセル）
  maxHours: number         # 最大表示時間
  defaultStartHour: number # デフォルト開始時刻
  defaultEndHour: number   # デフォルト終了時刻
  snapMinutes: number      # ドラッグ時のスナップ単位（分）

# サーバー設定
server:
  port: number             # サーバーポート
  cors: string             # CORSで許可するオリジン
```

### 3.2 設定例

```yaml
# mdJournal ルート設定ファイル
# 
# 使用方法:
#   npx mdjournal ./mdjournal.config.yaml
#   npx mdjournal -c ./mdjournal.config.yaml

# 各設定ファイルへのパス（このファイルからの相対パス）
projects: ./config/projects.yaml
routines: ./config/routines.yaml

# 日報ディレクトリ
reports: ./data

# タイムライン設定
timeline:
  hourHeight: 60          # 1時間あたりの高さ（ピクセル）
  maxHours: 36            # 最大表示時間（8:00から最大36時間 = 翌日20:00まで）
  defaultStartHour: 8     # デフォルト開始時刻（スロットが空の場合の表示開始時間）
  defaultEndHour: 20      # デフォルト終了時刻（スロットが空の場合の表示終了時間）
  snapMinutes: 15         # ドラッグ時のスナップ単位（分）

# サーバー設定（オプション）
server:
  port: 3001
  cors: http://localhost:5173
```

---

## 4. projects.yaml

### 4.1 スキーマ

```yaml
# プロジェクト定義
projects:
  - code: string           # プロジェクトコード（一意）
    name: string           # プロジェクト名
    fullName: string       # フルネーム（オプション）
    color: string          # 表示色（Hex）
    category: string       # カテゴリID
    client: string         # クライアント名（オプション）
    description: string    # 説明（オプション）
    active: boolean        # アクティブ状態

# カテゴリ定義
categories:
  - id: string
    name: string
    color: string          # オプション
```

### 4.2 完全な設定例

```yaml
projects:
  # 社内業務
  - code: "P99"
    name: "社内業務"
    fullName: "社内管理・雑務"
    color: "#52c41a"
    category: "internal"
    active: true
  
  # クライアント案件
  - code: "P34"
    name: "クライアントA"
    fullName: "クライアントA システム開発"
    color: "#1890ff"
    category: "client"
    client: "A社"
    description: "クライアントAシステム開発・運用"
    active: true
  
  - code: "P14"
    name: "システムB"
    fullName: "システムB"
    color: "#722ed1"
    category: "client"
    active: true

  - code: "P08"
    name: "サービスC"
    color: "#eb2f96"
    category: "client"
    active: true

  - code: "P37"
    name: "クライアントD"
    fullName: "クライアントD"
    color: "#fa8c16"
    category: "client"
    client: "D社"
    active: true

  - code: "P25"
    name: "プロジェクトE"
    color: "#13c2c2"
    category: "client"
    active: true

  - code: "904"
    name: "研究プロジェクト"
    color: "#2f54eb"
    category: "research"
    active: true

  # 非アクティブプロジェクト
  - code: "P18"
    name: "旧プロジェクト"
    color: "#14B8A6"
    category: "client"
    active: false

categories:
  - id: "internal"
    name: "社内業務"
    color: "#52c41a"
  
  - id: "client"
    name: "クライアント業務"
    color: "#1890ff"
  
  - id: "research"
    name: "研究・開発"
    color: "#722ed1"
  
  - id: "personal"
    name: "個人"
    color: "#8c8c8c"
```

---

## 5. routines.yaml

### 5.1 スキーマ

```yaml
routines:
  # 週次ルーチン（曜日別）
  weekly:
    monday: RoutineItem[]
    tuesday: RoutineItem[]
    wednesday: RoutineItem[]
    thursday: RoutineItem[]
    friday: RoutineItem[]
    saturday: RoutineItem[]
    sunday: RoutineItem[]

  # 随時ルーチン
  adhoc: AdhocRoutineItem[]

  # 月次ルーチン
  monthly:
    start_of_month: MonthlyTask[]    # 月初タスク
    end_of_month: MonthlyTask[]      # 月末タスク

  # 四半期ルーチン
  quarterly:
    - months: number[]       # 対象月（例: [3, 6, 9, 12]）
      tasks: QuarterlyTask[]

  # 年次ルーチン
  yearly:
    - month: number          # 月
      day: number            # 日
      project: string
      task: string

# RoutineItem定義（週次・随時）
RoutineItem:
  time: string             # HH:MM
  project: string          # プロジェクトコード
  task: string             # タスク名
  duration: number         # 時間（分）、オプション

# MonthlyTask/QuarterlyTask定義
MonthlyTask:
  project: string
  task: string
```

### 5.2 完全な設定例

```yaml
routines:
  weekly:
    monday:
      - time: "08:00"
        project: "P99"
        task: "タスク確認・整理、日報返信"
      - time: "09:00"
        project: "P99"
        task: "定例会議"
      - time: "09:30"
        project: "P37"
        task: "クライアントD デイリー"
      - time: "10:30"
        project: "P99"
        task: "管理部門MTG"
    
    tuesday:
      - time: "08:00"
        project: "P99"
        task: "タスク確認・整理、日報返信"
      - time: "09:30"
        project: "P99"
        task: "経営会議"
    
    wednesday:
      - time: "08:00"
        project: "P99"
        task: "タスク確認・整理、日報返信"
      - time: "10:00"
        project: "P14"
        task: "システムB 週次MTG"
    
    thursday:
      - time: "08:00"
        project: "P99"
        task: "タスク確認・整理、日報返信"
      - time: "15:00"
        project: "P99"
        task: "全社会"
    
    friday:
      - time: "08:00"
        project: "P99"
        task: "タスク確認・整理、日報返信"
      - time: "17:00"
        project: "P99"
        task: "週報作成"

  adhoc:
    - time: "14:00"
      project: "P14"
      task: "システムB 開発MTG"

  monthly:
    start_of_month:
      - project: "P99"
        task: "経費精算申請"
      - project: "P99"
        task: "個人立替経費精算"
    
    end_of_month:
      - project: "P99"
        task: "面談スケジュール調整"
      - project: "P14"
        task: "システムB 保守工数集計"

  quarterly:
    - months: [6, 12]
      tasks:
        - project: "P99"
          task: "契約更新確認（半年ごと）"
    
    - months: [3, 6, 9, 12]
      tasks:
        - project: "P99"
          task: "四半期レビュー"

  yearly:
    - month: 11
      day: 10
      project: "P99"
      task: "クラウドサービス契約更新"
    
    - month: 8
      day: 1
      project: "P99"
      task: "保守契約更新"
```

---

## 6. integrations.yaml

外部連携設定。詳細は `integration-spec.md` を参照。

```yaml
# Slack連携
slack:
  enabled: true
  bot_token: "${SLACK_BOT_TOKEN}"
  signing_secret: "${SLACK_SIGNING_SECRET}"
  daily_report:
    channel_id: "C0123456789"
    channel_name: "#daily-report"
    auto_post: false
    post_time: "09:00"
  todo_sync:
    enabled: true
    sources:
      - type: "stars"
      - type: "bookmarks"

# Git連携
git:
  enabled: true
  repo_path: "./data"
  auto_commit:
    enabled: true
    on_save: true
  auto_push:
    enabled: false
  commit_message:
    template: "📝 Update daily report: {date}"

# Googleカレンダー連携
google_calendar:
  enabled: true
  credentials_path: "./config/google-credentials.json"
  token_path: "./config/google-token.json"
  calendars:
    - id: "primary"
      name: "メインカレンダー"
      color: "#4285f4"
      show: true
  sync:
    range_days_before: 7
    range_days_after: 30
    refresh_interval: 300

# 勤怠連携（将来）
attendance:
  enabled: false
```

---

## 7. user.yaml

### 7.1 スキーマ

```yaml
# ユーザー基本情報
user:
  name: string             # 名前
  email: string            # メールアドレス（オプション）

# 日報設定
daily_report:
  author_name: string      # 日報の著者名
  template_path: string    # テンプレートファイルパス
  default_start_time: string  # デフォルト開始時刻
  default_end_time: string    # デフォルト終了時刻

# 通知設定
notifications:
  reminder:
    enabled: boolean
    time: string           # HH:MM
  overdue_todo:
    enabled: boolean

# ショートカット設定
shortcuts:
  custom: object           # カスタムショートカット定義
```

### 7.2 設定例

```yaml
user:
  name: "サンプル太郎"
  email: "sample@example.com"

daily_report:
  author_name: "サンプル太郎"
  default_start_time: "08:00"
  default_end_time: "18:00"

notifications:
  reminder:
    enabled: true
    time: "08:30"
  overdue_todo:
    enabled: true

shortcuts:
  custom:
    "Ctrl+Shift+S": "slack_post"
    "Ctrl+Shift+C": "git_commit"
```

---

## 8. 環境変数の参照

設定ファイル内で `${ENV_VAR_NAME}` 形式で環境変数を参照可能。

```yaml
slack:
  bot_token: "${SLACK_BOT_TOKEN}"
  signing_secret: "${SLACK_SIGNING_SECRET}"
```

実行時に環境変数の値に置換される。

---

## 9. 設定ファイルのバリデーション

起動時に以下のバリデーションを実施：

1. **必須項目チェック**
   - `projects` が1つ以上定義されている

2. **参照整合性チェック**
   - ルーチンの `project` が `projects.yaml` に存在

3. **形式チェック**
   - 色コードが有効なHex形式
   - 時刻がHH:MM形式

エラー時はログに警告を出力し、デフォルト値で補完。

---

## 更新履歴

| バージョン | 日付 | 更新内容 |
|-----------|------|---------|
| 1.0 | 2025-12-20 | mdJournalとして公開準備 |
| 0.2 | 2025-12-19 | 四半期・年次ルーチンの定義を明確化 |
| 0.1 | 2025-12-18 | 初版作成 |
