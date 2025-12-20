# mdJournal - ドキュメント一覧

## 📋 概要

mdJournalは、Markdown形式で管理している日報をグラフィカルに表示・編集するためのWebダッシュボードアプリケーションです。

### 主な特徴

- 📅 カレンダー表示による予定の可視化
- ⏱️ タイムライン表示による計画・実績の管理
- ✅ TODOのプロジェクト別管理
- 📝 ビジュアル/テキストモードの切り替え編集
- 🔗 Slack、Git、Googleカレンダーとの連携
- ⚙️ カスタマイズ可能なダッシュボードレイアウト

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18+ |
| UIフレームワーク | Ant Design 5.x |
| バックエンド | Express.js |
| データ形式 | Markdown / YAML |

---

## 📚 ドキュメント一覧

### 要求・設計仕様

| ドキュメント | 説明 |
|-------------|------|
| [requirements.md](./requirements.md) | **要求仕様書**<br>機能要件、非機能要件、API仕様、画面設計、開発フェーズ |
| [markdown-format-spec.md](./markdown-format-spec.md) | **Markdownフォーマット仕様**<br>日報ファイルの形式、セクション定義、パース規則 |
| [config-spec.md](./config-spec.md) | **設定ファイル仕様**<br>YAML設定ファイルの詳細スキーマ |
| [integration-spec.md](./integration-spec.md) | **外部連携仕様**<br>Slack、Git、Googleカレンダー連携の技術仕様 |
| [extension-spec.md](./extension-spec.md) | **拡張機能仕様**<br>TypeScriptによるユーザー拡張の実装方法 |

### CLIツール

| コマンド | 説明 |
|---------|------|
| `npx mdjournal` | サーバー起動（サンプルデータ） |
| `npx mdjournal ./mdjournal.config.yaml` | 設定ファイルを指定して起動 |
| `npx mdjournal validate <path>` | 日報フォーマットのバリデーション |
| `npx mdjournal validate --rules` | バリデーションルール一覧 |
| `npx mdjournal stats <path>` | frontmatter（統計情報）の再集計 |
| `npx mdjournal stats <path> --dry-run` | 変更プレビュー（更新なし） |

---

## 🗂️ プロジェクト構成

### mdJournal本体（npmパッケージ）

```
mdjournal/                    # npmパッケージとして公開
├── docs/                          # ドキュメント
│   ├── index.md
│   ├── requirements.md
│   ├── markdown-format-spec.md
│   ├── config-spec.md
│   ├── integration-spec.md
│   └── extension-spec.md
│
├── server/                        # バックエンド（Express.js）
│   ├── src/
│   │   ├── index.ts              # エントリーポイント
│   │   ├── cli.ts                # CLIエントリーポイント
│   │   ├── routes/               # APIルート
│   │   │   ├── reports.ts
│   │   │   ├── calendar.ts
│   │   │   ├── config.ts
│   │   │   └── gcal.ts
│   │   ├── types/                # 型定義
│   │   └── utils/
│   │       ├── markdown.ts
│   │       ├── fileManager.ts
│   │       ├── validator.ts
│   │       └── git.ts
│   ├── package.json
│   └── tsconfig.json
│
├── client/                        # フロントエンド（React）
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/           # UIコンポーネント
│   │   │   ├── Dashboard/
│   │   │   ├── Calendar/
│   │   │   ├── Timeline/
│   │   │   ├── Todo/
│   │   │   └── Editor/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── models/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
│
├── sample/                        # サンプルデータ（動作確認用）
│   ├── mdjournal.config.yaml     # ルート設定ファイル
│   ├── config/
│   │   ├── projects.yaml
│   │   └── routines.yaml
│   └── reports/
│       └── 2025/12/
│           └── 2025-12-18.md
│
├── package.json                   # ルートpackage.json
├── .gitignore
└── README.md
```

### ユーザーデータリポジトリ（個人別に作成）

```
my-journals/                       # ユーザー個人のデータリポジトリ
├── data/                          # 日報ファイル（Git管理）
│   └── YYYY/MM/
│       └── YYYY-MM-DD.md
│
├── config/                        # 設定ファイル
│   ├── projects.yaml             # プロジェクトマスタ
│   └── routines.yaml             # ルーチン定義
│
├── extensions/                    # ユーザー拡張コード（TypeScript）
│   ├── tsconfig.json
│   ├── my-slack-extension.ts
│   └── my-attendance.ts
│
├── mdjournal.config.yaml          # ルート設定ファイル
├── .env                           # 環境変数（APIキー等）
└── .gitignore                     # .envを除外
```

---

## 🚀 利用方法

### サンプルデータで試す

```bash
# npxで直接起動（インストール不要）
npx mdjournal

# ブラウザでアクセス
open http://localhost:3001
```

### 個人データリポジトリで利用

```bash
# 1. データリポジトリを作成
mkdir my-journals && cd my-journals
git init

# 2. 設定ファイル (mdjournal.config.yaml) を作成
cat > mdjournal.config.yaml << EOF
projects: ./config/projects.yaml
routines: ./config/routines.yaml
reports: ./data

timeline:
  hourHeight: 60
  maxHours: 36
  defaultStartHour: 8
  defaultEndHour: 20
  snapMinutes: 15

server:
  port: 3001
EOF

# 3. ダッシュボードを起動
npx mdjournal ./mdjournal.config.yaml
```

### 日報フォーマットのバリデーション

既存の日報ファイルが仕様に準拠しているか検証できます。

```bash
# ディレクトリ内の全.mdファイルを検証
npx mdjournal validate ./data

# 詳細出力（修正提案を含む）
npx mdjournal validate ./data --verbose

# 厳格モード（警告もエラーとして扱う）
npx mdjournal validate ./data --strict

# JSON形式で出力（CI/CD連携用）
npx mdjournal validate ./data --json

# 利用可能なルール一覧を表示
npx mdjournal validate --rules
```

**検出可能な問題:**
- ヘッダー形式の不備
- 旧形式のセクション区切り線（=====）
- 旧形式の場所サブセクション（### [home]）
- PLAN/RESULT項目の形式エラー
- TODO行内のインラインプロジェクトコード（旧形式）
- 括弧形式の期限（旧形式）
- ネストされたTODO（旧形式）

### frontmatter（統計情報）の再集計

日報ファイルにfrontmatter（統計情報）を付与または再集計できます。

```bash
# ディレクトリ内の全.mdファイルにfrontmatterを付与・更新
npx mdjournal stats ./data

# 変更内容のプレビュー（実際には更新しない）
npx mdjournal stats ./data --dry-run

# 詳細出力
npx mdjournal stats ./data --verbose

# バリデーションを事前実行（エラーがあるファイルはスキップ）
npx mdjournal stats ./data --validate
```

**frontmatterフィールド:**
- `planHours`: 計画時間の合計（時間）
- `resultHours`: 実績時間の合計（時間）
- `todoCount`: TODO総数
- `todoCompleted`: 完了TODO数
- `todoInProgress`: 進行中TODO数
- `projectHours`: プロジェクト別実績時間
- `updatedAt`: 最終更新日時


---

## 📝 更新履歴

| 日付 | バージョン | 更新内容 |
|------|-----------|---------|
| 2025-12-20 | 1.0.0 | mdJournalとして公開準備 |
| 2025-12-18 | 0.1 | 初版作成 |

---

## 👥 コントリビューション

本プロジェクトへの貢献を歓迎します。

1. Issueで機能要望やバグ報告
2. Pull Requestでコード貢献
3. ドキュメントの改善

---

## 📄 ライセンス

MIT License

