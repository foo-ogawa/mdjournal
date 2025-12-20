# mdJournal 拡張機能仕様書

## 1. 概要

本ドキュメントは、mdJournalのユーザー拡張機能（Extensions）の仕様を定義する。

ユーザーは独自のTypeScriptコードを作成し、以下の機能を拡張できる：
- 外部システムとの連携（勤怠システム、独自API等）
- データ変換・加工処理
- カスタムアクション（ボタン・メニュー）
- 通知・Webhook

---

## 2. 拡張機能の種類

| タイプ | 説明 | 用途例 |
|-------|------|--------|
| `integration` | 外部システム連携 | 勤怠API、独自Slack設定、カスタムWebhook |
| `transformer` | データ変換 | 日報フォーマット変換、エクスポート処理 |
| `action` | カスタムアクション | ボタン追加、メニュー拡張 |
| `hook` | ライフサイクルフック | 保存前/後処理、起動時処理 |

---

## 3. ディレクトリ構成

```
my-journals/
└── extensions/
    ├── tsconfig.json           # TypeScript設定
    ├── package.json            # 依存関係
    ├── index.ts                # エントリーポイント（オプション）
    │
    ├── integrations/           # 連携拡張
    │   ├── my-attendance.ts    # 勤怠システム連携
    │   └── my-slack.ts         # Slack拡張設定
    │
    ├── transformers/           # データ変換
    │   └── export-csv.ts       # CSV出力
    │
    ├── actions/                # カスタムアクション
    │   └── quick-report.ts     # クイック日報作成
    │
    └── hooks/                  # ライフサイクルフック
        └── on-save.ts          # 保存時処理
```

---

## 4. 基本インターフェース

### 4.1 拡張機能の基底インターフェース

```typescript
// mdjournal/types からインポート可能

/**
 * 拡張機能のメタデータ
 */
interface ExtensionMeta {
  /** 拡張機能ID（一意） */
  id: string;
  /** 表示名 */
  name: string;
  /** 説明 */
  description?: string;
  /** バージョン */
  version?: string;
  /** 拡張タイプ */
  type: 'integration' | 'transformer' | 'action' | 'hook';
}

/**
 * 拡張機能の基底インターフェース
 */
interface Extension {
  meta: ExtensionMeta;
  
  /** 初期化処理（起動時に呼ばれる） */
  initialize?(context: ExtensionContext): Promise<void>;
  
  /** 終了処理（シャットダウン時に呼ばれる） */
  dispose?(): Promise<void>;
}

/**
 * 拡張機能に渡されるコンテキスト
 */
interface ExtensionContext {
  /** 設定ファイルへのアクセス */
  config: ConfigService;
  /** ログ出力 */
  logger: Logger;
  /** 環境変数 */
  env: Record<string, string | undefined>;
  /** データディレクトリパス */
  dataDir: string;
  /** HTTPクライアント（axios互換） */
  http: HttpClient;
}
```

### 4.2 Integration（外部連携）拡張

```typescript
/**
 * 外部システム連携の拡張
 */
interface IntegrationExtension extends Extension {
  meta: ExtensionMeta & { type: 'integration' };
  
  /** 連携の有効/無効を返す */
  isEnabled(): boolean;
  
  /** 連携アクションを定義 */
  actions: IntegrationAction[];
}

interface IntegrationAction {
  /** アクションID */
  id: string;
  /** 表示名 */
  name: string;
  /** アイコン（Ant Design アイコン名） */
  icon?: string;
  /** 実行関数 */
  execute(params: ActionParams): Promise<ActionResult>;
}

interface ActionParams {
  /** 対象日付 */
  date?: string;
  /** 日報データ */
  report?: DailyReport;
  /** その他パラメータ */
  [key: string]: unknown;
}

interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}
```

### 4.3 Hook（ライフサイクルフック）拡張

```typescript
/**
 * ライフサイクルフックの拡張
 */
interface HookExtension extends Extension {
  meta: ExtensionMeta & { type: 'hook' };
  
  /** 日報保存前 */
  onBeforeSave?(report: DailyReport): Promise<DailyReport | void>;
  
  /** 日報保存後 */
  onAfterSave?(report: DailyReport): Promise<void>;
  
  /** 日報読み込み後 */
  onAfterLoad?(report: DailyReport): Promise<DailyReport | void>;
  
  /** TODO状態変更時 */
  onTodoStatusChange?(todo: TodoItem, oldStatus: string, newStatus: string): Promise<void>;
  
  /** 日付変更時 */
  onDateChange?(newDate: string, oldDate: string): Promise<void>;
}
```

### 4.4 Transformer（データ変換）拡張

```typescript
/**
 * データ変換の拡張
 */
interface TransformerExtension extends Extension {
  meta: ExtensionMeta & { type: 'transformer' };
  
  /** 対応する出力形式 */
  outputFormats: TransformFormat[];
  
  /** 変換実行 */
  transform(report: DailyReport, format: string): Promise<TransformResult>;
}

interface TransformFormat {
  id: string;
  name: string;
  extension: string;  // ファイル拡張子
  mimeType: string;
}

interface TransformResult {
  content: string | Buffer;
  filename: string;
  mimeType: string;
}
```

