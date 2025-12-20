/**
 * モックデータ
 * 
 * API開発前のフロントエンド開発用モックデータ。
 * 実際のAPI接続時は使用しない。
 */

import type {
  DailyReport,
  Config,
  CalendarData,
  GoogleCalendarEvent,
  Project,
  Routines,
} from '../types';

// ===========================================
// プロジェクトマスタ
// ===========================================
export const mockProjects: Project[] = [
  {
    code: 'P99',
    name: '社内業務',
    color: '#52c41a',
    category: 'internal',
    active: true,
  },
  {
    code: 'P34',
    name: 'クライアントA',
    color: '#1890ff',
    category: 'client',
    client: 'A社',
    active: true,
  },
  {
    code: 'P14',
    name: 'システムB',
    color: '#722ed1',
    category: 'client',
    active: true,
  },
  {
    code: 'P08',
    name: 'サービスC',
    color: '#eb2f96',
    category: 'client',
    active: true,
  },
  {
    code: 'P37',
    name: 'クライアントD',
    color: '#fa8c16',
    category: 'client',
    active: true,
  },
];

// ===========================================
// ルーチン定義
// ===========================================
export const mockRoutines: Routines = {
  weekly: {
    monday: [
      { id: 'w1-1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'w1-2', time: '09:00', project: 'P99', task: '新人研修サポート', duration: 30 },
      { id: 'w1-3', time: '09:30', project: 'P37', task: 'クライアントD デイリー', duration: 30 },
    ],
    tuesday: [
      { id: 'w2-1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'w2-2', time: '09:00', project: 'P34', task: 'クライアントA 定例MTG', duration: 60 },
    ],
    wednesday: [
      { id: 'w3-1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'w3-2', time: '09:00', project: 'P99', task: '新人研修サポート', duration: 30 },
    ],
    thursday: [
      { id: 'w4-1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'w4-2', time: '14:00', project: 'P14', task: 'システムB 定例', duration: 60 },
    ],
    friday: [
      { id: 'w5-1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'w5-2', time: '17:00', project: 'P99', task: '週報作成', duration: 60 },
    ],
  },
  monthly: {
    end_of_month: [
      { project: 'P99', task: '面談スケジュール調整', category: 'todo' },
      { project: 'P14', task: 'システムB 保守工数集計', category: 'todo' },
    ],
    start_of_month: [
      { project: 'P99', task: '経費精算申請', category: 'todo' },
    ],
  },
  quarterly: [
    {
      months: [3, 6, 9, 12],
      tasks: [{ project: 'P99', task: '契約更新確認' }],
    },
  ],
  yearly: [
    { month: 11, day: 10, project: 'P99', task: 'クラウドサービス契約更新' },
  ],
};

// ===========================================
// 設定
// ===========================================
export const mockConfig: Config = {
  projects: mockProjects,
  routines: mockRoutines,
};

// ===========================================
// 日報データストア
// ===========================================
export const mockReports: Record<string, DailyReport> = {
  '2025-12-18': {
    date: '2025-12-18',
    author: 'サンプル太郎',
    plan: [
      { id: 'p1', time: '08:30', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 30 },
      { id: 'p2', time: '09:00', project: 'P99', task: '新人研修サポート', duration: 30 },
      { id: 'p3', time: '09:30', project: 'P37', task: 'クライアントD デイリー', duration: 30 },
      { id: 'p4', time: '10:00', project: 'P34', task: 'クライアントA 障害MTG', duration: 60, metadata: { priority: 'high', meeting_url: 'https://meet.google.com/xxx' } },
      { id: 'p5', time: '11:00', project: 'P14', task: 'システムB 開発', duration: 120 },
      { id: 'p6', time: '13:00', project: 'P99', task: '昼休み', duration: 60 },
      { id: 'p7', time: '14:00', project: 'P08', task: 'サービスC リファクタリング', duration: 120 },
      { id: 'p8', time: '16:00', project: 'P34', task: 'クライアントA テスト作業', duration: 90 },
      { id: 'p9', time: '17:30', project: 'P99', task: '日報作成・整理', duration: 30 },
    ],
    result: [
      { id: 'r1', time: '08:30', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 45 },
      { id: 'r2', time: '09:15', project: 'P99', task: '新人研修サポート', duration: 30 },
      { id: 'r3', time: '09:45', project: 'P37', task: 'クライアントD デイリー', duration: 45 },
      { id: 'r4', time: '10:30', project: 'P34', task: 'クライアントA 障害MTG', duration: 60 },
      { id: 'r5', time: '11:30', project: 'P14', task: 'システムB 開発', duration: 90 },
    ],
    todos: [
      { id: 't1', project: 'P99', task: 'ブラウザ等アップデート', status: 'pending', deadline: '2025-12-20' },
      { id: 't2', project: 'P99', task: '社内規定作成', status: 'in_progress', priority: 'high' },
      { id: 't3', project: 'P34', task: 'クライアントA 見積作成', status: 'pending', deadline: '2025-12-19', priority: 'high' },
      { id: 't4', project: 'P14', task: 'システムB 月次報告', status: 'completed' },
      { id: 't5', project: 'P08', task: 'サービスC ドキュメント整備', status: 'on_hold' },
      { id: 't6', project: 'P99', task: '経費精算申請', status: 'pending', deadline: '2025-12-25' },
    ],
    notes: '本日の作業メモ:\n- 障害MTGで追加対応が発生\n- システムBの開発が予定より早く終了',
    stats: {
      planHours: 9.0,
      resultHours: 4.5,
      todoCount: 6,
      todoCompleted: 1,
      todoInProgress: 1,
      projectHours: {
        P99: 1.25,
        P37: 0.75,
        P34: 1.0,
        P14: 1.5,
      },
      updatedAt: '2025-12-18T17:30:00+09:00',
    },
  },
  '2025-12-17': {
    date: '2025-12-17',
    author: 'サンプル太郎',
    plan: [
      { id: 'p1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'p2', time: '09:00', project: 'P34', task: 'クライアントA 定例MTG', duration: 60 },
      { id: 'p3', time: '10:00', project: 'P14', task: 'システムB 開発', duration: 180 },
      { id: 'p4', time: '13:00', project: 'P99', task: '昼休み', duration: 60 },
      { id: 'p5', time: '14:00', project: 'P08', task: 'サービスC 開発', duration: 180 },
      { id: 'p6', time: '17:00', project: 'P99', task: '日報作成', duration: 60 },
    ],
    result: [
      { id: 'r1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'r2', time: '09:00', project: 'P34', task: 'クライアントA 定例MTG', duration: 60 },
      { id: 'r3', time: '10:00', project: 'P14', task: 'システムB 開発', duration: 180 },
      { id: 'r4', time: '13:00', project: 'P99', task: '昼休み', duration: 60 },
      { id: 'r5', time: '14:00', project: 'P08', task: 'サービスC 開発', duration: 180 },
      { id: 'r6', time: '17:00', project: 'P99', task: '日報作成', duration: 60 },
    ],
    todos: [
      { id: 't1', project: 'P99', task: 'ブラウザ等アップデート', status: 'pending', deadline: '2025-12-20' },
      { id: 't2', project: 'P34', task: 'クライアントA 見積作成', status: 'pending', deadline: '2025-12-19' },
    ],
    notes: '',
    stats: {
      planHours: 8.0,
      resultHours: 8.0,
      todoCount: 2,
      todoCompleted: 0,
      todoInProgress: 0,
      projectHours: {
        P99: 2.0,
        P34: 1.0,
        P14: 3.0,
        P08: 3.0,
      },
      updatedAt: '2025-12-17T18:00:00+09:00',
    },
  },
  '2025-12-16': {
    date: '2025-12-16',
    author: 'サンプル太郎',
    plan: [
      { id: 'p1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'p2', time: '09:00', project: 'P99', task: '新人研修サポート', duration: 30 },
      { id: 'p3', time: '09:30', project: 'P37', task: 'クライアントD デイリー', duration: 30 },
      { id: 'p4', time: '10:00', project: 'P14', task: 'システムB 開発', duration: 180 },
      { id: 'p5', time: '13:00', project: 'P99', task: '昼休み', duration: 60 },
      { id: 'p6', time: '14:00', project: 'P34', task: 'クライアントA 作業', duration: 180 },
      { id: 'p7', time: '17:00', project: 'P99', task: '日報作成', duration: 60 },
    ],
    result: [
      { id: 'r1', time: '08:00', project: 'P99', task: 'タスク確認・整理、日報返信', duration: 60 },
      { id: 'r2', time: '09:00', project: 'P99', task: '新人研修サポート', duration: 30 },
      { id: 'r3', time: '09:30', project: 'P37', task: 'クライアントD デイリー', duration: 30 },
      { id: 'r4', time: '10:00', project: 'P14', task: 'システムB 開発', duration: 150 },
      { id: 'r5', time: '12:30', project: 'P99', task: '昼休み', duration: 60 },
      { id: 'r6', time: '13:30', project: 'P34', task: 'クライアントA 作業', duration: 180 },
      { id: 'r7', time: '16:30', project: 'P99', task: '日報作成', duration: 60 },
    ],
    todos: [
      { id: 't1', project: 'P99', task: '週次MTG準備', status: 'completed' },
      { id: 't2', project: 'P14', task: 'システムB 月次報告', status: 'in_progress' },
    ],
    notes: '月曜のルーチン完了',
    stats: {
      planHours: 8.0,
      resultHours: 7.5,
      todoCount: 2,
      todoCompleted: 1,
      todoInProgress: 1,
      projectHours: {
        P99: 2.5,
        P37: 0.5,
        P14: 2.5,
        P34: 3.0,
      },
      updatedAt: '2025-12-16T17:30:00+09:00',
    },
  },
};

// ===========================================
// カレンダーデータ生成
// ===========================================
export function mockCalendarData(year: number, month: number): CalendarData {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  
  let totalPlanHours = 0;
  let totalResultHours = 0;
  let workDays = 0;
  let totalTodoCompleted = 0;
  const projectHours: Record<string, number> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const report = mockReports[date];
    
    if (report && report.stats) {
      days.push({
        date,
        hasReport: true,
        planHours: report.stats.planHours,
        resultHours: report.stats.resultHours,
        todoCount: report.stats.todoCount,
        todoCompleted: report.stats.todoCompleted,
      });
      
      totalPlanHours += report.stats.planHours;
      totalResultHours += report.stats.resultHours;
      totalTodoCompleted += report.stats.todoCompleted;
      workDays++;
      
      for (const [project, hours] of Object.entries(report.stats.projectHours)) {
        projectHours[project] = (projectHours[project] || 0) + hours;
      }
    } else {
      days.push({
        date,
        hasReport: false,
      });
    }
  }

  return {
    year,
    month,
    days,
    summary: {
      totalPlanHours,
      totalResultHours,
      workDays,
      todoCompleted: totalTodoCompleted,
      projectHours,
    },
  };
}

// ===========================================
// Googleカレンダーイベント生成
// ===========================================
export function mockGoogleCalendarEvents(date: string): GoogleCalendarEvent[] {
  // 簡易モック: 日付に応じたサンプルイベント
  return [
    {
      id: 'gcal-1',
      summary: '定例MTG',
      start: `${date}T10:00:00+09:00`,
      end: `${date}T11:00:00+09:00`,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: 'gcal-2',
      summary: 'チーム朝会',
      start: `${date}T09:00:00+09:00`,
      end: `${date}T09:30:00+09:00`,
    },
  ];
}

// ===========================================
// Git状態
// ===========================================
export const mockGitStatus = {
  branch: 'main',
  uncommittedChanges: 2,
  modifiedFiles: ['reports/2025/12/2025-12-18.md'],
  lastCommit: {
    hash: 'a1b2c3d',
    message: '日報更新: 2025-12-17',
    date: '2025-12-17T18:00:00+09:00',
  },
  lastPush: '2025-12-17T18:00:00+09:00',
};

// ===========================================
// 連携状態
// ===========================================
export const mockIntegrationStatus = {
  slack: { connected: true, lastSync: '2025-12-18T08:00:00+09:00' },
  googleCalendar: { connected: true, lastSync: '2025-12-18T08:30:00+09:00' },
  git: { connected: true, lastSync: '2025-12-18T09:30:00+09:00' },
};

