/**
 * Config Service API Interface
 * Auto-generated from OpenAPI specification
 * DO NOT EDIT MANUALLY
 */

import type {
  Config,
  Config_getConfigInput,
  Config_getRoutinesMarkdownInput,
  Config_saveRoutinesMarkdownInput,
  Config_updateConfigInput,
  RoutinesMarkdownResponse,
} from '../schemas/types.js';

export interface ConfigServiceApi {
  /**
   * GET /config
   * @internal Not included in public contract
   */
  getConfig(input: Config_getConfigInput): Promise<Config>;

  /**
   * PUT /config
   * @internal Not included in public contract
   */
  updateConfig(input: Config_updateConfigInput): Promise<Config>;

  /**
   * GET /config/routines/markdown
   * @internal Not included in public contract
   */
  getRoutinesMarkdown(input: Config_getRoutinesMarkdownInput): Promise<RoutinesMarkdownResponse>;

  /**
   * PUT /config/routines/markdown
   * @internal Not included in public contract
   */
  saveRoutinesMarkdown(input: Config_saveRoutinesMarkdownInput): Promise<RoutinesMarkdownResponse>;

}