/**
 * 設定API ルーター
 * 
 * GET /api/config - 設定取得
 * PUT /api/config - 設定更新
 * GET /api/config/routines/markdown - ルーチンMarkdown取得
 * PUT /api/config/routines/markdown - ルーチンMarkdown保存
 */

import { Router, Request, Response } from 'express';
import { readConfig, writeConfig, readRoutinesMarkdown, writeRoutinesMarkdown } from '../utils/fileManager.js';
import type { Config, ApiError } from '../types/index.js';

const router = Router();

/**
 * GET /api/config - 設定取得
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const config = await readConfig();
    res.json(config);
  } catch (error) {
    console.error('Error reading config:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: '設定の読み込み中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

/**
 * PUT /api/config - 設定更新
 */
router.put('/', async (req: Request, res: Response) => {
  const config = req.body as Partial<Config>;

  // バリデーション
  if (config.projects) {
    for (const project of config.projects) {
      if (!project.code || !project.name || !project.color || !project.category) {
        const error: ApiError = {
          code: 'INVALID_PROJECT',
          message: 'プロジェクトにはcode, name, color, categoryが必須です',
        };
        return res.status(400).json(error);
      }
      
      // カラーフォーマットチェック
      if (!/^#[0-9A-Fa-f]{6}$/.test(project.color)) {
        const error: ApiError = {
          code: 'INVALID_COLOR',
          message: 'colorは#RRGGBB形式で指定してください',
        };
        return res.status(400).json(error);
      }
      
      // カテゴリチェック
      if (!['internal', 'client', 'personal'].includes(project.category)) {
        const error: ApiError = {
          code: 'INVALID_CATEGORY',
          message: 'categoryはinternal, client, personalのいずれかを指定してください',
        };
        return res.status(400).json(error);
      }
    }
  }

  try {
    await writeConfig(config);
    const updatedConfig = await readConfig();
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating config:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: '設定の更新中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

/**
 * GET /api/config/routines/markdown - ルーチン設定をMarkdown形式で取得
 */
router.get('/routines/markdown', async (_req: Request, res: Response) => {
  try {
    const result = await readRoutinesMarkdown();
    res.json(result);
  } catch (error) {
    console.error('Error reading routines markdown:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'ルーチン設定の読み込み中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

/**
 * PUT /api/config/routines/markdown - ルーチン設定をMarkdown形式で保存
 */
router.put('/routines/markdown', async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };

  if (!content || typeof content !== 'string') {
    const error: ApiError = {
      code: 'INVALID_REQUEST',
      message: 'contentは必須です',
    };
    return res.status(400).json(error);
  }

  try {
    await writeRoutinesMarkdown(content);
    const result = await readRoutinesMarkdown();
    res.json(result);
  } catch (error) {
    console.error('Error saving routines markdown:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'ルーチン設定の保存中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

export default router;

