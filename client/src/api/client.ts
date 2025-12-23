/**
 * API クライアント
 * 
 * 日報管理ダッシュボードのバックエンドAPIとの通信を担当。
 */

import type {
  ReportResponse,
  ReportSaveRequest,
  ReportSaveResponse,
  CalendarData,
  Config,
  GoogleCalendarEvent,
  ExtendedGitStatus,
} from '../types';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * APIエラークラス（HTTPステータスコードを含む）
 */
class ApiError extends Error {
  status: number;
  code?: string;
  
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * APIリクエスト共通関数
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API Error' }));
    throw new ApiError(response.status, error.message || `HTTP ${response.status}`, error.code);
  }
  
  return response.json();
}

/**
 * 日報API
 */
export const reportApi = {
  /**
   * 日報取得
   */
  async get(date: string): Promise<ReportResponse | null> {
    try {
      return await fetchApi<ReportResponse>(`/reports/${date}`);
    } catch (error) {
      // 404は日報が存在しない
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * 日報保存
   */
  async save(date: string, request: ReportSaveRequest): Promise<ReportSaveResponse> {
    return fetchApi<ReportSaveResponse>(`/reports/${date}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * 日報削除
   */
  async delete(date: string): Promise<boolean> {
    try {
      await fetchApi(`/reports/${date}`, { method: 'DELETE' });
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * カレンダーAPI
 */
export const calendarApi = {
  /**
   * カレンダー用集計データ取得
   */
  async get(year: number, month: number): Promise<CalendarData> {
    return fetchApi<CalendarData>(`/calendar?year=${year}&month=${month}`);
  },

  /**
   * 日報が存在する年月リストを取得
   */
  async getAvailableMonths(): Promise<{ year: number; month: number }[]> {
    const response = await fetchApi<{ yearMonths: { year: number; month: number }[] }>('/calendar/months');
    return response.yearMonths;
  },
};

/**
 * ルーチンMarkdownレスポンス型
 */
interface RoutinesMarkdownResponse {
  content: string;
  source: 'markdown' | 'yaml';
}

/**
 * 設定API
 */
export const configApi = {
  /**
   * 設定取得
   */
  async get(): Promise<Config> {
    return fetchApi<Config>('/config');
  },

  /**
   * 設定更新
   */
  async update(config: Partial<Config>): Promise<Config> {
    return fetchApi<Config>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  /**
   * ルーチン設定をMarkdown形式で取得
   */
  async getRoutinesMarkdown(): Promise<RoutinesMarkdownResponse> {
    return fetchApi<RoutinesMarkdownResponse>('/config/routines/markdown');
  },

  /**
   * ルーチン設定をMarkdown形式で保存
   */
  async saveRoutinesMarkdown(content: string): Promise<RoutinesMarkdownResponse> {
    return fetchApi<RoutinesMarkdownResponse>('/config/routines/markdown', {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },
};

/**
 * Git連携API
 */
export const gitApi = {
  /**
   * Git状態取得（拡張）
   */
  async getStatus(): Promise<ExtendedGitStatus> {
    return fetchApi<ExtendedGitStatus>('/git/status');
  },
};

/**
 * Googleカレンダー連携API
 */
export const gcalApi = {
  /**
   * Googleカレンダー予定取得
   */
  async getEvents(date: string): Promise<GoogleCalendarEvent[]> {
    return fetchApi<GoogleCalendarEvent[]>(`/gcal/events?date=${date}`);
  },
};
