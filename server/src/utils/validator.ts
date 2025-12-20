/**
 * 日報Markdownフォーマット バリデーター
 *
 * 既存の日報データを仕様に照らし合わせて検証し、
 * 差分を検出・報告する
 */

export interface ValidationIssue {
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  file: string;
  date: string;
  isValid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export interface ValidatorOptions {
  /** 厳格モード: warningもエラーとして扱う */
  strict?: boolean;
  /** 検証をスキップするルール */
  skipRules?: string[];
}

/**
 * 日報Markdownをバリデート
 */
export function validateReport(
  content: string,
  filePath: string,
  options: ValidatorOptions = {}
): ValidationResult {
  const lines = content.split('\n');
  const issues: ValidationIssue[] = [];
  const dateMatch = filePath.match(/(\d{4}-\d{2}-\d{2})\.md$/);
  const date = dateMatch ? dateMatch[1] : 'unknown';
  
  const skipRules = new Set(options.skipRules || []);
  
  let currentSection = '';
  let currentTodoProject = '';
  let hasHeader = false;
  let hasPlanSection = false;
  let hasResultSection = false;
  let hasTodoSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // === ヘッダー検証 ===
    if (i === 0) {
      if (!skipRules.has('header-format')) {
        if (!line.match(/^#\s+\[日報\]\s+.+\s+\d{4}-\d{2}-\d{2}/)) {
          issues.push({
            line: lineNum,
            severity: 'error',
            code: 'header-format',
            message: 'ヘッダーが正しい形式ではありません',
            suggestion: '形式: # [日報] {名前} {YYYY-MM-DD}',
          });
        } else {
          hasHeader = true;
        }
      }
    }

    // === セクション区切り線 `==========` の検出 ===
    if (!skipRules.has('separator-line') && line.match(/^=+$/)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        code: 'separator-line',
        message: '旧形式のセクション区切り線が検出されました',
        suggestion: 'この行を削除してください',
      });
    }

