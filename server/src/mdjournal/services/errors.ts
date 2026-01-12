/**
 * Service Errors
 * 
 * HTTP-agnostic error classes for service layer.
 * These will be mapped to appropriate HTTP status codes at the route layer.
 */

export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string) {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super('INVALID_REQUEST', message);
    this.name = 'ValidationError';
  }
}

