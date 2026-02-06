/**
 * ファイル管理ユーティリティ
 * 
 * 日報ファイルとYAML設定ファイルの読み書きを担当
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import type { ReportStats, Config } from '../types/index.js';

/**
 * タイムライン設定
 */
interface TimelineConfig {
  hourHeight: number;       // 1時間あたりの高さ（ピクセル）
  maxHours: number;         // 最大表示時間
  defaultStartHour: number; // デフォルト開始時刻
  defaultEndHour: number;   // デフォルト終了時刻
  snapMinutes: number;      // ドラッグ時のスナップ単位（分）
}

/**
 * 設定パス
 */
interface ConfigPaths {
  projects: string;
  routines: string;
  reports: string;
}

let configPaths: ConfigPaths = {
  projects: '',
  routines: '',
  reports: '',
};

// タイムライン設定（ルート設定ファイルから読み込み）
let timelineConfig: TimelineConfig = {
  hourHeight: 60,
  maxHours: 36,
  defaultStartHour: 8,
  defaultEndHour: 20,
  snapMinutes: 15,
};

// ルート設定ファイルの内容を保持
let rootConfig: Record<string, unknown> = {};

/**
 * タイムライン設定をセット
 */
export function setTimelineConfig(config: Partial<TimelineConfig>): void {
  timelineConfig = { ...timelineConfig, ...config };
}

/**
 * タイムライン設定を取得
 */
export function getTimelineConfig(): TimelineConfig {
  return { ...timelineConfig };
}

/**
 * ルート設定をセット
 */
export function setRootConfig(config: Record<string, unknown>): void {
  rootConfig = { ...config };
}

/**
 * ルート設定を取得
 */
export function getRootConfig(): Record<string, unknown> {
  return { ...rootConfig };
}

/**
 * 設定パスを初期化（環境変数から読み込み）
 */
export function initConfigPaths(): void {
  if (process.env.CONFIG_PROJECTS) configPaths.projects = process.env.CONFIG_PROJECTS;
  if (process.env.CONFIG_ROUTINES) configPaths.routines = process.env.CONFIG_ROUTINES;
  if (process.env.CONFIG_REPORTS) configPaths.reports = process.env.CONFIG_REPORTS;
}

/**
 * 設定パスを設定
 */
export function setConfigPaths(paths: Partial<ConfigPaths>): void {
  configPaths = { ...configPaths, ...paths };
}

/**
 * 設定パスを取得
 */
export function getConfigPaths(): ConfigPaths {
  return { ...configPaths };
}

/**
 * 日報ディレクトリを取得
 */
export function getReportsPath(): string {
  return configPaths.reports;
}

/**
 * 日報ファイルパスを生成
 */
export function getReportFilePath(date: string): string {
  const [year, month] = date.split('-');
  return path.join(configPaths.reports, year, month, `${date}.md`);
}

/**
 * 日報ファイルを読み込み
 * @returns { content: Markdown本文, stats: frontmatterから取得した統計情報 } | null
 */
export async function readReport(date: string): Promise<{ content: string; stats: ReportStats | null } | null> {
  const filePath = getReportFilePath(date);
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { content, data } = matter(fileContent);
    
    const stats: ReportStats | null = data.planHours !== undefined ? {
      planHours: data.planHours || 0,
      resultHours: data.resultHours || 0,
      todoCount: data.todoCount || 0,
      todoCompleted: data.todoCompleted || 0,
      todoInProgress: data.todoInProgress || 0,
      projectHours: data.projectHours || {},
      updatedAt: data.updatedAt || new Date().toISOString(),
    } : null;

    return { content: content.trim(), stats };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * 日報ファイルを保存（frontmatter付き）
 */
export async function writeReport(date: string, content: string, stats: ReportStats): Promise<void> {
  const filePath = getReportFilePath(date);
  const dir = path.dirname(filePath);
  
  // ディレクトリを作成
  await fs.mkdir(dir, { recursive: true });
  
  // frontmatter付きコンテンツを生成
  const frontmatter = {
    planHours: stats.planHours,
    resultHours: stats.resultHours,
    todoCount: stats.todoCount,
    todoCompleted: stats.todoCompleted,
    todoInProgress: stats.todoInProgress,
    projectHours: stats.projectHours,
    updatedAt: stats.updatedAt,
  };

  const fileContent = matter.stringify(content.trim(), frontmatter);
  
  // アトミック書き込み（一時ファイル経由）
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, fileContent, 'utf-8');
  await fs.rename(tempPath, filePath);
}

