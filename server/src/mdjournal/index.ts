/**
 * mdjournal module setup
 * 
 * Integrates auto-generated routes with service implementations.
 */

import { Router } from 'express';
import { initServices, registerRoutes } from './routes.generated.js';
import {
  ReportService,
  CalendarService,
  ConfigService,
  GitService,
} from './services/index.js';

/**
 * Create and configure the mdjournal router
 * 
 * This function:
 * 1. Instantiates all service implementations
 * 2. Initializes the generated routes with service instances
 * 3. Returns a configured Express router
 */
export function createMdjournalRouter(): Router {
  // Instantiate service implementations
  const services = {
    report: new ReportService(),
    calendar: new CalendarService(),
    config: new ConfigService(),
    git: new GitService(),
  };

  // Initialize generated routes with service instances
  initServices(services);

  // Create router and register routes
  const router = Router();
  registerRoutes(router, '');

  return router;
}

// Re-export for direct access if needed
export * from './services/index.js';

