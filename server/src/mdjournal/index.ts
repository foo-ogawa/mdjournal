/**
 * mdjournal module setup
 * 
 * Integrates auto-generated routes with domain implementations.
 */

import { Router } from 'express';
import { initDomains, registerRoutes } from './routes.generated.js';
import {
  ReportDomain,
  CalendarDomain,
  ConfigDomain,
  GitDomain,
} from './domains/index.js';

/**
 * Create and configure the mdjournal router
 * 
 * This function:
 * 1. Instantiates all domain implementations
 * 2. Initializes the generated routes with domain instances
 * 3. Returns a configured Express router
 */
export function createMdjournalRouter(): Router {
  // Instantiate domain implementations
  const domains = {
    report: new ReportDomain(),
    calendar: new CalendarDomain(),
    config: new ConfigDomain(),
    git: new GitDomain(),
  };

  // Initialize generated routes with domain instances
  initDomains(domains);

  // Create router and register routes
  const router = Router();
  registerRoutes(router, '');

  return router;
}

// Re-export for direct access if needed
export * from './domains/index.js';

