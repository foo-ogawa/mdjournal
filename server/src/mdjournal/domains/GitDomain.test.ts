/**
 * GitDomain tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitDomain } from './GitDomain.js';
import type { ExtendedGitStatus } from '@mdjournal/contract/schemas/types.js';

// Mock dependencies
vi.mock('../../utils/git.js', () => ({
  getExtendedGitStatus: vi.fn(),
}));

import { getExtendedGitStatus } from '../../utils/git.js';

describe('GitDomain', () => {
  let gitDomain: GitDomain;

  beforeEach(() => {
    gitDomain = new GitDomain();
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return git status when repo is clean', async () => {
      const mockStatus: ExtendedGitStatus = {
        branch: 'main',
        uncommitted: {
          count: 0,
          files: [],
        },
        unpushed: {
          count: 0,
          commits: [],
        },
      };
      vi.mocked(getExtendedGitStatus).mockResolvedValue(mockStatus);

      const result = await gitDomain.getStatus({});

      expect(getExtendedGitStatus).toHaveBeenCalled();
      expect(result.branch).toBe('main');
      expect(result.uncommitted.count).toBe(0);
      expect(result.unpushed.count).toBe(0);
    });

    it('should return git status with uncommitted changes', async () => {
      const mockStatus: ExtendedGitStatus = {
        branch: 'feature/test',
        uncommitted: {
          count: 3,
          files: [
            { path: 'reports/2025-01-06.md', status: 'M' },
            { path: 'config/projects.yaml', status: 'A' },
            { path: 'README.md', status: 'M' },
          ],
        },
        unpushed: {
          count: 2,
          commits: [
            { hash: 'abc123', message: '日報更新', date: '2025-01-06 10:00:00', files: ['reports/2025-01-06.md'] },
            { hash: 'def456', message: '設定追加', date: '2025-01-06 09:00:00', files: ['config/projects.yaml'] },
          ],
        },
        lastCommit: {
          hash: 'abc123',
          message: '日報更新',
          date: '2025-01-06 10:00:00',
        },
      };
      vi.mocked(getExtendedGitStatus).mockResolvedValue(mockStatus);

      const result = await gitDomain.getStatus({});

      expect(result.branch).toBe('feature/test');
      expect(result.uncommitted.count).toBe(3);
      expect(result.uncommitted.files).toHaveLength(3);
      expect(result.unpushed.count).toBe(2);
      expect(result.lastCommit?.hash).toBe('abc123');
    });

    it('should handle repository with no unpushed commits', async () => {
      const mockStatus: ExtendedGitStatus = {
        branch: 'main',
        uncommitted: {
          count: 1,
          files: [{ path: 'file.txt', status: 'M' }],
        },
        unpushed: {
          count: 0,
          commits: [],
        },
      };
      vi.mocked(getExtendedGitStatus).mockResolvedValue(mockStatus);

      const result = await gitDomain.getStatus({});

      expect(result.branch).toBe('main');
      expect(result.uncommitted.count).toBe(1);
      expect(result.unpushed.count).toBe(0);
    });

    it('should handle lastCommit info', async () => {
      const mockStatus: ExtendedGitStatus = {
        branch: 'main',
        uncommitted: {
          count: 0,
          files: [],
        },
        unpushed: {
          count: 0,
          commits: [],
        },
        lastCommit: {
          hash: 'xyz789',
          message: '最新コミット',
          date: '2025-01-05 18:00:00',
        },
      };
      vi.mocked(getExtendedGitStatus).mockResolvedValue(mockStatus);

      const result = await gitDomain.getStatus({});

      expect(result.lastCommit).toBeDefined();
      expect(result.lastCommit?.hash).toBe('xyz789');
      expect(result.lastCommit?.message).toBe('最新コミット');
    });
  });
});