/**
 * 日報ファイルを削除
 */
export async function deleteReport(date: string): Promise<boolean> {
  const filePath = getReportFilePath(date);
  
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * 指定年月の全日報のfrontmatter（統計情報）を取得
 */
export async function getMonthReportStats(year: number, month: number): Promise<Map<string, ReportStats>> {
  const monthStr = month.toString().padStart(2, '0');
  const dirPath = path.join(configPaths.reports, year.toString(), monthStr);
  const stats = new Map<string, ReportStats>();

  try {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const date = file.replace('.md', '');
      const filePath = path.join(dirPath, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent);
        
        if (data.planHours !== undefined) {
          stats.set(date, {
            planHours: data.planHours || 0,
            resultHours: data.resultHours || 0,
            todoCount: data.todoCount || 0,
            todoCompleted: data.todoCompleted || 0,
            todoInProgress: data.todoInProgress || 0,
            projectHours: data.projectHours || {},
            updatedAt: data.updatedAt || '',
          });
        }
      } catch {
        // ファイル読み込みエラーは無視
      }
    }
  } catch {
    // ディレクトリが存在しない場合は空のMapを返す
  }

  return stats;
}

/**
 * 設定ファイルを読み込み
 */
export async function readConfig(): Promise<Config> {
  // プロジェクト設定を読み込み
  let projects: Config['projects'] = [];
  
  try {
    const projectsContent = await fs.readFile(configPaths.projects, 'utf-8');
    const projectsData = yaml.load(projectsContent) as { projects?: Config['projects'] };
    projects = projectsData?.projects || [];
  } catch {
    // ファイルがない場合はデフォルト値
  }

  // ルーチン設定を読み込み（routines.mdを優先）
  let routines: Config['routines'] = {};
  const mdPath = getRoutinesMarkdownPath();
  
  if (await fileExists(mdPath)) {
    // routines.md が存在する場合はパース
    try {
      const mdContent = await fs.readFile(mdPath, 'utf-8');
      routines = parseRoutinesMarkdown(mdContent);
    } catch {
      // パースエラー時はYAMLにフォールバック
      routines = await readRoutinesYaml();
    }
  } else {
    // routines.md がない場合はYAMLを読み込み
    routines = await readRoutinesYaml();
  }

  // 著者名をルート設定から取得
  const author = rootConfig.author as string | undefined;

  // Slack設定をルート設定から取得
  const slackConfig = rootConfig.slack as { enabled?: boolean } | undefined;
  const slack = slackConfig ? { enabled: !!slackConfig.enabled } : undefined;

  return { author, projects, routines, timeline: getTimelineConfig(), slack };
}

/**
 * routines.yaml からルーチン設定を読み込み
 */
async function readRoutinesYaml(): Promise<Config['routines']> {
  try {
    const routinesContent = await fs.readFile(configPaths.routines, 'utf-8');
    const routinesData = yaml.load(routinesContent) as { routines?: Config['routines'] };
    return routinesData?.routines || {};
  } catch {
    return {};
  }
}

/**
 * Markdown形式のルーチン設定をパース
 */
