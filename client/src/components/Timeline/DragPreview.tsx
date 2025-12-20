/**
 * ドラッグ中のプレビュー表示コンポーネント
 */

import { Typography } from 'antd';
import type { ScheduleItem } from '../../types';
import type { DragState } from './useTimelineDrag';

const { Text } = Typography;

/**
 * 分から時刻文字列を計算
 */
function minutesToTimeString(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

interface DragPreviewProps {
  dragState: DragState | null;
  dragOffset: number;
  isDraggingToResult: boolean;
  planItems: ScheduleItem[];
  getProjectColor: (code: string) => string;
  startHour?: number;
  totalHours?: number;
  hourHeight?: number;
}

export const DragPreview = ({
  dragState,
  dragOffset,
  isDraggingToResult,
  planItems,
  getProjectColor,
  startHour = 8,
  hourHeight = 60,
}: DragPreviewProps) => {
  if (!isDraggingToResult || !dragState || dragState.type !== 'plan') {
    return null;
  }
  
  // ピクセルオフセットから新しい時刻を計算
  const offsetMinutes = (dragOffset / hourHeight) * 60;
  const newMinutes = Math.round((dragState.startMinutes + offsetMinutes) / 15) * 15;
  const previewTime = minutesToTimeString(newMinutes);
  
  // プレビュー位置（ピクセル）
  const topPx = ((newMinutes - startHour * 60) / 60) * hourHeight;
  
  // 休憩スロットの場合
  if (dragState.isBreak) {
    const breakDuration = dragState.breakDuration || 60;
    const heightPx = (breakDuration / 60) * hourHeight;
    const endMinutes = newMinutes + breakDuration;
    const endTime = minutesToTimeString(endMinutes);
    
    return (
      <div
        style={{
          position: 'absolute',
          top: Math.max(0, topPx),
          height: Math.max(heightPx, 20),
          left: 4,
          right: 4,
          background: 'repeating-linear-gradient(45deg, rgba(200,200,200,0.3), rgba(200,200,200,0.3) 4px, rgba(180,180,180,0.3) 4px, rgba(180,180,180,0.3) 8px)',
          borderRadius: 4,
          border: '2px dashed #52c41a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.9,
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <Text style={{ fontSize: 10, color: '#52c41a', fontWeight: 500 }}>
          休憩 {previewTime}〜{endTime}
        </Text>
      </div>
    );
  }
  
  // 通常のアイテムの場合
  const draggedItem = planItems.find(item => item.id === dragState.itemId);
  if (!draggedItem) return null;
  
  const heightPx = hourHeight; // 1時間 = hourHeight px
  
  return (
    <div
      style={{
        position: 'absolute',
        top: Math.max(0, topPx),
        height: Math.max(heightPx, 20),
        left: 4,
        right: 4,
        background: `${getProjectColor(draggedItem.project)}30`,
        borderLeft: `3px dashed ${getProjectColor(draggedItem.project)}`,
        borderRadius: 4,
        padding: '2px 6px',
        overflow: 'hidden',
        fontSize: 11,
        opacity: 0.8,
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 10, color: '#666', flexShrink: 0 }}>{previewTime}</Text>
        <Text ellipsis style={{ fontSize: 11, fontWeight: 500, flex: 1, color: '#666' }}>
          {draggedItem.task}
        </Text>
      </div>
    </div>
  );
};

