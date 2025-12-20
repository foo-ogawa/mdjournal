# mdJournal Markdownフォーマット仕様書

## 1. 概要

本ドキュメントは、mdJournalで使用するMarkdownファイルのフォーマット仕様を定義する。

---

## 2. ファイル命名規則

### 2.1 日報ファイル

```
{YYYY}-{MM}-{DD}.md
```

- `YYYY`: 4桁の年
- `MM`: 2桁の月（ゼロパディング）
- `DD`: 2桁の日（ゼロパディング）

**例**: `2025-12-18.md`

### 2.2 ディレクトリ構造

```
data/
└── {YYYY}/
    └── {MM}/
        └── {YYYY}-{MM}-{DD}.md
```

**例**: `data/2025/12/2025-12-18.md`

---

## 3. Frontmatter（統計情報）

### 3.1 概要

日報ファイルの先頭にYAML frontmatterを配置し、統計情報を保存する。
これにより、カレンダー表示時にMarkdown本文をパースせずに高速な集計が可能となる。

### 3.2 形式

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
  P14: 2.0
updatedAt: 2025-12-18T17:30:00+09:00
---
# [日報] サンプル太郎 2025-12-18

## [PLAN]
...
```

### 3.3 フィールド定義

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `planHours` | number | 計画時間の合計（時間） |
| `resultHours` | number | 実績時間の合計（時間） |
| `todoCount` | integer | TODO総数 |
| `todoCompleted` | integer | 完了TODO数 |
| `todoInProgress` | integer | 進行中TODO数 |
| `projectHours` | object | プロジェクト別実績時間（時間） |
| `updatedAt` | string | 最終更新日時（ISO 8601形式） |

### 3.4 サーバーサイド処理

frontmatterはサーバーサイドで自動的に生成・更新される：

1. クライアントがMarkdown本文（frontmatterなし）を送信
2. サーバーがMarkdownをパースし、統計情報を計算
3. frontmatterを付与してファイルに保存

クライアントはfrontmatterを意識する必要がない。

### 3.5 パース規則

```javascript
// frontmatterの抽出
const frontmatterPattern = /^---\n([\s\S]*?)\n---\n/;

// frontmatter以降の本文を取得
function extractContent(fileContent) {
  const match = fileContent.match(frontmatterPattern);
  if (match) {
    return fileContent.slice(match[0].length);
  }
  return fileContent;
}

// frontmatterをYAMLとしてパース
function extractFrontmatter(fileContent) {
  const match = fileContent.match(frontmatterPattern);
  if (match) {
    return yaml.parse(match[1]);
  }
  return null;
}
```

---

## 4. ヘッダー形式

### 4.1 日報タイトル

```markdown
# [日報] {名前} {日付}
```

- 必須項目
- `{名前}`: 報告者の名前
- `{日付}`: YYYY-MM-DD形式

**例**:
```markdown
# [日報] サンプル太郎 2025-12-18
```

---

## 5. セクション定義

### 5.1 セクションヘッダー

セクションは`##`（H2）で定義し、`[]`でセクションタイプを明示する。

```markdown
## [{セクションタイプ}]
```

### 5.2 標準セクション

| セクションタイプ | 説明 | 必須 |
|----------------|------|------|
| `PLAN` | 計画・予定 | ○ |
| `RESULT` | 実績 | ○ |
| `TODO` | タスク一覧 | ○ |
| `NOTE` | メモ・備考 | - |
| `Hidden` | 非表示セクション | - |

### 5.3 カスタムセクション

任意のセクション名を追加可能。非標準セクションはダッシュボードでオプション表示として扱う。

```markdown
## 研究活動
## ルーチン
## 月次ルーチン
```

---

## 6. PLAN/RESULTセクション形式

### 6.1 基本形式

```markdown
* {開始時刻} [{プロジェクトコード}] {タスク名}
```

**重要**: 各タスクの終了時刻は、次のタスクの開始時刻により自動的に決定される。

### 6.2 時刻形式

```
HH:MM
```

- 24時間表記
- 分は00または30を推奨（15分単位も可）

### 6.3 プロジェクトコード形式

```
[{英数字}]
```

- `P`で始まる数字: `[P99]`, `[P34]`, `[P08]`
- 数字のみ: `[904]`
- 英字のみ: `[ABC]`

### 6.4 終了時刻・休憩の記載

時刻のみの行（`* HH:MM`）は以下の用途で使用する：

```markdown
* {時刻}
```

**用途**:
1. **途中の休憩**: セクションの途中に記載すると、前のタスクの終了時刻となり、休憩スロットとして扱う
2. **セクション終了**: セクションの最後に記載すると、最後のタスクの終了時刻を明示

**時間範囲**:
- 24時を超える時刻も使用可能（例: `30:00` = 翌日6:00）
- 最大36:00（翌日正午）まで対応

### 6.5 パース規則

```javascript
// タスク行のパターン
const planItemPattern = /^\*\s+(\d{2}:\d{2})\s+\[([^\]]+)\]\s+(.+)$/;

// 終了時刻のみの行のパターン
const endTimePattern = /^\*\s+(\d{2}:\d{2})\s*$/;
```