function parseRoutinesMarkdown(content: string): Config['routines'] {
  const routines: Config['routines'] = {
    weekly: {},
    adhoc: [],
    monthly: {
      start_of_month: [],
      end_of_month: [],
    },
    quarterly: [],
    yearly: [],
  };

  const lines = content.split('\n');
  let currentSection = '';
  
  // 曜日マッピング（逆引き）
  const dayMap: Record<string, string> = {
    'Mon': 'monday',
    'Tue': 'tuesday',
    'Wed': 'wednesday',
    'Thu': 'thursday',
    'Fri': 'friday',
    'Sat': 'saturday',
    'Sun': 'sunday',
  };

  // スケジュール行のパターン
  const schedulePattern = /^\*\s+(\d{2}:\d{2})\s+\[([^\]]+)\]\s+(.+)$/;
  // TODO行のパターン（プロジェクトコード先頭対応）
  const todoPattern = /^-\s+\[([xX\s*-])\]\s+(?:\[([^\]]+)\]\s+)?(.+)$/;
  // セクションヘッダーのパターン
  const sectionPattern = /^###\s+\[(\w+)\]\s*$/;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // セクションヘッダー
    const sectionMatch = trimmed.match(sectionPattern);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }
    
    // 空行やコメントをスキップ
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // スケジュール形式（すべてのセクションで対応）
    const scheduleMatch = trimmed.match(schedulePattern);
    if (scheduleMatch) {
      const [, time, project, task] = scheduleMatch;
      const item = { time, project, task };
      
      if (currentSection === 'adhoc') {
        routines.adhoc = routines.adhoc || [];
        routines.adhoc.push(item);
      } else if (currentSection === 'month') {
        // 月次のスケジュール形式はmonthlyのスケジュールとして保存
        routines.monthly = routines.monthly || { start_of_month: [], end_of_month: [], schedule: [] };
        if (!routines.monthly.schedule) routines.monthly.schedule = [];
        routines.monthly.schedule.push(item);
      } else if (currentSection === 'quarterly') {
        // 四半期のスケジュール形式
        routines.quarterly = routines.quarterly || [];
        // スケジュール用のエントリ（months: []）を探すか作成
        let scheduleEntry = routines.quarterly.find(q => q.months.length === 0);
        if (!scheduleEntry) {
          scheduleEntry = { months: [], tasks: [], schedule: [] };
          routines.quarterly.push(scheduleEntry);
        }
        if (!scheduleEntry.schedule) scheduleEntry.schedule = [];
        scheduleEntry.schedule.push(item);
      } else if (currentSection === 'yearly') {
        // 年次のスケジュール形式
        routines.yearly = routines.yearly || [];
        // スケジュールは特殊なエントリとして保存（month: 0, day: 0）
        routines.yearly.push({
          month: 0,
          day: 0,
          project,
          task,
          time,
        });
      } else {
        const dayKey = dayMap[currentSection];
        if (dayKey) {
          routines.weekly = routines.weekly || {};
          if (!routines.weekly[dayKey as keyof typeof routines.weekly]) {
            (routines.weekly as Record<string, typeof item[]>)[dayKey] = [];
          }
          (routines.weekly as Record<string, typeof item[]>)[dayKey].push(item);
        }
      }
      continue;
    }
    
    // TODO形式（すべてのセクションで対応）
    const todoMatch = trimmed.match(todoPattern);
    if (todoMatch) {
      const [, , project, taskWithNote] = todoMatch;
      
      // 週次・adhocセクションのTODO
      if (currentSection === 'adhoc' || dayMap[currentSection]) {
        const item = { project: project || 'P99', task: taskWithNote, category: 'todo' as const };
        
        if (currentSection === 'adhoc') {
          routines.adhoc = routines.adhoc || [];
          routines.adhoc.push(item);
        } else {
          const dayKey = dayMap[currentSection];
          if (dayKey) {
            routines.weekly = routines.weekly || {};
            if (!routines.weekly[dayKey as keyof typeof routines.weekly]) {
              (routines.weekly as Record<string, typeof item[]>)[dayKey] = [];
            }
            (routines.weekly as Record<string, typeof item[]>)[dayKey].push(item);
          }
        }
        continue;
      }
      
      // 月次のTODO
      if (currentSection === 'month') {
        // タスク名から（月末）（月初）を抽出
        const isEndOfMonth = taskWithNote.includes('月末');
        const isStartOfMonth = taskWithNote.includes('月初');
        
        // タスク名をクリーンアップ
        const task = taskWithNote
          .replace(/（月末）/g, '')
          .replace(/（月初）/g, '')
          .replace(/\(月末\)/g, '')
          .replace(/\(月初\)/g, '')
          .trim();
        
        const item = { project: project || 'P99', task };
        
        routines.monthly = routines.monthly || { start_of_month: [], end_of_month: [] };
        if (isStartOfMonth) {
          routines.monthly.start_of_month = routines.monthly.start_of_month || [];
          routines.monthly.start_of_month.push(item);
        } else if (isEndOfMonth) {
          routines.monthly.end_of_month = routines.monthly.end_of_month || [];
          routines.monthly.end_of_month.push(item);
        } else {
          // どちらでもない場合は月末として扱う
          routines.monthly.end_of_month = routines.monthly.end_of_month || [];
          routines.monthly.end_of_month.push(item);
        }
        continue;
      }
      
      // 四半期のTODO
      if (currentSection === 'quarterly') {
        // 実行月を抽出（例：（6,12月）、（3,6,9,12月）、（8月））
        const monthsMatch = taskWithNote.match(/（([\d,]+)月）|\(([\d,]+)月\)/);
        let months: number[] = [];
        let task = taskWithNote;
        
        if (monthsMatch) {
          const monthsStr = monthsMatch[1] || monthsMatch[2];
          months = monthsStr.split(',').map(m => parseInt(m.trim(), 10)).filter(m => !isNaN(m));
          task = taskWithNote
            .replace(/（[\d,]+月）/g, '')
            .replace(/\([\d,]+月\)/g, '')
            .trim();
        }
        
        if (months.length > 0) {
          routines.quarterly = routines.quarterly || [];
          // 同じ月の組み合わせを持つエントリを探す
          const existingEntry = routines.quarterly.find(
            q => q.months.length === months.length && q.months.every((m, i) => m === months[i])
          );
          
          if (existingEntry) {
            existingEntry.tasks.push({ project: project || 'P99', task });
          } else {
            routines.quarterly.push({
              months,
              tasks: [{ project: project || 'P99', task }],
            });
          }
        }
        continue;
      }
      
      // 年次のTODO（日付指定なし）
      if (currentSection === 'yearly') {
        routines.yearly = routines.yearly || [];
        routines.yearly.push({
          month: 0,
          day: 0,
          project: project || 'P99',
          task: taskWithNote,
        });
      }
    }
  }

  return routines;
}

