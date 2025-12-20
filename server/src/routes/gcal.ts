/**
 * Googleカレンダー連携API ルーター
 * 
 * GET /api/gcal/events - Googleカレンダー予定取得
 * 
 * 注: 現在はモック実装。実際のGoogle Calendar API連携は将来実装予定。
 */

import { Router, Request, Response } from 'express';
import type { GoogleCalendarEvent, ApiError } from '../types/index.js';

const router = Router();

/**
 * 日付形式のバリデーション
 */
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * GET /api/gcal/events - Googleカレンダー予定取得
 */
router.get('/events', async (req: Request, res: Response) => {
  const date = req.query.date as string;

  if (!date || !isValidDate(date)) {
    const error: ApiError = {
      code: 'INVALID_DATE',
      message: '日付形式が不正です（YYYY-MM-DD形式で指定してください）',
    };
    return res.status(400).json(error);
  }

  // TODO: Google Calendar API 連携の実装
  // 現在はモックデータを返す

  // 環境変数でGoogleカレンダー連携が設定されているかチェック
  const isConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  
  if (!isConfigured) {
    // モックデータを返す
    const mockEvents: GoogleCalendarEvent[] = generateMockEvents(date);
    
    res.json({
      date,
      events: mockEvents,
    });
    return;
  }

  // 実際のGoogle Calendar API呼び出し（未実装）
  const error: ApiError = {
    code: 'NOT_IMPLEMENTED',
    message: 'Googleカレンダー連携は準備中です',
  };
  res.status(503).json(error);
});

/**
 * モックイベントを生成
 */
function generateMockEvents(date: string): GoogleCalendarEvent[] {
  // 曜日に応じてモックイベントを生成
  const dayOfWeek = new Date(date).getDay();
  
  // 土日はイベントなし
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [];
  }

  const events: GoogleCalendarEvent[] = [];
  
  // 月曜日: 週次定例
  if (dayOfWeek === 1) {
    events.push({
      id: `gcal-${date}-1`,
      summary: '週次定例MTG',
      description: 'チームの週次定例ミーティング',
      start: `${date}T10:00:00+09:00`,
      end: `${date}T11:00:00+09:00`,
      meetingUrl: 'https://meet.google.com/xxx-yyyy-zzz',
    });
  }

  // 毎日: 朝会（平日のみ）
  events.push({
    id: `gcal-${date}-2`,
    summary: '朝会',
    start: `${date}T09:00:00+09:00`,
    end: `${date}T09:15:00+09:00`,
  });

  // 水曜日: 1on1
  if (dayOfWeek === 3) {
    events.push({
      id: `gcal-${date}-3`,
      summary: '1on1 マネージャー',
      description: '週次1on1',
      start: `${date}T14:00:00+09:00`,
      end: `${date}T14:30:00+09:00`,
      meetingUrl: 'https://meet.google.com/aaa-bbbb-ccc',
    });
  }

  // 金曜日: 週報
  if (dayOfWeek === 5) {
    events.push({
      id: `gcal-${date}-4`,
      summary: '週報作成',
      start: `${date}T17:00:00+09:00`,
      end: `${date}T18:00:00+09:00`,
    });
  }

  return events;
}

export default router;