    // === セクション検出 ===
    if (line.match(/^##\s+\[PLAN\]/i)) {
      currentSection = 'plan';
      hasPlanSection = true;
      continue;
    }
    if (line.match(/^##\s+\[RESULT\]/i)) {
      currentSection = 'result';
      hasResultSection = true;
      continue;
    }
    if (line.match(/^##\s+\[TODO\]/i)) {
      currentSection = 'todo';
      hasTodoSection = true;
      currentTodoProject = '';
      continue;
    }
    if (line.match(/^##\s+\[NOTE\]/i)) {
      currentSection = 'note';
      continue;
    }
    if (line.match(/^##\s+/)) {
      currentSection = 'other';
      continue;
    }

    // === PLAN/RESULT セクション内の検証 ===
    if (currentSection === 'plan' || currentSection === 'result') {
      // 場所サブセクション（旧形式）の検出
      if (!skipRules.has('location-subsection') && line.match(/^###\s+\[(?:home|office|remote)\]/i)) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          code: 'location-subsection',
          message: '旧形式の場所サブセクションが検出されました',
          suggestion: 'この行を削除してください。場所情報は不要です',
        });
        continue;
      }

      // タスク行の検証
      if (line.match(/^\*\s+\d{2}:\d{2}/)) {
        // 時刻 [プロジェクト] タスク名 形式のチェック
        const taskMatch = line.match(/^\*\s+(\d{2}:\d{2})\s+\[([^\]]+)\]\s+(.+)$/);
        const endTimeMatch = line.match(/^\*\s+(\d{2}:\d{2})\s*$/);
        
        if (!taskMatch && !endTimeMatch) {
          if (!skipRules.has('schedule-item-format')) {
            issues.push({
              line: lineNum,
              severity: 'warning',
              code: 'schedule-item-format',
              message: 'スケジュール項目の形式が正しくありません',
              suggestion: '形式: * HH:MM [プロジェクト] タスク名 または * HH:MM (終了時刻)',
            });
          }
        } else if (taskMatch) {
          // 時刻形式のチェック
          const time = taskMatch[1];
          if (!skipRules.has('time-format')) {
            const [h, m] = time.split(':').map(Number);
            if (h < 0 || h > 36 || m < 0 || m > 59) {
              issues.push({
                line: lineNum,
                severity: 'error',
                code: 'time-format',
                message: `不正な時刻形式です: ${time}`,
                suggestion: '時刻は00:00～36:00の範囲で指定してください',
              });
            }
          }
        }
      }
    }

    // === TODO セクション内の検証 ===
    if (currentSection === 'todo') {
      // プロジェクトグループヘッダーの検出
      if (line.match(/^###\s+/)) {
        const projectMatch = line.match(/^###\s+(\S+)/);
        if (projectMatch) {
          currentTodoProject = projectMatch[1];
        }
        continue;
      }

      // TODO項目の検証
      if (line.match(/^[-*]\s+\[/)) {
        // リストマーカーの統一チェック
        if (!skipRules.has('todo-list-marker') && line.startsWith('*')) {
          issues.push({
            line: lineNum,
            severity: 'info',
            code: 'todo-list-marker',
            message: 'TODOのリストマーカーが "*" です',
            suggestion: '"-" に統一することを推奨します',
          });
        }

        // TODO形式の解析
        const todoMatch = line.match(/^[-*]\s+\[([xX\s\*\-])\]\s*(.*)$/);
        if (todoMatch) {
          const todoContent = todoMatch[2];

          // 旧形式の検出: - [ステータス] [プロジェクト] タスク名（期限）
          const oldFormatMatch = todoContent.match(/^\[([^\]]+)\]\s+(.*)$/);
          if (oldFormatMatch && !skipRules.has('todo-inline-project')) {
            issues.push({
              line: lineNum,
              severity: 'warning',
              code: 'todo-inline-project',
              message: 'プロジェクトコードがTODO行内にあります（旧形式）',
              suggestion: `"### ${oldFormatMatch[1]}" のようにプロジェクトヘッダーでグループ化してください`,
            });
          }

          // 括弧形式の期限検出: （期限）や (期限)
          if (!skipRules.has('todo-deadline-format')) {
            const deadlineParenMatch = todoContent.match(/[（(]([^）)]+)[）)]/);
            if (deadlineParenMatch) {
              const deadlineText = deadlineParenMatch[1];
              // 日付形式かどうかをチェック
              if (deadlineText.match(/\d/) || deadlineText.match(/月|末|頭|中旬/)) {
                issues.push({
                  line: lineNum,
                  severity: 'warning',
                  code: 'todo-deadline-format',
                  message: `期限が括弧形式です: ${deadlineParenMatch[0]}`,
                  suggestion: '@YYYY-MM-DD 形式に変換してください',
                });
              }
            }
          }
        }
      }

      // ネストされたTODO（旧形式）の検出
      if (!skipRules.has('nested-todo') && line.match(/^\s{2,}[-*]\s+\[/)) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          code: 'nested-todo',
          message: 'ネストされたTODO項目が検出されました（旧形式）',
          suggestion: 'インデントを削除してフラットなリストにしてください',
        });
      }

      // プロジェクト名だけの行（ネストTODOの親）の検出
      if (!skipRules.has('project-only-line')) {
        const projectOnlyMatch = line.match(/^-\s+\[([^\]]+)\]\s+(\S+)\s*$/);
        if (projectOnlyMatch && !projectOnlyMatch[1].match(/[xX\s\*\-]/)) {
          // これはステータスマークではなくプロジェクトコードの可能性が高い
          issues.push({
            line: lineNum,
            severity: 'info',
            code: 'project-only-line',
            message: 'プロジェクト名のみの行の可能性があります',
            suggestion: 'この形式が意図的な場合は無視してください',
          });
        }
      }
    }
  }

  // === 必須セクションの存在チェック ===
  if (!skipRules.has('required-sections')) {
    if (!hasHeader) {
      issues.push({
        line: 1,
        severity: 'error',
        code: 'required-sections',
        message: 'ヘッダーがありません',
        suggestion: '# [日報] {名前} {YYYY-MM-DD} 形式のヘッダーを追加してください',
      });
    }
    if (!hasPlanSection) {
      issues.push({
        line: 1,
        severity: 'warning',
        code: 'required-sections',
        message: 'PLANセクションがありません',
        suggestion: '## [PLAN] セクションを追加してください',
      });
    }
    if (!hasResultSection) {
      issues.push({
        line: 1,
        severity: 'warning',
        code: 'required-sections',
        message: 'RESULTセクションがありません',
        suggestion: '## [RESULT] セクションを追加してください',
      });
    }
  }

  // サマリー計算
  const summary = {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    infos: issues.filter((i) => i.severity === 'info').length,
  };