/**
 * 設定ファイルを保存
 */
export async function writeConfig(config: Partial<Config>): Promise<void> {
  if (config.projects) {
    const dir = path.dirname(configPaths.projects);
    await fs.mkdir(dir, { recursive: true });
    const projectsContent = yaml.dump({ projects: config.projects });
    await fs.writeFile(configPaths.projects, projectsContent, 'utf-8');
  }

  if (config.routines) {
    const dir = path.dirname(configPaths.routines);
    await fs.mkdir(dir, { recursive: true });
    const routinesContent = yaml.dump({ routines: config.routines });
    await fs.writeFile(configPaths.routines, routinesContent, 'utf-8');
  }
}

/**
 * ファイルが存在するかチェック
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * routines.md のパスを取得
 */
export function getRoutinesMarkdownPath(): string {
  return path.join(configPaths.reports, 'routines.md');
}

/**
 * ルーチン設定をMarkdown形式で読み込み
 * @returns { content: Markdown内容, source: 'markdown' | 'yaml' }
 */
export async function readRoutinesMarkdown(): Promise<{ content: string; source: 'markdown' | 'yaml' }> {
  const mdPath = getRoutinesMarkdownPath();
  
  // routines.md が存在すればそちらを優先
  if (await fileExists(mdPath)) {
    const content = await fs.readFile(mdPath, 'utf-8');
    return { content: content.trim(), source: 'markdown' };
  }
  
  // 存在しない場合はYAMLから変換
  const content = await convertRoutinesYamlToMarkdown();
  return { content, source: 'yaml' };
}

/**
 * ルーチン設定をMarkdown形式で保存
 */
export async function writeRoutinesMarkdown(content: string): Promise<void> {
  const mdPath = getRoutinesMarkdownPath();
  const dir = path.dirname(mdPath);
  
  // ディレクトリを作成
  await fs.mkdir(dir, { recursive: true });
  
  // アトミック書き込み
  const tempPath = `${mdPath}.tmp`;
  await fs.writeFile(tempPath, content.trim() + '\n', 'utf-8');
  await fs.rename(tempPath, mdPath);
}

