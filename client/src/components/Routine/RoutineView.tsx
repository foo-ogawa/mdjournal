import { Card, Space, Tag, Typography, List, Button, Badge, Tabs, Checkbox, message, Input } from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { useDashboard } from '../Dashboard/DashboardContext';
import { configApi } from '../../api';
import type { RoutineItem } from '../../types';

const { TextArea } = Input;

const { Text } = Typography;

// 拡張ルーチンアイテム（TODOカテゴリ対応）
interface ExtendedRoutineItem extends RoutineItem {
  category?: 'plan' | 'todo';
}

interface RoutineViewProps {
  onApplyRoutine?: (items: RoutineItem[]) => void;
}

export const RoutineView = ({ onApplyRoutine }: RoutineViewProps) => {
  const { config } = useDashboard();
  const { loadConfig } = config;
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const weeklyRoutine = config.routines?.weekly || {};
  const adhocRoutines = config.routines?.adhoc || [];
  const monthlyRoutines = config.routines?.monthly || {};
  const quarterlyRoutines = config.routines?.quarterly || [];
  const yearlyRoutines = config.routines?.yearly || [];

  // 編集モード開始時にMarkdownを取得
  const handleStartEdit = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await configApi.getRoutinesMarkdown();
      setEditContent(result.content);
      setIsEditing(true);
    } catch (error) {
      console.error('Failed to load routines markdown:', error);
      message.error('ルーチン設定の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存処理
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await configApi.saveRoutinesMarkdown(editContent);
      message.success('ルーチン設定を保存しました');
      setIsEditing(false);
      // 設定だけを再読み込み（ページ全体はリロードしない）
      await loadConfig();
    } catch (error) {
      console.error('Failed to save routines markdown:', error);
      message.error('ルーチン設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [editContent, loadConfig]);

  // キャンセル処理
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent('');
  }, []);
  
  const getProjectColor = (projectCode: string) => {
    return config.getProjectColor(projectCode);
  };

  // タブキーと表示ラベル
  const dayTabs = [
    { key: 'monday', label: '月' },
    { key: 'tuesday', label: '火' },
    { key: 'wednesday', label: '水' },
    { key: 'thursday', label: '木' },
    { key: 'friday', label: '金' },
    { key: 'saturday', label: '土' },
    { key: 'sunday', label: '日' },
    { key: 'adhoc', label: '随時' },
    { key: 'monthly', label: '月次' },
    { key: 'quarterly', label: '四半期' },
    { key: 'yearly', label: '年次' },
  ];

  // 今日の曜日
  const todayDayIndex = dayjs().day();
  const todayKey = todayDayIndex === 0 ? 'sunday' : dayTabs[todayDayIndex - 1].key;

  // 月次ルーチンを統合（schedule + start_of_month + end_of_month）
  const monthlyItems: ExtendedRoutineItem[] = useMemo(() => {
    const items: ExtendedRoutineItem[] = [];
    // スケジュール形式（時間付きタスク）
    if (monthlyRoutines.schedule) {
      monthlyRoutines.schedule.forEach((item: { time?: string; project: string; task: string }) => {
        items.push({
          time: item.time,
          project: item.project,
          task: item.task,
          category: 'plan',
        });
      });
    }
    // TODO形式
    if (monthlyRoutines.start_of_month) {
      monthlyRoutines.start_of_month.forEach((item: { project: string; task: string; category?: 'plan' | 'todo' }) => {
        items.push({
          project: item.project,
          task: `[月初] ${item.task}`,
          category: item.category || 'todo',
        });
      });
    }
    if (monthlyRoutines.end_of_month) {
      monthlyRoutines.end_of_month.forEach((item: { project: string; task: string; category?: 'plan' | 'todo' }) => {
        items.push({
          project: item.project,
          task: `[月末] ${item.task}`,
          category: item.category || 'todo',
        });
      });
    }
    return items;
  }, [monthlyRoutines]);

  // 四半期ルーチンをフラット化
  const quarterlyItems: ExtendedRoutineItem[] = useMemo(() => {
    const items: ExtendedRoutineItem[] = [];
    quarterlyRoutines.forEach((routine: { months: number[]; tasks: { project: string; task: string; category?: 'plan' | 'todo' }[]; schedule?: { time?: string; project: string; task: string }[] }) => {
      // スケジュール形式（時間付きタスク）
      if (routine.schedule) {
        routine.schedule.forEach((item) => {
          items.push({
            time: item.time,
            project: item.project,
            task: item.task,
            category: 'plan',
          });
        });
      }
      // TODO形式
      if (routine.months.length > 0) {
        const monthsLabel = routine.months.join(',') + '月';
        routine.tasks.forEach((task) => {
          items.push({
            project: task.project,
            task: `[${monthsLabel}] ${task.task}`,
            category: task.category || 'todo',
          });
        });
      }
    });
    return items;
  }, [quarterlyRoutines]);

  // 年次ルーチンを変換
  const yearlyItems: ExtendedRoutineItem[] = useMemo(() => {
    return yearlyRoutines.map((routine: { month: number; day: number; project: string; task: string; time?: string }) => {
      // 時間付きタスク（month/dayが0）の場合はスケジュール形式
      if (routine.time && routine.month === 0 && routine.day === 0) {
        return {
          time: routine.time,
          project: routine.project,
          task: routine.task,
          category: 'plan' as const,
        };
      }
      // それ以外はTODO形式
      return {
        project: routine.project,
        task: routine.task,
        category: 'todo' as const,
      };
    });
  }, [yearlyRoutines]);

  // 選択アイテムの切り替え
  const toggleSelection = (key: string, id: string) => {
    const itemKey = `${key}:${id}`;
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  // 全選択/解除
  const toggleAllSelection = (key: string, routines: ExtendedRoutineItem[]) => {
    const allKeys = routines.map((_, i) => `${key}:${i}`);
    const allSelected = allKeys.every(k => selectedItems.has(k));
    
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allKeys.forEach(k => next.delete(k));
      } else {
        allKeys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  // 選択されたルーチンを追加
  const handleAddSelected = () => {
    if (selectedItems.size === 0) {
      message.info('追加するルーチンを選択してください');
      return;
    }

    const items: ExtendedRoutineItem[] = [];
    selectedItems.forEach(itemKey => {
      const [key, indexStr] = itemKey.split(':');
      const index = parseInt(indexStr, 10);
      
      let routine: ExtendedRoutineItem | undefined;
      if (key === 'adhoc') {
        routine = adhocRoutines[index];
      } else if (key === 'monthly') {
        routine = monthlyItems[index];
      } else if (key === 'quarterly') {
        routine = quarterlyItems[index];
      } else if (key === 'yearly') {
        routine = yearlyItems[index];
      } else {
        const dayRoutines = weeklyRoutine[key as keyof typeof weeklyRoutine];
        routine = dayRoutines?.[index];
      }
      
      if (routine) {
        // 時間がある場合はplan、ない場合またはcategory=todoの場合はtodo
        const hasTime = routine.time && routine.time !== '';
        const category = routine.category || (hasTime ? 'plan' : 'todo');
        
        items.push({
          time: routine.time,
          project: routine.project,
          task: routine.task,
          duration: routine.duration,
          category,
        });
      }
    });

    if (items.length > 0 && onApplyRoutine) {
      onApplyRoutine(items);
      setSelectedItems(new Set());
      
      const planCount = items.filter(i => i.category === 'plan').length;
      const todoCount = items.filter(i => i.category === 'todo').length;
      const parts = [];
      if (planCount > 0) parts.push(`PLAN: ${planCount}件`);
      if (todoCount > 0) parts.push(`TODO: ${todoCount}件`);
      message.success(`ルーチンを追加しました（${parts.join('、')}）`);
    }
  };

  // ルーチンリスト描画
  const renderRoutineList = (key: string, routines: ExtendedRoutineItem[]) => {
    const allKeys = routines.map((_, i) => `${key}:${i}`);
    const allSelected = allKeys.length > 0 && allKeys.every(k => selectedItems.has(k));
    const someSelected = allKeys.some(k => selectedItems.has(k));

    return (
      <div>
        {routines.length > 0 && (
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={() => toggleAllSelection(key, routines)}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>すべて選択</Text>
            </Checkbox>
          </div>
        )}
        
        {routines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Text type="secondary">ルーチンが登録されていません</Text>
          </div>
        ) : (
          <List
            dataSource={routines}
            renderItem={(routine, index) => {
              const itemKey = `${key}:${index}`;
              const isSelected = selectedItems.has(itemKey);
              const hasTime = routine.time && routine.time !== '';
              const isTodo = routine.category === 'todo' || !hasTime;
              
              return (
                <List.Item
                  style={{
                    padding: '6px 8px',
                    marginBottom: 4,
                    borderRadius: 4,
                    borderLeft: `3px solid ${getProjectColor(routine.project)}`,
                    background: isSelected ? '#e6f7ff' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => toggleSelection(key, String(index))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                    <Checkbox
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelection(key, String(index))}
                    />
                    {/* タスク（時間付き）かTODOか区別 */}
                    {isTodo ? (
                      <Text style={{ fontSize: 11, color: '#52c41a', minWidth: 40 }}>
                        <CheckSquareOutlined style={{ marginRight: 2 }} />
                        TODO
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 11, color: '#1890ff', minWidth: 40, fontWeight: 500 }}>
                        <ClockCircleOutlined style={{ marginRight: 2 }} />
                        {routine.time}
                      </Text>
                    )}
                    <Tag
                      color={getProjectColor(routine.project)}
                      style={{ margin: 0, fontSize: 10 }}
                    >
                      {routine.project}
                    </Tag>
                    <Text ellipsis style={{ flex: 1, fontSize: 12 }}>
                      {routine.task}
                    </Text>
                    {/* durationは設定されている場合のみ表示 */}
                    {routine.duration && routine.duration > 0 && (
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {formatDuration(routine.duration)}
                      </Text>
                    )}
                  </div>
                </List.Item>
              );
            }}
            size="small"
            split={false}
          />
        )}
      </div>
    );
  };

  // 時間フォーマット
  const formatDuration = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}分`;
    if (m === 0) return `${h}時間`;
    return `${h}時間${m}分`;
  };

  // タブアイテム生成
  const tabItems = useMemo(() => {
    return dayTabs.map(tab => {
      let routines: ExtendedRoutineItem[];
      if (tab.key === 'adhoc') {
        routines = adhocRoutines;
      } else if (tab.key === 'monthly') {
        routines = monthlyItems;
      } else if (tab.key === 'quarterly') {
        routines = quarterlyItems;
      } else if (tab.key === 'yearly') {
        routines = yearlyItems;
      } else {
        routines = weeklyRoutine[tab.key as keyof typeof weeklyRoutine] || [];
      }
      
      const isToday = tab.key === todayKey;
      const selectedCount = routines.filter((_, i) => selectedItems.has(`${tab.key}:${i}`)).length;
      
      return {
        key: tab.key,
        label: (
          <Space size={4}>
            <span>{tab.label}</span>
            {isToday && <Badge status="processing" />}
            {selectedCount > 0 && (
              <Badge count={selectedCount} size="small" style={{ backgroundColor: '#1890ff' }} />
            )}
          </Space>
        ),
        children: renderRoutineList(tab.key, routines),
      };
    });
  }, [weeklyRoutine, adhocRoutines, monthlyItems, quarterlyItems, yearlyItems, selectedItems, todayKey]);

  // 編集モードのUI
  if (isEditing) {
    return (
      <Card
        title={
          <Space>
            <EditOutlined />
            <span>ルーチン編集</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancel}
              disabled={isSaving}
            >
              キャンセル
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={isSaving}
            >
              保存
            </Button>
          </Space>
        }
        style={{ height: '100%' }}
        styles={{ body: { padding: 12, height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column' } }}
      >
        <TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          style={{ 
            flex: 1, 
            fontFamily: 'monospace', 
            fontSize: 12,
            resize: 'none',
          }}
          placeholder="## [ROUTINES]

### [Mon]
* 08:00 [P99] タスク確認

### [month]
- [ ] [P99] 月末タスク"
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <ReloadOutlined />
          <span>ルーチン</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            disabled={selectedItems.size === 0}
            onClick={handleAddSelected}
          >
            追加 {selectedItems.size > 0 && `(${selectedItems.size})`}
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={handleStartEdit}
            loading={isLoading}
          >
            編集
          </Button>
        </Space>
      }
      style={{ height: '100%' }}
      styles={{ body: { padding: 12, height: 'calc(100% - 57px)', overflow: 'auto' } }}
    >
      <Tabs
        defaultActiveKey={todayKey}
        size="small"
        items={tabItems}
      />
    </Card>
  );
};
