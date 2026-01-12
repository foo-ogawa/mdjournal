/**
 * Calendar Service API Interface
 * Auto-generated from OpenAPI specification
 * DO NOT EDIT MANUALLY
 */

import type {
  CalendarData,
  Calendar_getAvailableYearMonthsInput,
  Calendar_getCalendarDataInput,
  YearMonthsResponse,
} from '../schemas/types.js';

export interface CalendarServiceApi {
  /**
   * GET /calendar
   * @internal Not included in public contract
   */
  getCalendarData(input: Calendar_getCalendarDataInput): Promise<CalendarData>;

  /**
   * GET /calendar/months
   * @internal Not included in public contract
   */
  getAvailableYearMonths(input: Calendar_getAvailableYearMonthsInput): Promise<YearMonthsResponse>;

}