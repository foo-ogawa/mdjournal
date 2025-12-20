import { Card, Space, List, Typography, Button, Badge } from 'antd';
import {
  ProjectOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { useDashboard } from '../Dashboard/DashboardContext';

const { Text } = Typography;

interface ProjectViewProps {
  selectedProjects?: string[];
  onToggleProject?: (projectCode: string) => void;
}

export const ProjectView = ({ selectedProjects = [], onToggleProject }: ProjectViewProps) => {
  const { config, report } = useDashboard();
  
  const projects = config.projects;
  
  // プロジェクトごとの統計を計算
  const projectStats = useMemo(() => {
    const todos = report.report?.todos || [];
    return projects.filter((p) => p.active).map((project) => {
      const projectTodos = todos.filter((t) => t.project === project.code);
      const pendingTodos = projectTodos.filter((t) => t.status !== 'completed').length;
      return {
        ...project,
        pendingTodos,
      };
    });
  }, [projects, report.report?.todos]);

  // カテゴリ別にグループ化
  const groupedByCategory = useMemo(() => {
    return projectStats.reduce(
      (acc, project) => {
        if (!acc[project.category]) acc[project.category] = [];
        acc[project.category].push(project);
        return acc;
      },
      {} as Record<string, typeof projectStats>
    );
  }, [projectStats]);

  const categoryLabels: Record<string, string> = {
    internal: '社内業務',
    client: 'クライアント',
    personal: '個人',
  };

  const handleProjectClick = (projectCode: string) => {
    if (onToggleProject) {
      // トグル（クリックで選択/解除）
      onToggleProject(projectCode);
    }
  };

  return (
    <Card
      title={
        <Space>
          <ProjectOutlined />
          <span>プロジェクト</span>
        </Space>
      }
      extra={
        <Button type="text" size="small" icon={<SettingOutlined />} />
      }
      style={{ height: '100%' }}
      styles={{ body: { padding: 12, height: 'calc(100% - 57px)', overflow: 'auto' } }}
    >
      {/* プロジェクト一覧 */}
      {Object.entries(groupedByCategory).map(([category, categoryProjects]) => (
        <div key={category} style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 6,
              padding: '4px 8px',
              background: '#f5f5f5',
              borderRadius: 4,
            }}
          >
            <Text strong style={{ fontSize: 11 }}>{categoryLabels[category] || category}</Text>
            <Text type="secondary" style={{ fontSize: 10, marginLeft: 6 }}>
              ({categoryProjects.length})
            </Text>
          </div>

          <List
            dataSource={categoryProjects}
            renderItem={(project) => {
              const isSelected = selectedProjects.includes(project.code);
              return (
                <List.Item
                  onClick={() => handleProjectClick(project.code)}
                  style={{
                    padding: '8px 10px',
                    marginBottom: 4,
                    borderRadius: 6,
                    border: isSelected ? `2px solid ${project.color}` : '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: isSelected ? `${project.color}10` : '#fff',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: project.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text type="secondary" style={{ fontSize: 10, marginRight: 4 }}>[{project.code}]</Text>
                      <Text strong style={{ fontSize: 12 }}>{project.name}</Text>
                    </div>
                    {project.pendingTodos > 0 && (
                      <Badge 
                        count={project.pendingTodos} 
                        size="small"
                        style={{ backgroundColor: '#999' }}
                      />
                    )}
                  </div>
                </List.Item>
              );
            }}
            size="small"
            split={false}
          />
        </div>
      ))}
    </Card>
  );
};
