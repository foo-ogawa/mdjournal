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
 * すべての未コミットファイルをステージングしてコミットする
 */
export async function gitCommit(
  _filePath: string,
  message?: string
): Promise<{ success: boolean; commitHash?: string; error?: string }> {
  const git = getGit();
  
  try {
    // すべての変更をステージング（保存したファイルも他の未コミットファイルも）
    await git.add('.');
    
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

/**
 * 未pushのコミット一覧を取得
 */
export async function getUnpushedCommits(): Promise<{
  count: number;
  commits: {
    hash: string;
    message: string;
    date: string;
    files: string[];
  }[];
}> {
  const git = getGit();
  
  try {
    // リモートトラッキングブランチの情報を取得
    const status = await git.status();
    const currentBranch = status.current || 'main';
    
    // リモートが設定されているか確認
    const remotes = await git.getRemotes(true);
    if (remotes.length === 0) {
      return { count: 0, commits: [] };
    }
    
    // origin/main または origin/currentBranch との差分を取得
    const remoteBranch = `origin/${currentBranch}`;
    
    try {
      // リモートブランチが存在するか確認
      await git.raw(['rev-parse', '--verify', remoteBranch]);
    } catch {
      // リモートブランチが存在しない場合は、すべてのローカルコミットを未pushとみなす
      return { count: 0, commits: [] };
    }
    
    // 未pushのコミット一覧を取得
    const log = await git.log({ from: remoteBranch, to: 'HEAD' });
    
    const commits = await Promise.all(
      log.all.map(async (commit) => {
        // 各コミットで変更されたファイルを取得
        let files: string[] = [];
        try {
          const diffResult = await git.raw(['diff-tree', '--no-commit-id', '--name-only', '-r', commit.hash]);
          files = diffResult.trim().split('\n').filter(f => f);
        } catch {
          // ファイル取得に失敗しても続行
        }
        
        return {
          hash: commit.hash.substring(0, 7),
          message: commit.message,
          date: commit.date,
          files,
        };
      })
    );
    
    return {
      count: commits.length,
      commits,
    };
  } catch (error) {
    console.error('Error getting unpushed commits:', error);
    return { count: 0, commits: [] };
  }
}

/**
 * 拡張Git状態を取得（未コミット + 未push情報付き）
 */
export async function getExtendedGitStatus(): Promise<{
  branch: string;
  uncommitted: {
    count: number;
    files: { path: string; status: string }[];
  };
  unpushed: {
    count: number;
    commits: {
      hash: string;
      message: string;
      date: string;
      files: string[];
    }[];
  };
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
    const unpushed = await getUnpushedCommits();
    
    return {
      branch: status.current || 'unknown',
      uncommitted: {
        count: status.files.length,
        files: status.files.map(f => ({
          path: f.path,
          status: f.working_dir || f.index || 'M',
        })),
      },
      unpushed,
      lastCommit: log.latest ? {
        hash: log.latest.hash.substring(0, 7),
        message: log.latest.message,
        date: log.latest.date,
      } : undefined,
    };
  } catch (error) {
    console.error('Error getting extended git status:', error);
    return {
      branch: 'unknown',
      uncommitted: { count: 0, files: [] },
      unpushed: { count: 0, commits: [] },
    };
  }
}