/**
 * routines.yaml をMarkdown形式に変換
 */
async function convertRoutinesYamlToMarkdown(): Promise<string> {
  let routines: Config['routines'] = {};
  
  try {
    const routinesContent = await fs.readFile(configPaths.routines, 'utf-8');
    const routinesData = yaml.load(routinesContent) as { routines?: Config['routines'] };
    routines = routinesData?.routines || {};
  } catch {
    return '## [ROUTINES]\n';
  }
  
  const lines: string[] = ['## [ROUTINES]', ''];
  
  // 曜日マッピング
  const dayMap: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };
  
  // 週次ルーチン
  if (routines.weekly) {
    for (const [day, items] of Object.entries(routines.weekly)) {
      if (!items || items.length === 0) continue;
      
      const dayLabel = dayMap[day] || day;
      lines.push(`### [${dayLabel}]`);
      
      for (const item of items) {
        lines.push(`* ${item.time} [${item.project}] ${item.task}`);
      }
      lines.push('');
    }
  }
  
  // 随時ルーチン
  if (routines.adhoc && routines.adhoc.length > 0) {
    lines.push('### [adhoc]');
    for (const item of routines.adhoc) {
      lines.push(`* ${item.time} [${item.project}] ${item.task}`);
    }
    lines.push('');
  }
  
  // 月次ルーチン
  const monthlyItems: string[] = [];
  if (routines.monthly) {
    if (routines.monthly.end_of_month) {
      for (const item of routines.monthly.end_of_month) {
        monthlyItems.push(`- [ ] [${item.project}] ${item.task}（月末）`);
      }
    }
    if (routines.monthly.start_of_month) {
      for (const item of routines.monthly.start_of_month) {
        monthlyItems.push(`- [ ] [${item.project}] ${item.task}（月初）`);
      }
    }
  }
  
  if (monthlyItems.length > 0) {
    lines.push('### [month]');
    lines.push(...monthlyItems);
    lines.push('');
  }
  
  // 四半期ルーチン
  if (routines.quarterly && routines.quarterly.length > 0) {
    lines.push('### [quarterly]');
    for (const routine of routines.quarterly) {
      const monthsLabel = routine.months.join(',') + '月';
      for (const task of routine.tasks) {
        lines.push(`- [ ] [${task.project}] ${task.task}（${monthsLabel}）`);
      }
    }
    lines.push('');
  }
  
  // 年次ルーチン
  if (routines.yearly && routines.yearly.length > 0) {
    lines.push('### [yearly]');
    for (const routine of routines.yearly) {
      lines.push(`- [ ] [${routine.project}] ${routine.task}`);
    }
    lines.push('');
  }
  
  return lines.join('\n').trim();
}

/**
 * 日報が存在する年月のリストを取得
 */
export async function getAvailableYearMonths(): Promise<{ year: number; month: number }[]> {
  const result: { year: number; month: number }[] = [];
  
  try {
    // 年ディレクトリを一覧
    const years = await fs.readdir(configPaths.reports);
    
    for (const yearStr of years) {
      const year = parseInt(yearStr, 10);
      if (isNaN(year)) continue;
      
      const yearPath = path.join(configPaths.reports, yearStr);
      const yearStat = await fs.stat(yearPath);
      if (!yearStat.isDirectory()) continue;
      
      // 月ディレクトリを一覧
      const months = await fs.readdir(yearPath);
      
      for (const monthStr of months) {
        const month = parseInt(monthStr, 10);
        if (isNaN(month) || month < 1 || month > 12) continue;
        
        const monthPath = path.join(yearPath, monthStr);
        const monthStat = await fs.stat(monthPath);
        if (!monthStat.isDirectory()) continue;
        
        // .mdファイルが存在するか確認
        const files = await fs.readdir(monthPath);
        const hasReports = files.some(f => f.endsWith('.md'));
        
        if (hasReports) {
          result.push({ year, month });
        }
      }
    }
  } catch {
    // ディレクトリが存在しない場合は空配列を返す
  }
  
  // 年月でソート（降順：新しい順）
  result.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
  
  return result;
}
