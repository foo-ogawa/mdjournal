/**
 * Domain API Interfaces
 * Auto-generated from OpenAPI specification
 * DO NOT EDIT MANUALLY
 */

import type { CalendarApi } from './CalendarApi.js';
import type { ConfigApi } from './ConfigApi.js';
import type { GitApi } from './GitApi.js';
import type { ReportApi } from './ReportApi.js';

export type { CalendarApi };
export type { ConfigApi };
export type { GitApi };
export type { ReportApi };

/**
 * Domain Registry for Dependency Injection
 * Use this interface for DI container type definitions
 */
export interface DomainRegistry {
  calendar: CalendarApi;
  config: ConfigApi;
  git: GitApi;
  report: ReportApi;
}