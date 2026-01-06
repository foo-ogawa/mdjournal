/**
 * ReportDomain tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportDomain } from './ReportDomain.js';
import { NotFoundError, ValidationError } from './errors.js';

// Mock dependencies
vi.mock('../../utils/fileManager.js', () => ({
  readReport: vi.fn(),
  writeReport: vi.fn(),
  deleteReport: vi.fn(),
  getReportFilePath: vi.fn(() => '/reports/2025-01-06.md'),
}));

vi.mock('../../utils/markdown.js', () => ({
  parseMarkdown: vi.fn(() => ({
    date: '2025-01-06',
    plan: [],
    result: [],
    todos: [],
  })),
  calculateStats: vi.fn(() => ({
    totalTasks: 0,
    completedTasks: 0,
    workingTime: 0,
    todoStats: {
      pending: 0,
      inProgress: 0,
      onHold: 0,
      completed: 0,
    },
  })),
}));

vi.mock('../../utils/git.js', () => ({
  gitCommit: vi.fn(() => Promise.resolve({ success: true, commitHash: 'abc123' })),
  gitPush: vi.fn(() => Promise.resolve({ success: true })),
  getRelativePathFromGitRoot: vi.fn(() => 'reports/2025-01-06.md'),
}));

vi.mock('../../utils/slack.js', () => ({
  postToSlack: vi.fn(() => Promise.resolve({ success: true })),
}));

import { readReport, writeReport, deleteReport } from '../../utils/fileManager.js';
import { gitCommit, gitPush } from '../../utils/git.js';
import { postToSlack } from '../../utils/slack.js';

describe('ReportDomain', () => {
  let reportDomain: ReportDomain;

  beforeEach(() => {
    reportDomain = new ReportDomain();
    vi.clearAllMocks();
  });

  describe('getReport', () => {
    it('should return report when found', async () => {
      const mockContent = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]
`;
      vi.mocked(readReport).mockResolvedValue({
        content: mockContent,
        stats: {
          planHours: 8.0,
          resultHours: 7.5,
          todoCount: 5,
          todoCompleted: 3,
          todoInProgress: 1,
          projectHours: { P99: 4.0, P34: 3.5 },
          updatedAt: '2025-01-06T17:00:00+09:00',
        },
      });

      const result = await reportDomain.getReport({ date: '2025-01-06' });

      expect(result.date).toBe('2025-01-06');
      expect(result.content).toBe(mockContent);
      expect(result.stats).toBeDefined();
      expect(result.stats.todoCount).toBe(5);
    });

    it('should throw NotFoundError when report not found', async () => {
      vi.mocked(readReport).mockResolvedValue(null);

      await expect(reportDomain.getReport({ date: '2025-01-06' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid date format', async () => {
      await expect(reportDomain.getReport({ date: '2025/01/06' }))
        .rejects.toThrow(ValidationError);

      await expect(reportDomain.getReport({ date: 'invalid' }))
        .rejects.toThrow(ValidationError);
    });

    it('should calculate stats if not present in file', async () => {
      vi.mocked(readReport).mockResolvedValue({
        content: '# Test content',
        stats: null,
      });

      const result = await reportDomain.getReport({ date: '2025-01-06' });

      expect(result.stats).toBeDefined();
    });
  });

  describe('saveReport', () => {
    it('should save report and return result', async () => {
      vi.mocked(writeReport).mockResolvedValue(undefined);

      const result = await reportDomain.saveReport({
        date: '2025-01-06',
        data: {
          content: '# Test content',
        },
      });

      expect(result.date).toBe('2025-01-06');
      expect(result.saved).toBe(true);
      expect(result.stats).toBeDefined();
      expect(writeReport).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid date', async () => {
      await expect(reportDomain.saveReport({
        date: 'invalid',
        data: { content: 'test' },
      })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when content is missing', async () => {
      await expect(reportDomain.saveReport({
        date: '2025-01-06',
        data: { content: '' },
      })).rejects.toThrow(ValidationError);
    });

    it('should perform git commit when requested', async () => {
      vi.mocked(writeReport).mockResolvedValue(undefined);
      vi.mocked(gitCommit).mockResolvedValue({ success: true, commitHash: 'abc123' });

      const result = await reportDomain.saveReport({
        date: '2025-01-06',
        data: {
          content: '# Test content',
          git: { commit: true },
        },
      });

      expect(gitCommit).toHaveBeenCalled();
      expect(result.git?.committed).toBe(true);
      expect(result.git?.commitHash).toBe('abc123');
    });

    it('should perform git push when requested', async () => {
      vi.mocked(writeReport).mockResolvedValue(undefined);
      vi.mocked(gitCommit).mockResolvedValue({ success: true, commitHash: 'abc123' });
      vi.mocked(gitPush).mockResolvedValue({ success: true });

      const result = await reportDomain.saveReport({
        date: '2025-01-06',
        data: {
          content: '# Test content',
          git: { commit: true, push: true },
        },
      });

      expect(gitPush).toHaveBeenCalled();
      expect(result.git?.pushed).toBe(true);
    });

    it('should not push if commit fails', async () => {
      vi.mocked(writeReport).mockResolvedValue(undefined);
      vi.mocked(gitCommit).mockResolvedValue({ success: false, error: 'Commit failed' });

      const result = await reportDomain.saveReport({
        date: '2025-01-06',
        data: {
          content: '# Test content',
          git: { commit: true, push: true },
        },
      });

      expect(gitPush).not.toHaveBeenCalled();
      expect(result.git?.committed).toBe(false);
    });

    it('should post to Slack when requested', async () => {
      vi.mocked(writeReport).mockResolvedValue(undefined);
      vi.mocked(postToSlack).mockResolvedValue({ success: true });

      const result = await reportDomain.saveReport({
        date: '2025-01-06',
        data: {
          content: '# Test content',
          slack: { post: true },
        },
      });

      expect(postToSlack).toHaveBeenCalledWith('2025-01-06', '# Test content');
      expect(result.slack?.posted).toBe(true);
    });

    it('should handle Slack post failure', async () => {
      vi.mocked(writeReport).mockResolvedValue(undefined);
      vi.mocked(postToSlack).mockResolvedValue({ success: false, error: 'Slack error' });

      const result = await reportDomain.saveReport({
        date: '2025-01-06',
        data: {
          content: '# Test content',
          slack: { post: true },
        },
      });

      expect(result.slack?.posted).toBe(false);
      expect(result.slack?.error).toBe('Slack error');
    });
  });

  describe('deleteReport', () => {
    it('should delete report successfully', async () => {
      vi.mocked(deleteReport).mockResolvedValue(true);

      await expect(reportDomain.deleteReport({ date: '2025-01-06' }))
        .resolves.toBeUndefined();
    });

    it('should throw NotFoundError when report not found', async () => {
      vi.mocked(deleteReport).mockResolvedValue(false);

      await expect(reportDomain.deleteReport({ date: '2025-01-06' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid date', async () => {
      await expect(reportDomain.deleteReport({ date: 'invalid' }))
        .rejects.toThrow(ValidationError);
    });
  });
});

