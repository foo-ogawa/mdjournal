/**
 * TODOステータスアイコンコンポーネント
 * 固定サイズ（18x18px）でレイアウトシフトを防止
 */

import React from 'react';
import {
  BorderOutlined,
  CaretRightFilled,
  PauseOutlined,
  CheckSquareFilled,
} from '@ant-design/icons';
import type { TodoItem } from '../../types';

interface StatusIconProps {
  status: TodoItem['status'];
  onClick: () => void;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, onClick }) => {
  // 外側コンテナ（常に同じサイズ）
  const wrapperStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    cursor: 'pointer',
    flexShrink: 0,
  };

  // 内側ボックス（ボーダー付き用）
  const boxStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 14,
    height: 14,
    borderRadius: 2,
  };

  switch (status) {
    case 'completed':
      return (
        <span style={wrapperStyle} onClick={onClick}>
          <CheckSquareFilled style={{ fontSize: 18, color: '#52c41a' }} />
        </span>
      );
    case 'in_progress':
      return (
        <span style={wrapperStyle} onClick={onClick}>
          <span style={{ ...boxStyle, border: '2px solid #1890ff' }}>
            <CaretRightFilled style={{ fontSize: 8, color: '#1890ff' }} />
          </span>
        </span>
      );
    case 'on_hold':
      return (
        <span style={wrapperStyle} onClick={onClick}>
          <span style={{ ...boxStyle, border: '2px solid #faad14' }}>
            <PauseOutlined style={{ fontSize: 8, color: '#faad14' }} />
          </span>
        </span>
      );
    default: // pending
      return (
        <span style={wrapperStyle} onClick={onClick}>
          <BorderOutlined style={{ fontSize: 18, color: '#d9d9d9' }} />
        </span>
      );
  }
};

