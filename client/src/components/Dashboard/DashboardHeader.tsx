import { Layout, DatePicker, Button, Space, Tooltip, Typography, message, Modal, Steps, Input, Tag, Checkbox } from 'antd';
import {
  GithubOutlined,
  CalendarOutlined,
  CloudUploadOutlined,
  SaveOutlined,
  CloudSyncOutlined,
  SendOutlined,
  CloseOutlined,
  ImportOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useState, useCallback, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { useDashboard } from './DashboardContext';

const { TextArea } = Input;

const { Header } = Layout;
const { Text } = Typography;

// localStorageのキー
const SAVE_STEP_KEY = 'dashboard_save_step';

interface DashboardHeaderProps {
  selectedDate: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs | null) => void;
  onImportClick?: () => void;
  selectedProjects?: { code: string; name: string; color: string }[];
  onRemoveProject?: (code: string) => void;
  onClearProjectFilter?: () => void;
}

export const DashboardHeader = ({
  selectedDate,
  onDateChange,
  onImportClick,
  selectedProjects = [],
  onRemoveProject,
  onClearProjectFilter,
}: DashboardHeaderProps) => {
  const { report, saveMultipleReports, config, unsavedReports } = useDashboard();
  
  // Slackが有効かどうか
  const slackEnabled = config.config?.slack?.enabled ?? false;
  
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  // saveStep: 0=ローカル保存のみ, 1=Commit, 2=Push, 3=Slack投稿
  const [saveStep, setSaveStep] = useState(() => {
    const saved = localStorage.getItem(SAVE_STEP_KEY);
    const step = saved ? parseInt(saved, 10) : 0;
    // Slack無効時はステップ3を選択できない
    return step;
  });
  const [executing, setExecuting] = useState(false);
  
  // 保存対象の日付チェック状態
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  
  // saveStepの変更をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem(SAVE_STEP_KEY, String(saveStep));
  }, [saveStep]);
  
  // Slack無効時にステップ3を選択していたらステップ2に戻す
  useEffect(() => {
    if (!slackEnabled && saveStep > 2) {
      setSaveStep(2);
    }
  }, [slackEnabled, saveStep]);
  
  // 未保存の日付一覧を取得（現在の日付も含む）- 新しい日付順
  const allUnsavedDates = useMemo(() => {
    const dates = new Set<string>(unsavedReports.unsavedDates);
    const currentDate = selectedDate.format('YYYY-MM-DD');
    if (report.isDirty) {
      dates.add(currentDate);
    }
    // 降順でソート（新しい日付が上）
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [unsavedReports.unsavedDates, selectedDate, report.isDirty]);
  
  // モーダルを開いたときに全てチェック
  useEffect(() => {
    if (commitModalOpen) {
      setCheckedDates(new Set(allUnsavedDates));
    }
  }, [commitModalOpen, allUnsavedDates]);

  const handleGoToToday = useCallback(() => {
    onDateChange(dayjs());
  }, [onDateChange]);

  const handlePrevDay = useCallback(() => {
    onDateChange(selectedDate.subtract(1, 'day'));
  }, [selectedDate, onDateChange]);

  const handleNextDay = useCallback(() => {
    onDateChange(selectedDate.add(1, 'day'));
  }, [selectedDate, onDateChange]);

  const handleCommitPushClick = useCallback(() => {
    // 前回選択したステップを維持（localStorageから復元済み）
    setCommitModalOpen(true);
  }, []);

  const handleCommitPushExecute = useCallback(async () => {
    if (checkedDates.size === 0) {
      message.warning('保存する日付を選択してください');
      return;
    }
    
    setExecuting(true);
    
    try {
      // saveStep: 0=ローカル保存のみ, 1=Commit, 2=Push, 3=Slack投稿
      const doCommit = saveStep >= 1;
      const doPush = saveStep >= 2;
      const doSlack = saveStep >= 3;
      
      const options = {
        git: doCommit ? {
          commit: true,
          push: doPush,
        } : undefined,
        slack: doSlack ? { post: true } : undefined,
      };
      
      // 複数の日付を保存
      const dates = Array.from(checkedDates);
      await saveMultipleReports(dates, options);
      
      setCommitModalOpen(false);
    } catch {
      message.error('操作に失敗しました');
    } finally {
      setExecuting(false);
    }
  }, [saveStep, checkedDates, saveMultipleReports]);

  // チェックボックスの切り替え
  const handleDateCheck = useCallback((date: string, checked: boolean) => {
    setCheckedDates(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(date);
      } else {
        next.delete(date);
      }
      return next;
    });
  }, []);

  // 全選択/全解除
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setCheckedDates(new Set(allUnsavedDates));
    } else {
      setCheckedDates(new Set());
    }
  }, [allUnsavedDates]);

  // プレビュー用のMarkdown（日付ごと）
  const getMarkdownPreview = useCallback((date: string) => {
    const currentDate = selectedDate.format('YYYY-MM-DD');
    if (date === currentDate) {
      return report.markdownContent || '（日報データがありません）';
    }
    const unsaved = unsavedReports.getUnsavedReport(date);
    return unsaved?.currentMarkdown || '（データがありません）';
  }, [selectedDate, report.markdownContent, unsavedReports]);

  // Git tooltip content
  const gitTooltip = useMemo(() => {
    const totalUnsaved = allUnsavedDates.length;
    return (
      <div style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Git</div>
        <div>未保存: {totalUnsaved}件</div>
      </div>
    );
  }, [allUnsavedDates.length]);

  // 未保存の変更があるかどうか
  const hasUnsavedChanges = allUnsavedDates.length > 0;

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 64,
      }}
    >
      {/* Left: Logo & Date */}
      <Space size="large">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 18 }}>
            日報ダッシュボード
          </Text>
        </div>

        <Space size="small">
          <Button size="small" onClick={handlePrevDay}>
            ◀
          </Button>
          <DatePicker
            value={selectedDate}
            onChange={onDateChange}
            allowClear={false}
            format="YYYY年MM月DD日"
            style={{ width: 150 }}
          />
          <Button size="small" onClick={handleNextDay}>
            ▶
          </Button>
          <Button type="primary" size="small" onClick={handleGoToToday}>
            今日
          </Button>
          {selectedProjects.length > 0 && (
            <Space size={4} style={{ marginLeft: 8 }}>
              {selectedProjects.map(project => (
                <Tag 
                  key={project.code}
                  color={project.color}
                  closable
                  onClose={() => onRemoveProject?.(project.code)}
                  closeIcon={<CloseOutlined style={{ fontSize: 10 }} />}
                >
                  {project.code}
                </Tag>
              ))}
              {selectedProjects.length > 1 && (
                <Tag 
                  style={{ cursor: 'pointer' }}
                  onClick={onClearProjectFilter}
                >
                  すべて解除
                </Tag>
              )}
            </Space>
          )}
        </Space>
      </Space>

      {/* Right: Actions & Git Status */}
      <Space size="middle" align="center">
        <Button 
          icon={<ImportOutlined />} 
          onClick={onImportClick}
        >
          取り込み
        </Button>

        <Button 
          type="primary" 
          icon={<CloudUploadOutlined />} 
          onClick={handleCommitPushClick}
          loading={report.saving}
        >
          保存
        </Button>

        {/* Git Status */}
        <Tooltip title={gitTooltip}>
          <div style={{ position: 'relative', width: 24, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <GithubOutlined style={{ fontSize: 18, color: hasUnsavedChanges ? '#ff4d4f' : '#52c41a' }} />
            {hasUnsavedChanges && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: -6,
                  minWidth: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: '#ff4d4f',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                !
              </span>
            )}
          </div>
        </Tooltip>
      </Space>

      {/* 保存確認モーダル */}
      <Modal
        title="保存の確認"
        open={commitModalOpen}
        onCancel={() => setCommitModalOpen(false)}
        onOk={handleCommitPushExecute}
        okText="実行"
        cancelText="キャンセル"
        okButtonProps={{ loading: executing, disabled: checkedDates.size === 0 }}
        width={900}
      >
        <div style={{ marginBottom: 24 }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
            保存範囲を選択してください（クリックで選択、右を選ぶと左も自動で実行されます）
          </Text>
          <Steps
            current={saveStep}
            onChange={(step) => setSaveStep(step)}
            items={[
              {
                title: 'ローカル保存',
                description: 'ファイルに保存',
                icon: <FileOutlined />,
              },
              {
                title: 'Commit',
                description: 'Gitにコミット',
                icon: <SaveOutlined />,
              },
              {
                title: 'Push',
                description: 'リモートに反映',
                icon: <CloudSyncOutlined />,
              },
              ...(slackEnabled ? [{
                title: 'Slack',
                description: '日報を投稿',
                icon: <SendOutlined />,
              }] : []),
            ]}
            style={{ marginTop: 16 }}
          />
        </div>

        {/* 保存対象の選択 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <Text strong style={{ fontSize: 14 }}>保存対象 ({checkedDates.size}/{allUnsavedDates.length}件)</Text>
            <Checkbox 
              checked={checkedDates.size === allUnsavedDates.length && allUnsavedDates.length > 0}
              indeterminate={checkedDates.size > 0 && checkedDates.size < allUnsavedDates.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              全選択
            </Checkbox>
          </div>
          
          <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
            {allUnsavedDates.map((date, index) => (
              <div 
                key={date}
                style={{ 
                  padding: 12, 
                  borderBottom: index < allUnsavedDates.length - 1 ? '1px solid #f0f0f0' : 'none',
                  background: checkedDates.has(date) ? '#f6ffed' : '#fff',
                }}
              >
                <Checkbox
                  checked={checkedDates.has(date)}
                  onChange={(e) => handleDateCheck(date, e.target.checked)}
                  style={{ marginBottom: 8 }}
                >
                  <Text strong>{date}</Text>
                  {date === selectedDate.format('YYYY-MM-DD') && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>現在表示中</Tag>
                  )}
                </Checkbox>
                {checkedDates.has(date) && (
                  <TextArea
                    value={getMarkdownPreview(date)}
                    readOnly
                    autoSize={{ minRows: 10, maxRows: 20 }}
                    style={{ fontFamily: 'monospace', fontSize: 11, background: '#fafafa', marginTop: 4 }}
                  />
                )}
              </div>
            ))}
            {allUnsavedDates.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
                未保存の変更はありません
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Header>
  );
};