### 4.5 Action（カスタムアクション）拡張

```typescript
/**
 * カスタムアクションの拡張
 */
interface ActionExtension extends Extension {
  meta: ExtensionMeta & { type: 'action' };
  
  /** UIに追加するアクション */
  actions: CustomAction[];
}

interface CustomAction {
  id: string;
  name: string;
  icon?: string;
  /** 表示位置 */
  placement: 'toolbar' | 'menu' | 'context-menu';
  /** キーボードショートカット */
  shortcut?: string;
  /** 実行関数 */
  execute(context: ActionContext): Promise<void>;
}

interface ActionContext {
  /** 現在の日付 */
  currentDate: string;
  /** 現在の日報 */
  currentReport?: DailyReport;
  /** 選択中のTODO */
  selectedTodo?: TodoItem;
  /** UIサービス（トースト表示等） */
  ui: UIService;
}
```

---

## 5. 拡張機能の実装例

### 5.1 勤怠システム連携

```typescript
// extensions/integrations/my-attendance.ts

import { 
  IntegrationExtension, 
  ExtensionContext,
  ActionParams,
  ActionResult 
} from 'mdjournal/types';

const myAttendanceExtension: IntegrationExtension = {
  meta: {
    id: 'my-attendance',
    name: '勤怠システム連携',
    description: '社内勤怠システムへの出退勤データ送信',
    type: 'integration',
    version: '1.0.0',
  },

  isEnabled() {
    return !!process.env.ATTENDANCE_API_KEY;
  },

  actions: [
    {
      id: 'submit-attendance',
      name: '勤怠データ送信',
      icon: 'ClockCircleOutlined',
      
      async execute(params: ActionParams): Promise<ActionResult> {
        const { report, date } = params;
        
        if (!report) {
          return { success: false, message: '日報データがありません' };
        }

        // PLANから出勤時刻を取得
        const workStart = report.plan[0]?.time;
        // RESULTから退勤時刻を取得
        const workEnd = report.result[report.result.length - 1]?.time;

        if (!workStart || !workEnd) {
          return { success: false, message: '出退勤時刻が特定できません' };
        }

        try {
          const response = await fetch(process.env.ATTENDANCE_API_URL!, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.ATTENDANCE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date,
              start_time: workStart,
              end_time: workEnd,
              break_minutes: 60,
            }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          return { 
            success: true, 
            message: `勤怠データを送信しました (${workStart} - ${workEnd})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `送信エラー: ${error}` 
          };
        }
      },
    },
  ],
};

export default myAttendanceExtension;
```

### 5.2 Slack拡張（独自チャンネル設定）

```typescript
// extensions/integrations/my-slack.ts

import { 
  IntegrationExtension,
  ActionParams,
  ActionResult 
} from 'mdjournal/types';

const mySlackExtension: IntegrationExtension = {
  meta: {
    id: 'my-slack',
    name: 'Slack拡張',
    description: 'プロジェクト別チャンネルへの投稿',
    type: 'integration',
    version: '1.0.0',
  },

  isEnabled() {
    return !!process.env.SLACK_BOT_TOKEN;
  },

  actions: [
    {
      id: 'post-to-project-channel',
      name: 'プロジェクトチャンネルに投稿',
      icon: 'SlackOutlined',
      
      async execute(params: ActionParams): Promise<ActionResult> {
        const { report, date } = params;
        
        if (!report) {
          return { success: false, message: '日報データがありません' };
        }

        // プロジェクト別にチャンネルを分けて投稿
        const projectChannels: Record<string, string> = {
          'P34': 'C0123456789',  // #clientA-daily
          'P14': 'C0234567890',  // #systemB-daily
          'P37': 'C0345678901',  // #clientD-daily
        };

        const results: string[] = [];

        for (const [projectCode, channelId] of Object.entries(projectChannels)) {
          const projectTasks = report.plan.filter(p => p.projectCode === projectCode);
          
          if (projectTasks.length === 0) continue;

          const message = formatProjectMessage(date!, projectCode, projectTasks);
          
          // Slack API呼び出し
          const response = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channel: channelId,
              text: message,
            }),
          });

          if (response.ok) {
            results.push(projectCode);
          }
        }

        return {
          success: true,
          message: `投稿完了: ${results.join(', ')}`,
        };
      },
    },
  ],
};

function formatProjectMessage(date: string, projectCode: string, tasks: any[]): string {
  const taskList = tasks.map(t => `• ${t.time} ${t.task}`).join('\n');
  return `📋 *${date} - ${projectCode}*\n${taskList}`;
}

export default mySlackExtension;
```

### 5.3 保存時フック

```typescript
// extensions/hooks/on-save.ts

import { HookExtension, DailyReport } from 'mdjournal/types';

