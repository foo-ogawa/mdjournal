/**
 * カレンダーAPI ルーター
 * 
 * GET /api/calendar - カレンダー用集計データ取得
 */

import { Router, Request, Response } from 'express';
import { getMonthReportStats, getAvailableYearMonths } from '../utils/fileManager.js';
import type { CalendarData, DayStats, CalendarSummary, ApiError } from '../types/index.js';

const router = Router();

/**
 * 指定年月の日数を取得
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * GET /api/calendar - カレンダー用集計データ取得
 */
router.get('/', async (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string, 10);
  const month = parseInt(req.query.month as string, 10);

  // バリデーション
  if (isNaN(year) || year < 2000 || year > 2100) {
    const error: ApiError = {
      code: 'INVALID_YEAR',
      message: 'yearは2000〜2100の範囲で指定してください',
    };
    return res.status(400).json(error);
  }

  if (isNaN(month) || month < 1 || month > 12) {
    const error: ApiError = {
      code: 'INVALID_MONTH',
      message: 'monthは1〜12の範囲で指定してください',
    };
    return res.status(400).json(error);
  }

  try {
    // frontmatterから統計情報を取得
    const reportStats = await getMonthReportStats(year, month);
    
    // 日別データを生成
    const daysInMonth = getDaysInMonth(year, month);
    const days: DayStats[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const stats = reportStats.get(dateStr);
      
      if (stats) {
        days.push({
          date: dateStr,
          hasReport: true,
          planHours: stats.planHours,
          resultHours: stats.resultHours,
          todoCount: stats.todoCount,
          todoCompleted: stats.todoCompleted,
        });
      } else {
        days.push({
          date: dateStr,
          hasReport: false,
        });
      }
    }

    // 月間サマリーを計算
    const summary: CalendarSummary = {
      totalPlanHours: 0,
      totalResultHours: 0,
      workDays: 0,
      todoCompleted: 0,
      projectHours: {},
    };

    for (const stats of reportStats.values()) {
      summary.totalPlanHours += stats.planHours;
      summary.totalResultHours += stats.resultHours;
      summary.workDays += 1;
      summary.todoCompleted += stats.todoCompleted;
      
      // プロジェクト別時間を集計
      for (const [project, hours] of Object.entries(stats.projectHours)) {
        summary.projectHours![project] = (summary.projectHours![project] || 0) + hours;
      }
    }

    const response: CalendarData = {
      year,
      month,
      days,
      summary,
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting calendar data:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'カレンダーデータの取得中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

/**
 * GET /api/calendar/months - 日報が存在する年月リストを取得
 */
router.get('/months', async (_req: Request, res: Response) => {
  try {
    const yearMonths = await getAvailableYearMonths();
    res.json({ yearMonths });
  } catch (error) {
    console.error('Error getting available year months:', error);
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: '年月リストの取得中にエラーが発生しました',
    };
    res.status(500).json(apiError);
  }
});

export default router;

