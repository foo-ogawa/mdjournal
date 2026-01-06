/**
 * Report Domain Implementation
 * 
 * Implements ReportApi interface from the contract package.
 * Contains HTTP-agnostic business logic for report operations.
 */

import type { ReportApi } from '@mdjournal/contract/domains/ReportApi.js';
import type {
  ReportResponse,
  ReportSaveResponse,
  Report_getReportInput,
  Report_saveReportInput,
  Report_deleteReportInput,
} from '@mdjournal/contract/schemas/types.js';

import { readReport, writeReport, deleteReport as deleteReportFile, getReportFilePath } from '../../utils/fileManager.js';
import { parseMarkdown, calculateStats } from '../../utils/markdown.js';
import { gitCommit, gitPush, getRelativePathFromGitRoot } from '../../utils/git.js';
import { postToSlack } from '../../utils/slack.js';
import { NotFoundError, ValidationError } from './errors.js';

/**
 * 日付形式のバリデーション
 */
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export class ReportDomain implements ReportApi {
  /**
   * 日報取得
   */
  async getReport(input: Report_getReportInput): Promise<ReportResponse> {
    const { date } = input;

    if (!isValidDate(date)) {
      throw new ValidationError('日付形式が不正です（YYYY-MM-DD形式で指定してください）');
    }

    const result = await readReport(date);

    if (!result) {
      throw new NotFoundError('指定された日報が見つかりません');
    }

    // frontmatterがない場合はパースして統計情報を計算
    let stats = result.stats;
    if (!stats) {
      const report = parseMarkdown(date, result.content);
      stats = calculateStats(report);
    }

    return {
      date,
      content: result.content,
      stats,
    };
  }

  /**
   * 日報保存
   */
  async saveReport(input: Report_saveReportInput): Promise<ReportSaveResponse> {
    const { date, data } = input;

    if (!isValidDate(date)) {
      throw new ValidationError('日付形式が不正です（YYYY-MM-DD形式で指定してください）');
    }

    if (!data.content) {
      throw new ValidationError('contentフィールドは必須です');
    }

    // Markdownをパースして統計情報を計算
    const report = parseMarkdown(date, data.content);
    const stats = calculateStats(report);

    // ファイルに保存
    await writeReport(date, data.content, stats);

    const response: ReportSaveResponse = {
      date,
      saved: true,
      stats,
    };

    // Git操作
    if (data.git?.commit) {
      const filePath = getReportFilePath(date);
      const relativePath = getRelativePathFromGitRoot(filePath);
      const message = data.git.message || `日報更新: ${date}`;

      console.log(`Git commit: ${relativePath}`);
      const commitResult = await gitCommit(relativePath, message);
      console.log(`Git commit result:`, commitResult);

      response.git = {
        committed: commitResult.success,
        commitHash: commitResult.commitHash,
        error: commitResult.error,
      };

      // Push
      if (data.git.push && commitResult.success) {
        const pushResult = await gitPush();
        response.git.pushed = pushResult.success;
        if (pushResult.error) {
          response.git.error = pushResult.error;
        }
      }
    }

    // Slack投稿
    if (data.slack?.post) {
      console.log(`Slack post: ${date}`);
      const slackResult = await postToSlack(date, data.content);
      response.slack = {
        posted: slackResult.success,
        error: slackResult.error,
      };
      if (slackResult.success) {
        console.log(`Slack post success`);
      } else {
        console.log(`Slack post failed: ${slackResult.error}`);
      }
    }

    return response;
  }

  /**
   * 日報削除
   */
  async deleteReport(input: Report_deleteReportInput): Promise<void> {
    const { date } = input;

    if (!isValidDate(date)) {
      throw new ValidationError('日付形式が不正です（YYYY-MM-DD形式で指定してください）');
    }

    const deleted = await deleteReportFile(date);

    if (!deleted) {
      throw new NotFoundError('指定された日報が見つかりません');
    }
  }
}

