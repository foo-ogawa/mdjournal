/**
 * タイムラインの予定アイテムコンポーネント
 */

import { Typography, Dropdown, Badge, Space } from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { Project } from '../../types';
import type { RenderSlot } from '../../models';

const { Text } = Typography;

interface TimelineItemProps {
  item: RenderSlot;
  type: 'plan' | 'result';
  isHovered: boolean;
  isDragging: boolean;
  isDraggingToResultArea: boolean;
  dragOffset: number;
  getProjectColor: (code: string) => string;
  projects: Project[];
  onHover: (id: string | null) => void;
  onDragStart: (e: React.MouseEvent, itemId: string, type: 'plan' | 'result', startMinutes: number) => void;
  onMenuAction: (key: string) => void;
}

export const TimelineItem = ({
  item,
  type,
  isHovered,
  isDragging,
  isDraggingToResultArea,
  dragOffset,
  getProjectColor,
  projects,
  onHover,
  onDragStart,
  onMenuAction,
}: TimelineItemProps) => {
  const isResult = type === 'result';
  
  // ピクセル位置（RenderSlotに含まれている値を使用）
  const topPx = item.topPx;
  const heightPx = item.heightPx;
  const currentTopPx = isDragging && !isDraggingToResultArea ? topPx + dragOffset : topPx;

  const menuItems: MenuProps['items'] = [
    {
      key: 'project',
      label: 'プロジェクト変更',
      children: projects.filter(p => p.active).map(p => ({
        key: `project:${item.id}:${type}:${p.code}`,
        label: (
          <Space>
            <Badge color={p.color} />
            {p.name}
          </Space>
        ),
      })),
    },
    ...(type === 'plan' ? [{
      key: `toResult:${item.id}`,
      label: '実績に反映',
      icon: <CheckCircleOutlined />,
    }] : []),
    { type: 'divider' as const },
    {
      key: `delete:${item.id}:${type}`,
      label: '削除',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  const menu: MenuProps = {
    items: menuItems,
    onClick: ({ key }) => onMenuAction(key),
    onSelect: ({ key }) => onMenuAction(key),
    subMenuOpenDelay: 0.1,
    subMenuCloseDelay: 0.2,
  };

  return (
    <div
      onMouseEnter={() => !isDragging && onHover(`${type}-${item.id}`)}
      onMouseLeave={() => !isDragging && onHover(null)}
      onMouseDown={(e) => onDragStart(e, item.id, type, item.startMinutes)}
      style={{
        position: 'absolute',
        top: Math.max(0, currentTopPx),
        height: Math.max(heightPx, 20),
        left: 4,
        right: 4,
        background: isResult
          ? `${getProjectColor(item.project)}90`
          : `${getProjectColor(item.project)}40`,
        borderLeft: `3px solid ${getProjectColor(item.project)}`,
        borderRadius: 4,
        padding: '2px 6px',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'all 0.2s',
        fontSize: 11,
        opacity: isDraggingToResultArea ? 0.4 : (isDragging ? 0.8 : 1),
        zIndex: isDragging ? 10 : 1,
        boxShadow: isDragging && !isDraggingToResultArea ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 10, color: '#666', flexShrink: 0 }}>{item.time}</Text>
        <Text ellipsis style={{ fontSize: 11, fontWeight: 500, flex: 1 }}>
          {item.task}
        </Text>
        <div style={{ visibility: isHovered && !isDragging ? 'visible' : 'hidden', flexShrink: 0 }}>
          <Dropdown 
            menu={menu}
            trigger={['click']}
            placement="bottomRight"
            styles={{ root: { minWidth: 140 } }}
          >
            <MoreOutlined 
              style={{ fontSize: 14, color: '#666', cursor: 'pointer', padding: '0 2px' }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      </div>
      {item.description && (
        <Text 
          style={{ 
            fontSize: 10, 
            color: '#888', 
            display: 'block',
            marginTop: 2,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.3,
          }}
        >
          {item.description}
        </Text>
      )}
    </div>
  );
};

