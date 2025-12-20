/**
 * Git連携API ルーター
 * 
 * GET /api/git/status - Git状態取得
 */

import { Router, Request, Response } from 'express';
import { getExtendedGitStatus } from '../utils/git.js';
import type { ApiError } from '../types/index.js';

const router = Router();

/**
 * GET /api/git/status - Git状態取得（拡張）
 * 未コミットファイルと未pushコミットを含む
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const gitStatus = await getExtendedGitStatus();
    res.json(gitStatus);
  } catch (error) {
    console.error('Error getting git status:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'Git状態の取得中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

export default router;

