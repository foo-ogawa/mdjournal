# mdJournal サーバー

Markdown形式の日報データを管理するREST APIサーバーです。

## 起動方法

```bash
# 依存関係のインストール
npm install

# 開発モードで起動（ホットリロード有効）
npm run dev

# ビルド
npm run build

# 本番モードで起動
npm start
```

## CLI コマンド

### サーバー起動

```bash
# サンプルデータで起動
npx mdjournal

# 設定ファイルを指定して起動
npx mdjournal ./mdjournal.config.yaml
npx mdjournal -c ./mdjournal.config.yaml

# ポートを指定して起動
npx mdjournal -p 8080
```

### バリデーション（フォーマット検証）

日報ファイルが仕様に準拠しているか検証します。

```bash
# ディレクトリ内の全.mdファイルを検証
npx mdjournal validate ./data

# 特定の年度のみ検証
npx mdjournal validate ./data/2020

# 厳格モード（警告もエラーとして扱う）
npx mdjournal validate ./data --strict

# 詳細出力（修正提案を含む）
npx mdjournal validate ./data --verbose

# JSON形式で出力（CI/CD連携用）
npx mdjournal validate ./data --json

# 利用可能なルール一覧を表示
npx mdjournal validate --rules

# 特定のルールをスキップ
npx mdjournal validate ./data --skip separator-line,location-subsection
```

### 統計情報（frontmatter）再集計

日報ファイルにfrontmatter（統計情報）を付与または再集計します。

```bash
# ディレクトリ内の全.mdファイルにfrontmatterを付与・更新
npx mdjournal stats ./data

# 変更内容のプレビュー（実際には更新しない）
npx mdjournal stats ./data --dry-run

# 詳細出力
npx mdjournal stats ./data --verbose

# バリデーションを事前実行（エラーがあるファイルはスキップ）
npx mdjournal stats ./data --validate

# JSON形式で出力
npx mdjournal stats ./data --json
```

#### frontmatterフィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `planHours` | number | 計画時間の合計（時間） |
| `resultHours` | number | 実績時間の合計（時間） |
| `todoCount` | integer | TODO総数 |
| `todoCompleted` | integer | 完了TODO数 |
| `todoInProgress` | integer | 進行中TODO数 |
| `projectHours` | object | プロジェクト別実績時間（時間） |
| `updatedAt` | string | 最終更新日時（ISO 8601形式） |

#### バリデーションルール

| ルールコード | 説明 |
|------------|------|
| `header-format` | 日報ヘッダーの形式チェック |
| `separator-line` | セクション区切り線（=====）の検出 |
| `location-subsection` | 場所サブセクション（### [home]）の検出 |
| `schedule-item-format` | PLAN/RESULT項目の形式チェック |
| `time-format` | 時刻形式のチェック |
| `todo-list-marker` | TODOリストマーカーの統一チェック |
| `todo-inline-project` | TODO行内のプロジェクトコード検出 |
| `todo-deadline-format` | 期限の括弧形式検出 |
| `nested-todo` | ネストされたTODO検出 |
| `required-sections` | 必須セクションの存在チェック |

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `PORT` | サーバーポート | `3001` |
| `CONFIG_REPORTS` | 日報ディレクトリのパス | `./sample/reports` |
| `CONFIG_PROJECTS` | プロジェクト設定ファイルのパス | `./sample/config/projects.yaml` |
| `CONFIG_ROUTINES` | ルーチン設定ファイルのパス | `./sample/config/routines.yaml` |
| `CORS_ORIGIN` | CORSで許可するオリジン | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | - |

## API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/reports/:date` | 日報取得 |
| PUT | `/api/reports/:date` | 日報保存 |
| DELETE | `/api/reports/:date` | 日報削除 |
| GET | `/api/calendar` | カレンダー用集計データ取得 |
| GET | `/api/calendar/months` | 日報が存在する年月リスト取得 |
| GET | `/api/config` | 設定取得 |
| PUT | `/api/config` | 設定更新 |
| GET | `/api/gcal/events` | Googleカレンダー予定取得 |
| GET | `/api/health` | ヘルスチェック |

## ディレクトリ構造

```
server/
├── src/
│   ├── index.ts          # エントリーポイント
│   ├── cli.ts            # CLIエントリーポイント
│   ├── routes/           # APIルーター
│   │   ├── reports.ts    # 日報API
│   │   ├── calendar.ts   # カレンダーAPI
│   │   ├── config.ts     # 設定API
│   │   └── gcal.ts       # Googleカレンダー連携API
│   ├── types/            # 型定義
│   │   └── index.ts
│   └── utils/            # ユーティリティ
│       ├── markdown.ts   # Markdownパーサー
│       ├── fileManager.ts # ファイル管理
│       ├── validator.ts  # フォーマットバリデーター
│       └── git.ts        # Git連携
├── package.json
├── tsconfig.json
└── README.md
```

## 日報ファイル形式

日報ファイルはYAML frontmatter + Markdown形式で保存されます。
詳細は [markdown-format-spec.md](../docs/markdown-format-spec.md) を参照してください。

```markdown
---
planHours: 8.0
resultHours: 7.5
todoCount: 5
todoCompleted: 2
todoInProgress: 1
projectHours:
  P99: 2.5
  P34: 3.0
updatedAt: 2025-12-18T17:30:00+09:00
---
# [日報] サンプル太郎 2025-12-18

## [PLAN]
* 08:30 [P99] タスク確認
* 09:00

## [RESULT]
* 08:30 [P99] タスク確認
* 09:00

## [TODO]

### P99
- [ ] @2025-12-20 !!! 重要タスク
- [*] !! 進行中タスク
- [x] 完了タスク
- [-] 保留タスク

## [NOTE]
自由記述メモ
```

## 開発

```bash
# TypeScriptの型チェック
npx tsc --noEmit

# ESLint
npm run lint
```
