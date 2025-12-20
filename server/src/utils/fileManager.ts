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
  projects: './sample/config/projects.yaml',
  routines: './sample/config/routines.yaml',
  reports: './sample/reports',
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

  // ルーチン設定を読み込み
  let routines: Config['routines'] = {};
  
  try {
    const routinesContent = await fs.readFile(configPaths.routines, 'utf-8');
    const routinesData = yaml.load(routinesContent) as { routines?: Config['routines'] };
    routines = routinesData?.routines || {};
  } catch {
    // ファイルがない場合はデフォルト値
  }

  // Slack設定をルート設定から取得
  const slackConfig = rootConfig.slack as { enabled?: boolean } | undefined;
  const slack = slackConfig ? { enabled: !!slackConfig.enabled } : undefined;

  return { projects, routines, timeline: getTimelineConfig(), slack };
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
