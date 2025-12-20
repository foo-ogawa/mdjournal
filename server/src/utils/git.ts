/**
 * Git連携ユーティリティ
 * 
 * simple-gitを使用してGit操作を行う
 */

import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import path from 'path';
import fs from 'fs';
import { getReportsPath } from './fileManager.js';

/**
 * Gitリポジトリのルートを探す
 */
function findGitRoot(startPath: string): string | null {
  let currentPath = path.resolve(startPath);
  
  while (currentPath !== '/') {
    const gitDir = path.join(currentPath, '.git');
    if (fs.existsSync(gitDir)) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  return null;
}

/**
 * Git インスタンスを取得
 */
function getGit(): SimpleGit {
  const reportsPath = getReportsPath();
  const gitRoot = findGitRoot(reportsPath);
  
  if (!gitRoot) {
    console.warn(`Git repository not found from: ${reportsPath}`);
  }
  
  const options: Partial<SimpleGitOptions> = {
    baseDir: gitRoot || reportsPath,
    binary: 'git',
    maxConcurrentProcesses: 1,
  };
  return simpleGit(options);
}

/**
 * Git ルートからの相対パスを取得
 */
export function getRelativePathFromGitRoot(absolutePath: string): string {
  const reportsPath = getReportsPath();
  const gitRoot = findGitRoot(reportsPath);
  
  if (!gitRoot) {
    return absolutePath;
  }
  
  return path.relative(gitRoot, absolutePath);
}

/**
 * Git commit
 */
export async function gitCommit(
  filePath: string,
  message?: string
): Promise<{ success: boolean; commitHash?: string; error?: string }> {
  const git = getGit();
  
  try {
    // ファイルをステージング
    await git.add(filePath);
    
    // コミット
    const commitMessage = message || `日報更新: ${new Date().toISOString().split('T')[0]}`;
    const result = await git.commit(commitMessage);
    
    return {
      success: true,
      commitHash: result.commit,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Git push
 */
export async function gitPush(): Promise<{ success: boolean; error?: string }> {
  const git = getGit();
  
  try {
    await git.push();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Git ステータス取得
 */
export async function getGitStatus(): Promise<{
  branch: string;
  uncommittedChanges: number;
  modifiedFiles: string[];
  lastCommit?: {
    hash: string;
    message: string;
    date: string;
  };
}> {
  const git = getGit();
  
  try {
    const status = await git.status();
    const log = await git.log({ maxCount: 1 });
    
    return {
      branch: status.current || 'unknown',
      uncommittedChanges: status.files.length,
      modifiedFiles: status.files.map(f => f.path),
      lastCommit: log.latest ? {
        hash: log.latest.hash,
        message: log.latest.message,
        date: log.latest.date,
      } : undefined,
    };
  } catch {
    return {
      branch: 'unknown',
      uncommittedChanges: 0,
      modifiedFiles: [],
    };
  }
}

/**
 * Gitリポジトリが初期化されているかチェック
 */
export async function isGitRepository(): Promise<boolean> {
  const git = getGit();
  
  try {
    await git.status();
    return true;
  } catch {
    return false;
  }
}

