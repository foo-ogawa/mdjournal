/**
 * TODOフィルタータブバーコンポーネント
 */

import { Badge } from 'antd';
import {
  InboxOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';

export type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'on_hold';

interface TabItem {
  key: FilterType;
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}

interface TodoTabBarProps {
  filter: FilterType;
  counts: {
    all: number;
    pending: number;
    in_progress: number;
    completed: number;
    on_hold: number;
  };
  onFilterChange: (filter: FilterType) => void;
}

export const TodoTabBar = ({ filter, counts, onFilterChange }: TodoTabBarProps) => {
  const tabItems: TabItem[] = [
    { key: 'all', icon: <InboxOutlined />, label: '全て', count: counts.all, color: '#666' },
    { key: 'pending', icon: <ClockCircleOutlined />, label: '未着手', count: counts.pending, color: '#999' },
    { key: 'in_progress', icon: <PlayCircleOutlined />, label: '進行中', count: counts.in_progress, color: '#1890ff' },
    { key: 'completed', icon: <CheckCircleOutlined />, label: '完了', count: counts.completed, color: '#52c41a' },
    { key: 'on_hold', icon: <PauseCircleOutlined />, label: '保留', count: counts.on_hold, color: '#faad14' },
  ];

  return (
    <div 
      style={{ 
        display: 'flex',
        borderBottom: '1px solid #e8e8e8',
        background: '#fafafa',
        flexShrink: 0,
      }}
    >
      {tabItems.map((tab) => (
        <div
          key={tab.key}
          onClick={() => onFilterChange(tab.key)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '10px 4px',
            cursor: 'pointer',
            background: filter === tab.key ? '#fff' : 'transparent',
            borderBottom: filter === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ 
            fontSize: 14, 
            color: filter === tab.key ? tab.color : '#999',
          }}>
            {tab.icon}
          </span>
          <span style={{ 
            fontSize: 11, 
            color: filter === tab.key ? tab.color : '#999',
            fontWeight: filter === tab.key ? 600 : 400,
          }}>
            {tab.label}
          </span>
          <Badge 
            count={tab.count} 
            size="small"
            style={{ 
              backgroundColor: filter === tab.key ? tab.color : '#d9d9d9',
              fontSize: 10,
            }}
          />
        </div>
      ))}
    </div>
  );
};

