/**
 * 設定管理フック
 */

import { useState, useCallback, useEffect } from 'react';
import { configApi } from '../api/client';
import type { Config, Project, Routines, RoutineItem } from '../types';
import dayjs from 'dayjs';

interface UseConfigReturn {
  // 状態
  config: Config | null;
  projects: Project[];
  routines: Routines | null;
  loading: boolean;
  error: string | null;
  
  // アクション
  loadConfig: () => Promise<void>;
  updateConfig: (updates: Partial<Config>) => Promise<boolean>;
  
  // プロジェクト操作
  getProject: (code: string) => Project | undefined;
  getProjectColor: (code: string) => string;
  getProjectName: (code: string) => string;
  getActiveProjects: () => Project[];
  
  // ルーチン操作
  getRoutinesForDay: (date: dayjs.Dayjs) => RoutineItem[];
  getMonthlyRoutines: (type: 'start_of_month' | 'end_of_month') => { project: string; task: string }[];
}

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 設定読み込み
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await configApi.get();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // 設定更新
  const updateConfig = useCallback(async (updates: Partial<Config>) => {
    setError(null);
    
    try {
      const data = await configApi.update(updates);
      setConfig(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の更新に失敗しました');
      return false;
    }
  }, []);

  // プロジェクト取得
  const getProject = useCallback((code: string) => {
    return config?.projects.find(p => p.code === code);
  }, [config]);

  // プロジェクトカラー取得
  const getProjectColor = useCallback((code: string) => {
    return getProject(code)?.color || '#999';
  }, [getProject]);

  // プロジェクト名取得
  const getProjectName = useCallback((code: string) => {
    return getProject(code)?.name || code;
  }, [getProject]);

  // アクティブプロジェクト取得
  const getActiveProjects = useCallback(() => {
    return config?.projects.filter(p => p.active) || [];
  }, [config]);

  // 曜日のルーチン取得
  const getRoutinesForDay = useCallback((date: dayjs.Dayjs) => {
    if (!config?.routines?.weekly) return [];
    
    const dayNames: Record<number, keyof NonNullable<Routines['weekly']>> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    
    const dayName = dayNames[date.day()];
    return config.routines.weekly[dayName] || [];
  }, [config]);

  // 月次ルーチン取得
  const getMonthlyRoutines = useCallback((type: 'start_of_month' | 'end_of_month') => {
    if (!config?.routines?.monthly) return [];
    return config.routines.monthly[type] || [];
  }, [config]);

  // 初期読み込み
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    projects: config?.projects || [],
    routines: config?.routines || null,
    loading,
    error,
    loadConfig,
    updateConfig,
    getProject,
    getProjectColor,
    getProjectName,
    getActiveProjects,
    getRoutinesForDay,
    getMonthlyRoutines,
  };
}

