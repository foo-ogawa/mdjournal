/**
 * Report Service API Interface
 * Auto-generated from OpenAPI specification
 * DO NOT EDIT MANUALLY
 */

import type {
  ReportResponse,
  ReportSaveResponse,
  Report_deleteReportInput,
  Report_getReportInput,
  Report_saveReportInput,
} from '../schemas/types.js';

export interface ReportServiceApi {
  /**
   * GET /reports/{date}
   * @internal Not included in public contract
   */
  getReport(input: Report_getReportInput): Promise<ReportResponse>;

  /**
   * PUT /reports/{date}
   * @internal Not included in public contract
   */
  saveReport(input: Report_saveReportInput): Promise<ReportSaveResponse>;

  /**
   * DELETE /reports/{date}
   * @internal Not included in public contract
   */
  deleteReport(input: Report_deleteReportInput): Promise<void>;

}