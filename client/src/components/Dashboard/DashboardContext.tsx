/**
 * ダッシュボードコンテキスト
 * グローバルな状態管理を提供
 */

import { createContext, useContext } from 'react';
import type { Dayjs } from 'dayjs';
import type { useReport, useConfig, useCalendar, UseUnsavedReportsReturn } from '../../hooks';

// ダッシュボードコンテキストの型定義
export interface DashboardContextType {
  // 日付
  selectedDate: Dayjs;
  setSelectedDate: (date: Dayjs) => void;
  
  // プロジェクトフィルタ（複数選択対応）
  selectedProjects: string[];
  toggleProject: (projectCode: string) => void;
  clearProjectFilter: () => void;
  
  // 日報
  report: ReturnType<typeof useReport>;
  
  // 設定
  config: ReturnType<typeof useConfig>;
  
  // カレンダー
  calendar: ReturnType<typeof useCalendar>;
  
  // 未保存レポート管理
  unsavedReports: UseUnsavedReportsReturn;
  
  // UI状態
  editorOpen: boolean;
  setEditorOpen: (open: boolean) => void;
  
  // アクション
  saveReport: (options?: { 
    git?: { commit?: boolean; push?: boolean; message?: string }; 
    slack?: { post?: boolean } 
  }) => Promise<void>;
  
  // 複数レポート保存
  saveMultipleReports: (
    dates: string[],
    options?: { 
      git?: { commit?: boolean; push?: boolean; message?: string }; 
      slack?: { post?: boolean } 
    }
  ) => Promise<void>;
}

// コンテキスト作成
export const DashboardContext = createContext<DashboardContextType | null>(null);

// コンテキスト使用フック
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within Dashboard');
  }
  return context;
};

