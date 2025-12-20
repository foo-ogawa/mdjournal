/**
 * カレンダーデータ管理フック
 */

import { useState, useCallback, useEffect } from 'react';
import { calendarApi } from '../api/client';
import type { CalendarData, DayStats, CalendarSummary } from '../types';
import dayjs from 'dayjs';

interface YearMonth {
  year: number;
  month: number;
}

interface UseCalendarReturn {
  // 状態
  calendarData: CalendarData | null;
  days: DayStats[];
  summary: CalendarSummary | null;
  loading: boolean;
  error: string | null;
  
  // 現在表示中の年月
  year: number;
  month: number;
  
  // 利用可能な年月リスト
  availableYearMonths: YearMonth[];
  
  // アクション
  loadCalendar: (year: number, month: number) => Promise<void>;
  loadAvailableMonths: () => Promise<void>;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToMonth: (year: number, month: number) => void;
  
  // データ取得
  getDayStats: (date: string) => DayStats | undefined;
  hasReport: (date: string) => boolean;
  getWorkHours: (date: string) => { plan: number; result: number };
}

export function useCalendar(initialYear?: number, initialMonth?: number): UseCalendarReturn {
  const today = dayjs();
  const [year, setYear] = useState(initialYear || today.year());
  const [month, setMonth] = useState(initialMonth || today.month() + 1);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [availableYearMonths, setAvailableYearMonths] = useState<YearMonth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // カレンダーデータ読み込み
  const loadCalendar = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await calendarApi.get(y, m);
      setCalendarData(data);
      setYear(y);
      setMonth(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カレンダーデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // 利用可能な年月リストを読み込み
  const loadAvailableMonths = useCallback(async () => {
    try {
      const yearMonths = await calendarApi.getAvailableMonths();
      setAvailableYearMonths(yearMonths);
    } catch (err) {
      console.error('Failed to load available months:', err);
    }
  }, []);

  // 前月に移動
  const goToPrevMonth = useCallback(() => {
    const prev = dayjs(`${year}-${month}-01`).subtract(1, 'month');
    loadCalendar(prev.year(), prev.month() + 1);
  }, [year, month, loadCalendar]);

  // 次月に移動
  const goToNextMonth = useCallback(() => {
    const next = dayjs(`${year}-${month}-01`).add(1, 'month');
    loadCalendar(next.year(), next.month() + 1);
  }, [year, month, loadCalendar]);

  // 指定月に移動
  const goToMonth = useCallback((y: number, m: number) => {
    loadCalendar(y, m);
  }, [loadCalendar]);

  // 日別統計取得
  const getDayStats = useCallback((date: string) => {
    return calendarData?.days.find(d => d.date === date);
  }, [calendarData]);

  // 日報存在チェック
  const hasReport = useCallback((date: string) => {
    return getDayStats(date)?.hasReport || false;
  }, [getDayStats]);

  // 稼働時間取得
  const getWorkHours = useCallback((date: string) => {
    const stats = getDayStats(date);
    return {
      plan: stats?.planHours || 0,
      result: stats?.resultHours || 0,
    };
  }, [getDayStats]);

  // 初期読み込み
  useEffect(() => {
    loadCalendar(year, month);
    loadAvailableMonths();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    calendarData,
    days: calendarData?.days || [],
    summary: calendarData?.summary || null,
    loading,
    error,
    year,
    month,
    availableYearMonths,
    loadCalendar,
    loadAvailableMonths,
    goToPrevMonth,
    goToNextMonth,
    goToMonth,
    getDayStats,
    hasReport,
    getWorkHours,
  };
}

