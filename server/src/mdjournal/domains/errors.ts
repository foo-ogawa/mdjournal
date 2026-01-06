/**
 * Domain Errors
 * 
 * HTTP-agnostic error classes for domain layer.
 * These will be mapped to appropriate HTTP status codes at the route layer.
 */

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('INVALID_REQUEST', message);
    this.name = 'ValidationError';
  }
}

