/**
 * Calendar Service Implementation
 * 
 * Implements CalendarApi interface from the contract package.
 * Contains HTTP-agnostic business logic for calendar operations.
 */

import type { CalendarServiceApi } from '@mdjournal/contract/services/CalendarServiceApi.js';
import type {
  CalendarData,
  YearMonthsResponse,
  DayStats,
  CalendarSummary,
  Calendar_getCalendarDataInput,
  Calendar_getAvailableYearMonthsInput,
} from '@mdjournal/contract/schemas/types.js';

import { getMonthReportStats, getAvailableYearMonths as getYearMonths } from '../../utils/fileManager.js';
import { ValidationError } from './errors.js';

/**
 * 指定年月の日数を取得
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export class CalendarService implements CalendarServiceApi {
  /**
   * カレンダー用集計データ取得
   */
  async getCalendarData(input: Calendar_getCalendarDataInput): Promise<CalendarData> {
    // 文字列で渡された場合も数値に変換（HTTPレイヤーからの入力対応）
    const year = typeof input.year === 'string' ? parseInt(input.year, 10) : input.year;
    const month = typeof input.month === 'string' ? parseInt(input.month, 10) : input.month;

    // バリデーション
    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new ValidationError('yearは2000〜2100の範囲で指定してください');
    }

    if (isNaN(month) || month < 1 || month > 12) {
      throw new ValidationError('monthは1〜12の範囲で指定してください');
    }

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
      summary.totalPlanHours = (summary.totalPlanHours || 0) + stats.planHours;
      summary.totalResultHours = (summary.totalResultHours || 0) + stats.resultHours;
      summary.workDays = (summary.workDays || 0) + 1;
      summary.todoCompleted = (summary.todoCompleted || 0) + stats.todoCompleted;

      // プロジェクト別時間を集計
      for (const [project, hours] of Object.entries(stats.projectHours)) {
        summary.projectHours![project] = (summary.projectHours![project] || 0) + hours;
      }
    }

    return {
      year,
      month,
      days,
      summary,
    };
  }

  /**
   * 日報が存在する年月リスト取得
   */
  async getAvailableYearMonths(_input: Calendar_getAvailableYearMonthsInput): Promise<YearMonthsResponse> {
    const yearMonths = await getYearMonths();
    return { yearMonths };
  }
}

