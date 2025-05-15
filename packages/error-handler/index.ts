export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details: any;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Operational errors are expected and can be handled
    this.details = details; // Additional details about the error
    Error.captureStackTrace(this, this.constructor); // Capture the stack trace
  }
}

//Not found error
export class NotFoundError extends AppError {
  constructor(message = "Resources Not Found") {
    super(message, 404);
  }
}
export class validationError extends AppError {
  constructor(message = "Invalid request data", details?: any) {
    super(message, 400, true, details);
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access to this resource") {
    super(message, 403);
  }
}
export class DatabaseError extends AppError {
  constructor(message = "Database error occurred", details?: any) {
    super(message, 500, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, 429);
  }
}
