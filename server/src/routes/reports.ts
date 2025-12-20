/**
 * 日報API ルーター
 * 
 * GET  /api/reports/:date  - 日報取得
 * PUT  /api/reports/:date  - 日報保存
 * DELETE /api/reports/:date - 日報削除
 */

import { Router, Request, Response } from 'express';
import { readReport, writeReport, deleteReport, getReportFilePath } from '../utils/fileManager.js';
import { parseMarkdown, calculateStats } from '../utils/markdown.js';
import { gitCommit, gitPush, getRelativePathFromGitRoot } from '../utils/git.js';
import { postToSlack } from '../utils/slack.js';
import type { ReportResponse, ReportSaveRequest, ReportSaveResponse, ApiError } from '../types/index.js';

const router = Router();

/**
 * 日付形式のバリデーション
 */
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * GET /api/reports/:date - 日報取得
 */
router.get('/:date', async (req: Request, res: Response) => {
  const { date } = req.params;
  
  if (!isValidDate(date)) {
    const error: ApiError = {
      code: 'INVALID_DATE',
      message: '日付形式が不正です（YYYY-MM-DD形式で指定してください）',
    };
    return res.status(400).json(error);
  }

  try {
    const result = await readReport(date);
    
    if (!result) {
      const error: ApiError = {
        code: 'NOT_FOUND',
        message: '指定された日報が見つかりません',
      };
      return res.status(404).json(error);
    }

    // frontmatterがない場合はパースして統計情報を計算
    let stats = result.stats;
    if (!stats) {
      const report = parseMarkdown(date, result.content);
      stats = calculateStats(report);
    }

    const response: ReportResponse = {
      date,
      content: result.content,
      stats,
    };

    res.json(response);
  } catch (error) {
    console.error('Error reading report:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: '日報の読み込み中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

/**
 * PUT /api/reports/:date - 日報保存
 */
router.put('/:date', async (req: Request, res: Response) => {
  const { date } = req.params;
  const body = req.body as ReportSaveRequest;
  
  if (!isValidDate(date)) {
    const error: ApiError = {
      code: 'INVALID_DATE',
      message: '日付形式が不正です（YYYY-MM-DD形式で指定してください）',
    };
    return res.status(400).json(error);
  }

  if (!body.content) {
    const error: ApiError = {
      code: 'MISSING_CONTENT',
      message: 'contentフィールドは必須です',
    };
    return res.status(400).json(error);
  }

  try {
    // Markdownをパースして統計情報を計算
    const report = parseMarkdown(date, body.content);
    const stats = calculateStats(report);

    // ファイルに保存
    await writeReport(date, body.content, stats);

    const response: ReportSaveResponse = {
      date,
      saved: true,
      stats,
    };

    // Git操作
    if (body.git?.commit) {
      const filePath = getReportFilePath(date);
      const relativePath = getRelativePathFromGitRoot(filePath);
      const message = body.git.message || `日報更新: ${date}`;
      
      console.log(`Git commit: ${relativePath}`);
      const commitResult = await gitCommit(relativePath, message);
      console.log(`Git commit result:`, commitResult);
      
      response.git = {
        committed: commitResult.success,
        commitHash: commitResult.commitHash,
        error: commitResult.error,
      };

      // Push
      if (body.git.push && commitResult.success) {
        const pushResult = await gitPush();
        response.git.pushed = pushResult.success;
        if (pushResult.error) {
          response.git.error = pushResult.error;
        }
      }
    }

    // Slack投稿
    if (body.slack?.post) {
      console.log(`Slack post: ${date}`);
      const slackResult = await postToSlack(date, body.content);
      response.slack = {
        posted: slackResult.success,
        error: slackResult.error,
      };
      if (slackResult.success) {
        console.log(`Slack post success`);
      } else {
        console.log(`Slack post failed: ${slackResult.error}`);
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error saving report:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: '日報の保存中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

/**
 * DELETE /api/reports/:date - 日報削除
 */
router.delete('/:date', async (req: Request, res: Response) => {
  const { date } = req.params;
  
  if (!isValidDate(date)) {
    const error: ApiError = {
      code: 'INVALID_DATE',
      message: '日付形式が不正です（YYYY-MM-DD形式で指定してください）',
    };
    return res.status(400).json(error);
  }

  try {
    const deleted = await deleteReport(date);
    
    if (!deleted) {
      const error: ApiError = {
        code: 'NOT_FOUND',
        message: '指定された日報が見つかりません',
      };
      return res.status(404).json(error);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: '日報の削除中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

export default router;

