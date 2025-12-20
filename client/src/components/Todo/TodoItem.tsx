/**
 * 個別のTODOアイテムコンポーネント
 */

import { List, Space, Tag, Typography, Tooltip, Dropdown, Badge, Input, Button, DatePicker, Select } from 'antd';
import {
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import type { TodoItem as TodoItemType, Project } from '../../types';
import { StatusIcon } from './StatusIcon';
import { isOverdue, isNearDeadline } from '../../models';

const { Text } = Typography;
const { TextArea } = Input;

interface TodoItemProps {
  todo: TodoItemType;
  isHovered: boolean;
  isEditing: boolean;
  editText: string;
  editDeadline: string | undefined;
  editPriority: 'high' | 'medium' | 'low' | undefined;
  projects: Project[];
  getProjectColor: (code: string) => string;
  onHover: (id: string | null) => void;
  onStatusChange: (id: string) => void;
  onStartEdit: (todo: TodoItemType) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  onEditDeadlineChange: (deadline: string | undefined) => void;
  onEditPriorityChange: (priority: 'high' | 'medium' | 'low' | undefined) => void;
  onMenuAction: (key: string, todo: TodoItemType) => void;
}

// getProjectColor を使わないので削除して直接propsから参照
// 元のpropsとの互換性のため残す

export const TodoItemComponent = ({
  todo,
  isHovered,
  isEditing,
  editText,
  editDeadline,
  editPriority,
  projects,
  // getProjectColor は未使用だが互換性のため残す
  onHover,
  onStatusChange,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onEditDeadlineChange,
  onEditPriorityChange,
  onMenuAction,
}: TodoItemProps) => {
  const overdue = isOverdue(todo.deadline);
  const nearDeadline = isNearDeadline(todo.deadline);

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'high') {
      return <Tag color="red" style={{ margin: 0, fontSize: 10 }}>高</Tag>;
    }
    if (priority === 'medium') {
      return <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>中</Tag>;
    }
    return null;
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '編集',
      icon: <EditOutlined />,
    },
    {
      key: 'project',
      label: 'プロジェクト変更',
      children: projects.filter(p => p.active).map(p => ({
        key: `project:${todo.id}:${p.code}`,
        label: (
          <Space>
            <Badge color={p.color} />
            {p.name}
          </Space>
        ),
      })),
    },
    { type: 'divider' as const },
    { 
      key: 'delete', 
      label: '削除', 
      icon: <DeleteOutlined />, 
      danger: true,
    },
  ];

  const menu: MenuProps = {
    items: menuItems,
    onClick: ({ key }) => onMenuAction(key, todo),
    onSelect: ({ key }) => onMenuAction(key, todo),
    subMenuOpenDelay: 0.1,
    subMenuCloseDelay: 0.2,
  };

  if (isEditing) {
    return (
      <List.Item
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          marginBottom: 6,
          border: '1px solid #1890ff',
          background: '#e6f7ff',
        }}
      >
        <div style={{ width: '100%' }}>
          <TextArea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 8 }}
            style={{ marginBottom: 8, fontSize: 12 }}
            placeholder="1行目: タスク名&#10;2行目以降: 詳細説明（任意）"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Space size="small">
              <DatePicker
                size="small"
                placeholder="期日"
                value={editDeadline ? dayjs(editDeadline) : null}
                onChange={(date) => onEditDeadlineChange(date ? date.format('YYYY-MM-DD') : undefined)}
                style={{ width: 120 }}
                format="MM/DD"
              />
              <Select
                size="small"
                placeholder="優先度"
                value={editPriority}
                onChange={(value) => onEditPriorityChange(value)}
                allowClear
                style={{ width: 80 }}
                options={[
                  { value: 'high', label: <Tag color="red" style={{ margin: 0 }}>高</Tag> },
                  { value: 'medium', label: <Tag color="orange" style={{ margin: 0 }}>中</Tag> },
                  { value: 'low', label: <Tag color="blue" style={{ margin: 0 }}>低</Tag> },
                ]}
              />
            </Space>
            <Space size="small">
              <Button size="small" icon={<CloseOutlined />} onClick={onCancelEdit}>
                キャンセル
              </Button>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={onSaveEdit}>
                OK
              </Button>
            </Space>
          </div>
        </div>
      </List.Item>
    );
  }

  return (
    <List.Item
      onMouseEnter={() => onHover(todo.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        padding: '8px 12px',
        background: todo.status === 'completed' 
          ? '#fafafa'
          : overdue 
            ? '#fff2f0'
            : 'transparent',
        opacity: todo.status === 'completed' ? 0.6 : 1,
        borderRadius: 6,
        marginBottom: 6,
        border: overdue && todo.status !== 'completed'
          ? '1px solid #ffccc7'
          : '1px solid #f0f0f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%' }}>
        <StatusIcon status={todo.status} onClick={() => onStatusChange(todo.id)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text
              delete={todo.status === 'completed'}
              style={{ fontWeight: 500, fontSize: 13 }}
            >
              {todo.task}
            </Text>
            {getPriorityBadge(todo.priority)}
            {overdue && todo.status !== 'completed' && (
              <Tag color="error" style={{ margin: 0, fontSize: 10 }}>
                <WarningOutlined /> 期限切れ
              </Tag>
            )}
          </div>
          {todo.description && (
            <div style={{ marginTop: 4, paddingLeft: 4 }}>
              <Text
                type="secondary"
                style={{ fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
              >
                {todo.description}
              </Text>
            </div>
          )}
          {todo.deadline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Tooltip title={`期限: ${todo.deadline}`}>
                <Tag
                  color={overdue ? 'error' : nearDeadline ? 'warning' : 'default'}
                  style={{ margin: 0, fontSize: 10 }}
                >
                  <ClockCircleOutlined style={{ marginRight: 2 }} />
                  {dayjs(todo.deadline).format('MM/DD')}
                </Tag>
              </Tooltip>
            </div>
          )}
        </div>
        <Space size={4} style={{ visibility: isHovered ? 'visible' : 'hidden', flexShrink: 0 }}>
          <Dropdown 
            menu={menu}
            trigger={['click']}
            placement="bottomRight"
            styles={{ root: { minWidth: 140 } }}
          >
            <MoreOutlined 
              style={{ fontSize: 16, color: '#666', cursor: 'pointer', padding: '0 4px' }}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </Space>
      </div>
    </List.Item>
  );
};

