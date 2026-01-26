/**
 * Centralized error handling middleware
 */

// Error codes for consistent API responses
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// Custom API Error class
export class ApiError extends Error {
  constructor(statusCode, message, code = ErrorCodes.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }

  static badRequest(message, code = ErrorCodes.VALIDATION_ERROR) {
    return new ApiError(400, message, code);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, ErrorCodes.NOT_FOUND);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message, ErrorCodes.DUPLICATE);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, ErrorCodes.INTERNAL_ERROR);
  }
}

// Async handler wrapper to catch errors
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Global error handler middleware
export function errorHandler(err, req, res, next) {
  // Log error with context
  console.error('[Error]', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      code: ErrorCodes.VALIDATION_ERROR
    });
  }

  // Default to 500 internal error
  res.status(500).json({
    error: 'Internal server error',
    code: ErrorCodes.INTERNAL_ERROR
  });
}

export default { ApiError, ErrorCodes, asyncHandler, errorHandler };