const onSaveHook: HookExtension = {
  meta: {
    id: 'on-save-hook',
    name: '保存時処理',
    type: 'hook',
  },

  async onBeforeSave(report: DailyReport): Promise<DailyReport> {
    // 保存前にTODOを自動ソート（未完了を上に）
    const sortedTodos = [...report.todos].sort((a, b) => {
      const statusOrder = { pending: 0, in_progress: 1, hold: 2, completed: 3 };
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });

    return {
      ...report,
      todos: sortedTodos,
    };
  },

  async onAfterSave(report: DailyReport): Promise<void> {
    // 保存後にログ出力
    console.log(`[Hook] Report saved: ${report.date}`);
    
    // 完了TODOがあればSlackに通知（例）
    const completedToday = report.todos.filter(t => t.status === 'completed');
    if (completedToday.length > 0) {
      console.log(`[Hook] ${completedToday.length} TODOs completed today!`);
    }
  },
};

export default onSaveHook;
```

### 5.4 CSVエクスポート

```typescript
// extensions/transformers/export-csv.ts

import { TransformerExtension, DailyReport, TransformResult } from 'mdjournal/types';

const csvExporter: TransformerExtension = {
  meta: {
    id: 'csv-exporter',
    name: 'CSVエクスポート',
    type: 'transformer',
  },

  outputFormats: [
    { id: 'plan-csv', name: '計画CSV', extension: 'csv', mimeType: 'text/csv' },
    { id: 'todo-csv', name: 'TODO CSV', extension: 'csv', mimeType: 'text/csv' },
  ],

  async transform(report: DailyReport, format: string): Promise<TransformResult> {
    if (format === 'plan-csv') {
      const header = '日付,時刻,プロジェクト,タスク\n';
      const rows = report.plan.map(p => 
        `${report.date},${p.time},${p.projectCode},${p.task}`
      ).join('\n');

      return {
        content: header + rows,
        filename: `plan_${report.date}.csv`,
        mimeType: 'text/csv',
      };
    }

    if (format === 'todo-csv') {
      const header = '日付,ステータス,プロジェクト,タスク,期限\n';
      const rows = report.todos.map(t => 
        `${report.date},${t.status},${t.projectCode || ''},${t.task},${t.dueDate || ''}`
      ).join('\n');

      return {
        content: header + rows,
        filename: `todos_${report.date}.csv`,
        mimeType: 'text/csv',
      };
    }

    throw new Error(`Unknown format: ${format}`);
  },
};

export default csvExporter;
```

---

## 6. 設定ファイル

### 6.1 extensions/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "paths": {
      "mdjournal/types": ["node_modules/mdjournal/types"]
    }
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 6.2 extensions/package.json

```json
{
  "name": "my-journal-extensions",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "mdjournal": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### 6.3 integrations.yamlでの拡張有効化

```yaml
# config/integrations.yaml

extensions:
  enabled: true
  dir: "./extensions"
  
  # 有効にする拡張機能
  active:
    - my-attendance
    - my-slack
    - on-save-hook
    - csv-exporter
  
  # 拡張機能ごとの設定
  config:
    my-attendance:
      auto_submit: false
      submit_time: "18:00"
    
    my-slack:
      default_channel: "#daily-report"
```

---

## 7. CLI コマンド

```bash
# 拡張機能ディレクトリを初期化
npx mdjournal init-extension

# 拡張機能のテンプレートを生成
npx mdjournal create-extension --type integration --name my-api

# 拡張機能をビルド
npx mdjournal build-extension

# 拡張機能を有効にして起動
npx mdjournal serve --extensions ./extensions

# 拡張機能の一覧を表示
npx mdjournal list-extensions

# 特定の拡張機能のアクションを実行
npx mdjournal run-action my-attendance:submit-attendance --date 2025-12-18
```

---

## 8. セキュリティ考慮事項

### 8.1 拡張機能の実行環境

- 拡張機能はサーバーサイド（Node.js）で実行される
- ファイルシステムアクセスは `dataDir` 配下に制限（オプション）
- 環境変数は `process.env` 経由でアクセス可能

### 8.2 APIキーの管理

- APIキー等の機密情報は `.env` ファイルで管理
- `.env` は `.gitignore` に追加してGit管理から除外
- 拡張機能内でハードコードしない

### 8.3 外部通信

- HTTP(S)通信はログに記録（オプション）
- 許可されたドメインのみに制限可能（設定ファイル）

---

## 9. API リファレンス

### GET `/api/extensions`

有効な拡張機能一覧を取得

```typescript
interface ExtensionListResponse {
  extensions: {
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    actions?: { id: string; name: string }[];
  }[];
}
```

### POST `/api/extensions/:extensionId/actions/:actionId`

拡張機能のアクションを実行

```typescript
// Request
interface ExecuteActionRequest {
  date?: string;
  params?: Record<string, unknown>;
}

// Response
interface ExecuteActionResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}
```

---

## 更新履歴

| バージョン | 日付 | 更新内容 |
|-----------|------|---------|
| 1.0 | 2025-12-20 | mdJournalとして公開準備 |
| 0.1 | 2025-12-18 | 初版作成 |