  // 有効性判定
  const isValid = options.strict
    ? summary.errors === 0 && summary.warnings === 0
    : summary.errors === 0;

  return {
    file: filePath,
    date,
    isValid,
    issues,
    summary,
  };
}

/**
 * バリデーション結果をフォーマットして出力用文字列を生成
 */
export function formatValidationResult(
  result: ValidationResult,
  options: { color?: boolean; verbose?: boolean } = {}
): string {
  const { color = true, verbose = false } = options;
  const lines: string[] = [];

  // ANSI カラーコード
  const colors = {
    reset: color ? '\x1b[0m' : '',
    red: color ? '\x1b[31m' : '',
    yellow: color ? '\x1b[33m' : '',
    blue: color ? '\x1b[34m' : '',
    green: color ? '\x1b[32m' : '',
    dim: color ? '\x1b[2m' : '',
  };

  const severityColors = {
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue,
  };

  const severityIcons = {
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  // ファイルヘッダー
  const statusIcon = result.isValid ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  lines.push(`${statusIcon} ${result.file}`);

  // 問題がある場合のみ詳細を表示
  if (result.issues.length > 0) {
    for (const issue of result.issues) {
      if (!verbose && issue.severity === 'info') continue;
      
      const icon = severityIcons[issue.severity];
      const colorCode = severityColors[issue.severity];
      const locationStr = `${colors.dim}L${issue.line}${colors.reset}`;
      
      lines.push(`  ${colorCode}${icon}${colors.reset} ${locationStr} [${issue.code}] ${issue.message}`);
      
      if (verbose && issue.suggestion) {
        lines.push(`    ${colors.dim}→ ${issue.suggestion}${colors.reset}`);
      }
    }

    // サマリー
    const parts: string[] = [];
    if (result.summary.errors > 0) {
      parts.push(`${colors.red}${result.summary.errors} error(s)${colors.reset}`);
    }
    if (result.summary.warnings > 0) {
      parts.push(`${colors.yellow}${result.summary.warnings} warning(s)${colors.reset}`);
    }
    if (verbose && result.summary.infos > 0) {
      parts.push(`${colors.blue}${result.summary.infos} info(s)${colors.reset}`);
    }
    if (parts.length > 0) {
      lines.push(`  ${colors.dim}──${colors.reset} ${parts.join(', ')}`);
    }
  }

  return lines.join('\n');
}

/**
 * 複数のバリデーション結果をサマリー出力
 */
export function formatValidationSummary(
  results: ValidationResult[],
  options: { color?: boolean } = {}
): string {
  const { color = true } = options;
  const colors = {
    reset: color ? '\x1b[0m' : '',
    red: color ? '\x1b[31m' : '',
    yellow: color ? '\x1b[33m' : '',
    green: color ? '\x1b[32m' : '',
  };

  const totalFiles = results.length;
  const validFiles = results.filter((r) => r.isValid).length;
  const invalidFiles = totalFiles - validFiles;
  const totalErrors = results.reduce((sum, r) => sum + r.summary.errors, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.summary.warnings, 0);

  const lines: string[] = [];
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('検証サマリー');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push(`ファイル数: ${totalFiles}`);
  lines.push(`  ${colors.green}✓ 有効: ${validFiles}${colors.reset}`);
  if (invalidFiles > 0) {
    lines.push(`  ${colors.red}✗ 無効: ${invalidFiles}${colors.reset}`);
  }
  lines.push(`エラー: ${colors.red}${totalErrors}${colors.reset}`);
  lines.push(`警告: ${colors.yellow}${totalWarnings}${colors.reset}`);
  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * バリデーションルール一覧
 */
export const VALIDATION_RULES = {
  'header-format': '日報ヘッダーの形式チェック',
  'separator-line': 'セクション区切り線（=====）の検出',
  'location-subsection': '場所サブセクション（### [home]）の検出',
  'schedule-item-format': 'PLAN/RESULT項目の形式チェック',
  'time-format': '時刻形式のチェック',
  'todo-list-marker': 'TODOリストマーカーの統一チェック',
  'todo-inline-project': 'TODO行内のプロジェクトコード検出',
  'todo-deadline-format': '期限の括弧形式検出',
  'nested-todo': 'ネストされたTODO検出',
  'project-only-line': 'プロジェクト名のみの行検出',
  'required-sections': '必須セクションの存在チェック',
} as const;

export type ValidationRuleCode = keyof typeof VALIDATION_RULES;

