import { Layout, Space, Tag, Typography, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  BranchesOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { mockGitStatus as gitStatus } from '../../api/mockData';

const { Footer } = Layout;
const { Text } = Typography;

interface DashboardFooterProps {
  lastSaved?: string;
}

export const DashboardFooter = ({ lastSaved }: DashboardFooterProps) => {
  return (
    <Footer
      style={{
        background: '#fafafa',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #f0f0f0',
        height: 48,
      }}
    >
      {/* Left: Status */}
      <Space size="middle">
        <Tag icon={<CheckCircleOutlined />} color="success">
          接続中
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          最終保存: {lastSaved || '未保存'}
        </Text>
      </Space>

      {/* Center: Git Status */}
      <Space size="middle">
        <Tooltip title="Git ブランチ">
          <Tag icon={<BranchesOutlined />} color="blue">
            {gitStatus.branch}
          </Tag>
        </Tooltip>
        <Text type="secondary" style={{ fontSize: 12 }}>
          最終コミット: {gitStatus.lastCommit?.message || ''}
        </Text>
        {gitStatus.uncommittedChanges > 0 && (
          <Tag color="warning">{gitStatus.uncommittedChanges} 件の未コミット変更</Tag>
        )}
      </Space>

      {/* Right: Empty for balance */}
      <div style={{ width: 200 }} />
    </Footer>
  );
};