### 6.6 時間（duration）の計算

**重要**: durationはデータとして保持せず、UIレンダリング時に動的に計算する。

**計算アルゴリズム**:

```javascript
// レンダリング時にdurationを動的計算
function calculateRenderSlots(items, startHour, totalHours, hourHeight) {
  // 開始時刻でソート
  const sorted = [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  
  return sorted.map((item, index) => {
    const startMinutes = timeToMinutes(item.time);
    let duration;
    
    // 次のスロット（異なる開始時刻を持つもの）を探す
    let nextDifferentIndex = -1;
    for (let j = index + 1; j < sorted.length; j++) {
      if (timeToMinutes(sorted[j].time) !== startMinutes) {
        nextDifferentIndex = j;
        break;
      }
    }
    
    if (nextDifferentIndex !== -1) {
      // 次のスロットの開始時刻までがduration
      duration = timeToMinutes(sorted[nextDifferentIndex].time) - startMinutes;
    } else {
      // 最後のスロットは1時間
      duration = 60;
    }
    
    return { ...item, duration };
  });
}
```

**ルール**:
1. スロットの開始時刻と次のスロットの開始時刻の差がduration
2. 最後に終了時刻がなければ、最後のスロットは1時間の枠
3. **最後が休憩スロット（時刻のみ）の場合はレンダリングしない**（タイムラインの終了を意味）
4. 開始時刻が同一のスロットが2つ以上ある場合は重なることを許容

### 6.7 例

```markdown
## [PLAN]

* 08:30 [P99] タスク確認・整理、日報返信
* 09:00 [P99] 新人研修サポート
* 09:30 [P34] クライアントA MTG
* 10:00 [P34] 基盤相談会
* 12:00
* 13:00 [P02] プロジェクト開発
* 18:00 [P99] 雑務
* 21:00
```

上記の例では：
- 08:30-09:00 (30分): タスク確認・整理、日報返信
- 09:00-09:30 (30分): 新人研修サポート
- 09:30-10:00 (30分): クライアントA MTG
- 10:00-12:00 (120分): 基盤相談会
- 12:00-13:00 (60分): **休憩**（時刻のみの行）
- 13:00-18:00 (300分): プロジェクト開発
- 18:00-21:00 (180分): 雑務
- 21:00: **終了**（最後の時刻のみの行はレンダリングしない）

### 6.8 プロジェクトフィルタ適用時のduration計算

タイムライン表示でプロジェクトフィルタを適用する場合：

1. **全スロットでduration計算を実行**（フィルタなし）
2. **計算後にプロジェクトフィルタを適用**して表示

これにより、フィルタ適用時もスロットの表示サイズが変わらない。

---

## 7. TODOセクション形式

### 7.1 基本形式

```markdown
## [TODO]

### {プロジェクトコード}
- [{ステータス}] @{期限} {優先度} {タスク名}
  {詳細説明（2スペースインデント）}
```

### 7.2 ステータス記号

| 記号 | 意味 | UIアイコン | 説明 |
|-----|------|-----------|------|
| ` ` (空白) | 未着手 | □（空の四角） | `- [ ]` |
| `*` | 進行中 | ▷（再生ボタン） | `- [*]` |
| `x` または `X` | 完了 | ☑（チェック済み） | `- [x]` または `- [X]` |
| `-` | 保留 | ⏸（一時停止） | `- [-]` |

**ステータスサイクル**: UIでチェックボックスクリック時の切り替え順序
`未着手 → 進行中 → 完了 → 保留 → 未着手`

### 7.3 優先度記号

| 記号 | 優先度 | UIバッジ |
|-----|--------|---------|
| `!!!` | 高 | 赤バッジ |
| `!!` | 中 | オレンジバッジ |
| `!` | 低 | 青バッジ |

### 7.4 期限形式

`@`に続けてYYYY-MM-DD形式で記載（タスク名の前に配置）：

```markdown
- [ ] @2025-12-31 タスク名
- [ ] @12-31 タスク名        # 年省略時は今年として解釈
```

### 7.5 パース規則

```javascript
// TODO項目検出
const todoItemPattern = /^-\s+\[([xX\s\*\-])\]\s+(.+)$/;

// 期日抽出（先頭）
const deadlinePattern = /^@(\d{4}-\d{2}-\d{2}|\d{2}-\d{2})\s*/;

// 優先度抽出（先頭）
const priorityPattern = /^(!!!|!!|!)\s*/;

// 詳細説明（2スペースインデント）
const descriptionPattern = /^  (.+)$/;
```

### 7.6 例

```markdown
## [TODO]

### P99
- [ ] @2025-12-31 !!! ブラウザ等アップデート
  詳細説明をここに記載
  複数行も可能
- [*] !! 社内規定作成
- [x] 採用資料作成

### P34
- [ ] @2025-12-06 MyDrive整理
- [-] 購買申請のフロー確認
```

### 7.7 プロジェクト別グループ化

TODOは`### {プロジェクトコード}`でプロジェクト別にグループ化：

