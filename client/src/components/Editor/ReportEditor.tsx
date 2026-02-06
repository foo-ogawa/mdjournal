import {
  Card,
  Space,
  Typography,
  Button,
  Segmented,
  Select,
  Input,
  List,
  Tag,
  Divider,
  message,
  Tooltip,
  Popconfirm,
  Alert,
} from 'antd';
import {
  EditOutlined,
  FileTextOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  DragOutlined,
  UndoOutlined,
  RedoOutlined,
  GoogleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useDashboard } from '../Dashboard/DashboardContext';
import type { ScheduleItem, TodoItem, TodoStatus } from '../../types';
import { generateReportMarkdown } from '../../models';

const { Text } = Typography;
const { TextArea } = Input;

interface ReportEditorProps {
  selectedDate: dayjs.Dayjs;
  onClose?: () => void;
}

// 15分単位の時刻オプションを生成
const generateTimeOptions = () => {
  const options = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      options.push({ value: time, label: time });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export const ReportEditor = ({ selectedDate }: ReportEditorProps) => {
  const { report, config } = useDashboard();
  
  const [mode, setMode] = useState<'visual' | 'text'>('visual');
  const [plan, setPlan] = useState<ScheduleItem[]>([]);
  const [result, setResult] = useState<ScheduleItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // 日報データが読み込まれたら状態を初期化
  useEffect(() => {
    if (report.report) {
      setPlan(report.report.plan);
      setResult(report.report.result);
      setTodos(report.report.todos);
      setNotes(report.report.notes || '');
    }
  }, [report.report]);
  
  const projects = config.projects;
  const weeklyRoutine = config.routines?.weekly;

  // Markdown テキスト生成（テキストモード用）
  const authorName = report.report?.author || config.config?.author || '';
  const generateMarkdown = () => {
    return generateReportMarkdown(
      { date: selectedDate.format('YYYY-MM-DD'), plan, result, todos, notes, author: authorName },
      selectedDate.format('YYYY-MM-DD'),
      authorName
    );
  };

  const [markdownText, setMarkdownText] = useState(generateMarkdown());

  const projectOptions = projects.filter((p) => p.active).map((p) => ({
    value: p.code,
    label: (
      <Space>
        <span style={{ color: p.color }}>●</span>
        {p.code} - {p.name}
      </Space>
    ),
  }));

  // ルーチンを取得（曜日に応じて）
  const getDayRoutines = () => {
    if (!weeklyRoutine) return [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayName = dayNames[selectedDate.day()];
    return weeklyRoutine[dayName] || [];
  };

  // 予定追加
  const addScheduleItem = (type: 'plan' | 'result') => {
    const newItem: ScheduleItem = {
      id: `${type}-${Date.now()}`,
      time: dayjs().format('HH:00'),
      project: 'P99',
      task: '',
    };
    if (type === 'plan') {
      setPlan([...plan, newItem]);
    } else {
      setResult([...result, newItem]);
    }
  };

  // 予定削除
  const removeScheduleItem = (type: 'plan' | 'result', id: string) => {
    if (type === 'plan') {
      setPlan(plan.filter((item) => item.id !== id));
    } else {
      setResult(result.filter((item) => item.id !== id));
    }
  };

  // 予定更新
  const updateScheduleItem = (
    type: 'plan' | 'result',
    id: string,
    field: keyof ScheduleItem,
    value: string | number
  ) => {
    const updateFn = (items: ScheduleItem[]) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item));
    
    if (type === 'plan') {
      setPlan(updateFn(plan));
    } else {
      setResult(updateFn(result));
    }
  };

  // TODO追加
  const addTodo = () => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      project: 'P99',
      task: '',
      status: 'pending',
    };
    setTodos([...todos, newTodo]);
  };

  // TODO更新
  const updateTodo = (id: string, field: keyof TodoItem, value: string | TodoStatus) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, [field]: value } : todo)));
  };

  // TODO削除
  const removeTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // 保存
  const handleSave = () => {
    message.success('保存しました');
  };

  // ルーチンから計画に取り込み
  const handleApplyRoutine = () => {
    const routines = getDayRoutines();
    const newItems: ScheduleItem[] = routines.map((r, index) => ({
      id: `plan-routine-${Date.now()}-${index}`,
      time: r.time || '09:00',
      project: r.project,
      task: r.task,
      duration: r.duration,
    }));
    setPlan([...plan, ...newItems]);
    message.success(`${routines.length}件のルーチンを計画に追加しました`);
  };

  // Googleカレンダーから計画に取り込み（モック）
  const handleImportFromGCal = () => {
    const gcalEvents = [
      { id: 'g1', time: '10:00', task: 'チームMTG', project: 'P99' },
      { id: 'g2', time: '14:00', task: '1on1', project: 'P99' },
    ];
    const newItems: ScheduleItem[] = gcalEvents.map((e, index) => ({
      id: `plan-gcal-${Date.now()}-${index}`,
      time: e.time,
      project: e.project,
      task: e.task,
    }));
    setPlan([...plan, ...newItems]);
    message.success('Googleカレンダーから計画を取り込みました');
  };

  // 計画を実績にコピー
  const copyPlanToResult = () => {
    const newResult: ScheduleItem[] = plan.map((item, index) => ({
      ...item,
      id: `result-copy-${Date.now()}-${index}`,
    }));
    setResult(newResult);
    message.success('計画を実績にコピーしました');
  };

  // ビジュアルモード：スケジュール編集フォーム
  const renderScheduleForm = (type: 'plan' | 'result', items: ScheduleItem[]) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14 }}>
          {type === 'plan' ? '[PLAN] 計画' : '[RESULT] 実績'}
        </Text>
        <Space>
          {type === 'plan' && (
            <>
              <Tooltip title="ルーチンから取り込み">
                <Button size="small" icon={<ReloadOutlined />} onClick={handleApplyRoutine}>
                  ルーチン
                </Button>
              </Tooltip>
              <Tooltip title="Googleカレンダーから取り込み">
                <Button size="small" icon={<GoogleOutlined />} onClick={handleImportFromGCal}>
                  GCal
                </Button>
              </Tooltip>
            </>
          )}
          {type === 'result' && (
            <Tooltip title="計画を実績にコピー">
              <Button size="small" type="primary" ghost icon={<CopyOutlined />} onClick={copyPlanToResult}>
                計画をコピー
              </Button>
            </Tooltip>
          )}
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => addScheduleItem(type)}>
            追加
          </Button>
        </Space>
      </div>

      {type === 'result' && (
        <Alert
          type="info"
          message="計画を元に実績を記録してください。計画と異なる場合は直接編集できます。"
          style={{ marginBottom: 8, fontSize: 12 }}
          showIcon
        />
      )}

      <List
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '10px 12px',
              marginBottom: 6,
              borderRadius: 6,
              border: '1px solid #f0f0f0',
              background: '#fafafa',
            }}
          >
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <DragOutlined style={{ color: '#999', cursor: 'grab' }} />
                
                {/* 時刻選択 */}
                <Select
                  value={item.time}
                  options={timeOptions}
                  size="small"
                  style={{ width: 90 }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => updateScheduleItem(type, item.id, 'time', value)}
                  placeholder="時刻"
                />

                {/* プロジェクト選択 */}
                <Select
                  value={item.project}
                  options={projectOptions}
                  size="small"
                  style={{ width: 150 }}
                  onChange={(value) => updateScheduleItem(type, item.id, 'project', value)}
                />

                {/* タスク名 */}
                <Input
                  value={item.task}
                  placeholder="タスク名を入力..."
                  size="small"
                  style={{ flex: 1 }}
                  onChange={(e) => updateScheduleItem(type, item.id, 'task', e.target.value)}
                />

                {/* 削除ボタン */}
                <Popconfirm
                  title="削除しますか？"
                  onConfirm={() => removeScheduleItem(type, item.id)}
                >
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
              {/* 詳細説明 */}
              <Input.TextArea
                value={item.description || ''}
                placeholder="詳細説明（任意）"
                size="small"
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ marginTop: 8, marginLeft: 24 }}
                onChange={(e) => updateScheduleItem(type, item.id, 'description', e.target.value)}
              />
            </div>
          </List.Item>
        )}
        size="small"
        split={false}
        locale={{ emptyText: '項目がありません' }}
      />
    </div>
  );

  // ビジュアルモード：TODO編集フォーム
  const renderTodoForm = () => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14 }}>[TODO]</Text>
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addTodo}>
          追加
        </Button>
      </div>

      <List
        dataSource={todos}
        renderItem={(todo) => (
          <List.Item
            style={{
              padding: '10px 12px',
              marginBottom: 6,
              borderRadius: 6,
              border: '1px solid #f0f0f0',
              background: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <Select
                value={todo.status}
                size="small"
                style={{ width: 110 }}
                onChange={(value) => updateTodo(todo.id, 'status', value)}
                options={[
                  { value: 'pending', label: '[ ] 未着手' },
                  { value: 'in_progress', label: '[*] 進行中' },
                  { value: 'completed', label: '[x] 完了' },
                  { value: 'on_hold', label: '[-] 保留' },
                ]}
              />
              <Select
                value={todo.project}
                options={projectOptions}
                size="small"
                style={{ width: 150 }}
                onChange={(value) => updateTodo(todo.id, 'project', value)}
              />
              <Input
                value={todo.task}
                placeholder="タスク名を入力..."
                size="small"
                style={{ flex: 1 }}
                onChange={(e) => updateTodo(todo.id, 'task', e.target.value)}
              />
              <Input
                value={todo.deadline || ''}
                placeholder="期限 (YYYY-MM-DD)"
                size="small"
                style={{ width: 120 }}
                onChange={(e) => updateTodo(todo.id, 'deadline', e.target.value)}
              />
              <Popconfirm
                title="削除しますか？"
                onConfirm={() => removeTodo(todo.id)}
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          </List.Item>
        )}
        size="small"
        split={false}
        locale={{ emptyText: 'TODOがありません' }}
      />
    </div>
  );

  // ビジュアルモード
  const renderVisualMode = () => (
    <div style={{ height: '100%', overflow: 'auto', padding: '0 4px' }}>
      {renderScheduleForm('plan', plan)}
      <Divider style={{ margin: '16px 0' }} />
      {renderScheduleForm('result', result)}
      <Divider style={{ margin: '16px 0' }} />
      {renderTodoForm()}
      <Divider style={{ margin: '16px 0' }} />
      <div>
        <Text strong style={{ fontSize: 14 }}>[NOTE] メモ</Text>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="自由記述メモ..."
          style={{ marginTop: 8 }}
        />
      </div>
    </div>
  );

  // テキストモード
  const renderTextMode = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TextArea
          value={markdownText}
          onChange={(e) => setMarkdownText(e.target.value)}
          style={{
            height: '100%',
            fontFamily: 'monospace',
            fontSize: 13,
            background: '#fafafa',
          }}
        />
      </div>
    </div>
  );

  return (
    <Card
      title={
        <Space>
          <EditOutlined />
          <span>日報編集</span>
          <Tag>{selectedDate.format('YYYY-MM-DD (ddd)')}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Segmented
            size="small"
            options={[
              { label: 'ビジュアル', value: 'visual', icon: <EditOutlined /> },
              { label: 'テキスト', value: 'text', icon: <FileTextOutlined /> },
            ]}
            value={mode}
            onChange={(value) => {
              if (value === 'text') {
                setMarkdownText(generateMarkdown());
              }
              setMode(value as 'visual' | 'text');
            }}
          />
          <Divider type="vertical" />
          <Tooltip title="元に戻す (Ctrl+Z)">
            <Button type="text" size="small" icon={<UndoOutlined />} />
          </Tooltip>
          <Tooltip title="やり直し (Ctrl+Shift+Z)">
            <Button type="text" size="small" icon={<RedoOutlined />} />
          </Tooltip>
          <Divider type="vertical" />
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
      style={{ height: '100%' }}
      styles={{
        body: {
          padding: 16,
          height: 'calc(100% - 73px)',
          overflow: 'hidden',
        },
      }}
    >
      {mode === 'visual' ? renderVisualMode() : renderTextMode()}
    </Card>
  );
};
