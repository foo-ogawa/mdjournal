/**
 * Domain implementations barrel export
 * 
 * Export all domain implementations for dependency injection.
 */

export { ReportDomain } from './ReportDomain.js';
export { CalendarDomain } from './CalendarDomain.js';
export { ConfigDomain } from './ConfigDomain.js';
export { GitDomain } from './GitDomain.js';
export { DomainError, NotFoundError, ValidationError } from './errors.js';

// Re-export types from contract
export type { ReportApi } from '@mdjournal/contract/domains/ReportApi.js';
export type { CalendarApi } from '@mdjournal/contract/domains/CalendarApi.js';
export type { ConfigApi } from '@mdjournal/contract/domains/ConfigApi.js';
export type { GitApi } from '@mdjournal/contract/domains/GitApi.js';