```markdown
## [TODO]

### P99
- [ ] P99のTODO1
- [ ] P99のTODO2

### P34
- [ ] P34のTODO1
```

---

## 8. メタデータ（脚注形式）

### 8.1 脚注参照

```markdown
* 09:00 [P34] クライアントA MTG[^meeting1]

[^meeting1]: {"meeting_url": "https://meet.google.com/xxx", "duration": 60}
```

### 8.2 メタデータスキーマ

```typescript
interface TaskMetadata {
  // 共通
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  notes?: string;
  
  // PLAN/RESULT用
  duration?: number;        // 予定時間（分）
  meeting_url?: string;     // 会議URL
  location?: string;        // 場所
  attendees?: string[];     // 参加者
  
  // TODO用
  due_date?: string;        // 期限（YYYY-MM-DD）
  related_plan?: string;    // 関連するPLAN項目
  related_todo?: string;    // 関連TODO ID
  recurrence?: string;      // 繰り返し設定
}
```

### 8.3 インライン形式（代替）

小規模なメタデータはインラインで記述可能：

```markdown
* 09:00 [P34] クライアントA MTG <!-- {"duration": 60} -->
```

---

## 9. ルーチンセクション形式

### 9.1 基本形式

```markdown
## ルーチン

[{曜日}]
* {時刻} [{プロジェクトコード}] {タスク名}
```

### 9.2 曜日識別子

| 識別子 | 曜日 |
|-------|------|
| `月` | 月曜日 |
| `火` | 火曜日 |
| `水` | 水曜日 |
| `木` | 木曜日 |
| `金` | 金曜日 |
| `土` | 土曜日 |
| `日` | 日曜日 |
| `随時` | 特定曜日なし |

### 9.3 例

```markdown
## ルーチン

[月]
* 08:00 [P99] タスク確認・整理、日報返信
* 09:00 [P99] 新人研修サポート
* 09:30 [P37] クライアントD デイリー

[火]
* 08:00 [P99] タスク確認・整理、日報返信
* 09:30 [P99] 経営会議

[随時]
* 14:00 [P14] システムB 開発MTG
```

---

## 10. 特殊構文

### 10.1 水平線（セクション区切り）

```markdown
---
```

または

```markdown
----
```

### 10.2 コメント（パース対象外）

```markdown
<!-- このテキストはパースされません -->
```

### 10.3 リンク

```markdown
開発チームMTG https://meet.google.com/xxx-yyyy-zzz
請求書： https://example.com/invoice
```

---

## 11. パーサー実装ガイド

### 11.1 パース順序

1. ファイル全体を読み込み
2. ヘッダー（タイトル）をパース
3. セクションに分割
4. 各セクションタイプに応じたパーサーを適用
5. メタデータ（脚注）を収集・リンク

### 11.2 出力データ構造

```typescript
interface DailyReport {
  date: string;            // YYYY-MM-DD
  author: string;          // 報告者名
  
  plan: ScheduleItem[];    // 計画
  result: ScheduleItem[];  // 実績
  todos: TodoItem[];       // TODO
  notes: string;           // メモ
  
  routines?: RoutineDefinition[];  // ルーチン定義
  customSections?: CustomSection[]; // カスタムセクション
  
  metadata: Record<string, TaskMetadata>; // 脚注メタデータ
  raw: string;             // 元のMarkdown
}

interface ScheduleItem {
  time: string;            // HH:MM（24時超も可: 例 "30:00"）
  project: string;         // プロジェクトコード（休憩の場合は空文字）
  task: string;            // タスク名（休憩の場合は空文字）
  // 注: durationはデータとして保持せず、レンダリング時に動的計算
  metadata?: TaskMetadata;
}

// レンダリング用（UI表示時に使用）
interface RenderSlot extends ScheduleItem {
  duration: number;        // レンダリング時に計算された所要時間（分）
  topPx: number;           // 表示位置（ピクセル）
  heightPx: number;        // 表示高さ（ピクセル）
}

interface TodoItem {
  id: string;              // 自動生成ID
  status: 'pending' | 'in_progress' | 'completed' | 'hold' | 'deferred';
  projectCode?: string;
  task: string;
  dueDate?: string;
  category?: string;       // カテゴリ名
  metadata?: TaskMetadata;
}
```

---

## 12. バリデーション規則

### 12.1 必須チェック

- [ ] ヘッダーに日付が含まれている
- [ ] PLAN/RESULTセクションが存在する
- [ ] 時刻形式が正しい（HH:MM）

### 12.2 警告チェック

- [ ] 未定義のプロジェクトコードが使用されている
- [ ] 時刻が時系列順になっていない
- [ ] 期限切れのTODOが存在する

---

## 更新履歴

| バージョン | 日付 | 更新内容 |
|-----------|------|---------|
| 1.0 | 2025-12-20 | mdJournalとして公開準備 |
| 0.4 | 2025-12-19 | Duration計算ロジックを更新 |
| 0.3 | 2025-12-18 | Frontmatter（統計情報）セクションを追加 |
| 0.2 | 2025-12-18 | PLAN/RESULT時間形式を明確化 |
| 0.1 | 2025-12-18 | 初版作成 |
