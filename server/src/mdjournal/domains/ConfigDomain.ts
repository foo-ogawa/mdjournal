/**
 * Config Domain Implementation
 * 
 * Implements ConfigApi interface from the contract package.
 * Contains HTTP-agnostic business logic for configuration operations.
 */

import type { ConfigApi } from '@mdjournal/contract/domains/ConfigApi.js';
import type {
  Config,
  RoutinesMarkdownResponse,
  Config_getConfigInput,
  Config_updateConfigInput,
  Config_getRoutinesMarkdownInput,
  Config_saveRoutinesMarkdownInput,
} from '@mdjournal/contract/schemas/types.js';

import { readConfig, writeConfig, readRoutinesMarkdown, writeRoutinesMarkdown } from '../../utils/fileManager.js';
import type { Config as FileManagerConfig } from '../../types/index.js';
import { ValidationError } from './errors.js';

export class ConfigDomain implements ConfigApi {
  /**
   * 設定取得
   */
  async getConfig(_input: Config_getConfigInput): Promise<Config> {
    return await readConfig() as unknown as Config;
  }

  /**
   * 設定更新
   */
  async updateConfig(input: Config_updateConfigInput): Promise<Config> {
    const config = input.data;

    // バリデーション
    if (config.projects) {
      for (const project of config.projects) {
        if (!project.code || !project.name || !project.color || !project.category) {
          throw new ValidationError('プロジェクトにはcode, name, color, categoryが必須です');
        }

        // カラーフォーマットチェック
        if (!/^#[0-9A-Fa-f]{6}$/.test(project.color)) {
          throw new ValidationError('colorは#RRGGBB形式で指定してください');
        }

        // カテゴリチェック
        if (!['internal', 'client', 'personal'].includes(project.category)) {
          throw new ValidationError('categoryはinternal, client, personalのいずれかを指定してください');
        }
      }
    }

    // 型をfileManagerが期待する形式に変換
    await writeConfig(config as unknown as Partial<FileManagerConfig>);
    return await readConfig() as unknown as Config;
  }

  /**
   * ルーチン設定をMarkdown形式で取得
   */
  async getRoutinesMarkdown(_input: Config_getRoutinesMarkdownInput): Promise<RoutinesMarkdownResponse> {
    return await readRoutinesMarkdown();
  }

  /**
   * ルーチン設定をMarkdown形式で保存
   */
  async saveRoutinesMarkdown(input: Config_saveRoutinesMarkdownInput): Promise<RoutinesMarkdownResponse> {
    const { content } = input.data;

    if (!content || typeof content !== 'string') {
      throw new ValidationError('contentは必須です');
    }

    await writeRoutinesMarkdown(content);
    return await readRoutinesMarkdown();
  }
}

