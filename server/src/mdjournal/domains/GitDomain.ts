/**
 * Git Domain Implementation
 * 
 * Implements GitApi interface from the contract package.
 * Contains HTTP-agnostic business logic for Git operations.
 */

import type { GitApi } from '@mdjournal/contract/domains/GitApi.js';
import type {
  ExtendedGitStatus,
  Git_getStatusInput,
} from '@mdjournal/contract/schemas/types.js';

import { getExtendedGitStatus } from '../../utils/git.js';

export class GitDomain implements GitApi {
  /**
   * Git状態取得
   */
  async getStatus(_input: Git_getStatusInput): Promise<ExtendedGitStatus> {
    return await getExtendedGitStatus();
  }
}

