/**
 * Service implementations barrel export
 * 
 * Export all service implementations for dependency injection.
 */

export { ReportService } from './ReportService.js';
export { CalendarService } from './CalendarService.js';
export { ConfigService } from './ConfigService.js';
export { GitService } from './GitService.js';
export { ServiceError, NotFoundError, ValidationError } from './errors.js';

// Re-export types from contract
export type { ReportServiceApi } from '@mdjournal/contract/services/ReportServiceApi.js';
export type { CalendarServiceApi } from '@mdjournal/contract/services/CalendarServiceApi.js';
export type { ConfigServiceApi } from '@mdjournal/contract/services/ConfigServiceApi.js';
export type { GitServiceApi } from '@mdjournal/contract/services/GitServiceApi.js';

