/**
 * Git Service Implementation
 * 
 * Implements GitApi interface from the contract package.
 * Contains HTTP-agnostic business logic for Git operations.
 */

import type { GitServiceApi } from '@mdjournal/contract/services/GitServiceApi.js';
import type {
  ExtendedGitStatus,
  Git_getStatusInput,
} from '@mdjournal/contract/schemas/types.js';

import { getExtendedGitStatus } from '../../utils/git.js';

export class GitService implements GitServiceApi {
  /**
   * Git状態取得
   */
  async getStatus(_input: Git_getStatusInput): Promise<ExtendedGitStatus> {
    return await getExtendedGitStatus();
  }
}

