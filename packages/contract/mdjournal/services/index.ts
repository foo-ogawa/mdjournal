/**
 * Service API Interfaces
 * Auto-generated from OpenAPI specification
 * DO NOT EDIT MANUALLY
 */

import type { CalendarServiceApi } from './CalendarServiceApi.js';
import type { ConfigServiceApi } from './ConfigServiceApi.js';
import type { GitServiceApi } from './GitServiceApi.js';
import type { ReportServiceApi } from './ReportServiceApi.js';

export type { CalendarServiceApi };
export type { ConfigServiceApi };
export type { GitServiceApi };
export type { ReportServiceApi };

/**
 * Service Registry for Dependency Injection
 * Use this interface for DI container type definitions
 */
export interface ServiceRegistry {
  calendar: CalendarServiceApi;
  config: ConfigServiceApi;
  git: GitServiceApi;
  report: ReportServiceApi;
}