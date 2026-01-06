/**
 * Git Domain API Interface
 * Auto-generated from OpenAPI specification
 * DO NOT EDIT MANUALLY
 */

import type {
  ExtendedGitStatus,
  Git_getStatusInput,
} from '../schemas/types.js';

export interface GitApi {
  /**
   * GET /git/status
   * @internal Not included in public contract
   */
  getStatus(input: Git_getStatusInput): Promise<ExtendedGitStatus>;

}