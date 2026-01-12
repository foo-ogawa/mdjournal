/**
 * ConfigService tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from './ConfigService.js';
import { ValidationError } from './errors.js';
import type { RoutinesMarkdownResponse } from '@mdjournal/contract/schemas/types.js';
import type { Config } from '../../types/index.js';

// Mock dependencies
vi.mock('../../utils/fileManager.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  readRoutinesMarkdown: vi.fn(),
  writeRoutinesMarkdown: vi.fn(),
}));

import {
  readConfig,
  writeConfig,
  readRoutinesMarkdown,
  writeRoutinesMarkdown,
} from '../../utils/fileManager.js';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return config', async () => {
      const mockConfig: Config = {
        projects: [
          { code: 'P99', name: 'テストプロジェクト', color: '#FF0000', category: 'internal', active: true },
        ],
        routines: {
          weekly: {
            monday: [],
          },
        },
        timeline: {
          hourHeight: 60,
          maxHours: 24,
          defaultStartHour: 8,
          defaultEndHour: 20,
          snapMinutes: 15,
        },
      };
      vi.mocked(readConfig).mockResolvedValue(mockConfig);

      const result = await configService.getConfig({});

      expect(readConfig).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });
  });

  describe('updateConfig', () => {
    it('should update config with valid projects', async () => {
      const mockConfig: Config = {
        projects: [
          { code: 'P99', name: 'テストプロジェクト', color: '#FF0000', category: 'internal', active: true },
        ],
        routines: {},
      };
      vi.mocked(writeConfig).mockResolvedValue(undefined);
      vi.mocked(readConfig).mockResolvedValue(mockConfig);

      const result = await configService.updateConfig({
        data: {
          projects: [
            { code: 'P99', name: 'テストプロジェクト', color: '#FF0000', category: 'internal', active: true },
          ],
        },
      });

      expect(writeConfig).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should throw ValidationError for project without required fields', async () => {
      await expect(configService.updateConfig({
        data: {
          projects: [
            { code: 'P99', name: '', color: '#FF0000', category: 'internal', active: true },
          ],
        },
      })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid color format', async () => {
      await expect(configService.updateConfig({
        data: {
          projects: [
            { code: 'P99', name: 'テスト', color: 'red', category: 'internal', active: true },
          ],
        },
      })).rejects.toThrow(ValidationError);

      await expect(configService.updateConfig({
        data: {
          projects: [
            { code: 'P99', name: 'テスト', color: '#FFF', category: 'internal', active: true },
          ],
        },
      })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid category', async () => {
      await expect(configService.updateConfig({
        data: {
          projects: [
            { code: 'P99', name: 'テスト', color: '#FF0000', category: 'invalid' as 'internal', active: true },
          ],
        },
      })).rejects.toThrow(ValidationError);
    });

    it('should accept all valid categories', async () => {
      vi.mocked(writeConfig).mockResolvedValue(undefined);
      vi.mocked(readConfig).mockResolvedValue({ projects: [], routines: {} });

      const categories = ['internal', 'client', 'personal'] as const;

      for (const category of categories) {
        await expect(configService.updateConfig({
          data: {
            projects: [
              { code: 'P99', name: 'テスト', color: '#FF0000', category, active: true },
            ],
          },
        })).resolves.toBeDefined();
      }
    });

    it('should update config without projects', async () => {
      const mockConfig: Config = {
        projects: [],
        routines: {},
        timeline: { hourHeight: 80, maxHours: 24, defaultStartHour: 8, defaultEndHour: 20, snapMinutes: 15 },
      };
      vi.mocked(writeConfig).mockResolvedValue(undefined);
      vi.mocked(readConfig).mockResolvedValue(mockConfig);

      const result = await configService.updateConfig({
        data: { timeline: { hourHeight: 80 } },
      });

      expect(writeConfig).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });
  });

  describe('getRoutinesMarkdown', () => {
    it('should return routines markdown', async () => {
      const mockResponse: RoutinesMarkdownResponse = {
        content: '# ルーチン設定\n\n## 平日\n* 08:00 [P99] 朝礼',
        source: 'markdown',
      };
      vi.mocked(readRoutinesMarkdown).mockResolvedValue(mockResponse);

      const result = await configService.getRoutinesMarkdown({});

      expect(readRoutinesMarkdown).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return routines from yaml source', async () => {
      const mockResponse: RoutinesMarkdownResponse = {
        content: '# ルーチン設定（YAMLから変換）',
        source: 'yaml',
      };
      vi.mocked(readRoutinesMarkdown).mockResolvedValue(mockResponse);

      const result = await configService.getRoutinesMarkdown({});

      expect(result.source).toBe('yaml');
    });
  });

  describe('saveRoutinesMarkdown', () => {
    it('should save routines markdown', async () => {
      const content = '# ルーチン設定\n\n## 平日\n* 08:00 [P99] 朝礼';
      const mockResponse: RoutinesMarkdownResponse = {
        content,
        source: 'markdown',
      };
      vi.mocked(writeRoutinesMarkdown).mockResolvedValue(undefined);
      vi.mocked(readRoutinesMarkdown).mockResolvedValue(mockResponse);

      const result = await configService.saveRoutinesMarkdown({
        data: { content },
      });

      expect(writeRoutinesMarkdown).toHaveBeenCalledWith(content);
      expect(result).toEqual(mockResponse);
    });

    it('should throw ValidationError when content is missing', async () => {
      await expect(configService.saveRoutinesMarkdown({
        data: { content: '' },
      })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when content is not a string', async () => {
      await expect(configService.saveRoutinesMarkdown({
        data: { content: undefined as unknown as string },
      })).rejects.toThrow(ValidationError);
    });
  });
});
