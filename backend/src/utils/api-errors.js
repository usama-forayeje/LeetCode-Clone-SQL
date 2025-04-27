class ApiError extends Error {
  constructor(statusCode, message, error = [], stack = '') {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.error = error.length > 0 ? error : [message]; // If error array is empty, use message as error
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  logError() {
    // Log error details in the development environment
    console.error(`${this.name}: ${this.message} [StatusCode: ${this.statusCode}]`);
    if (process.env.NODE_ENV !== 'production') {
      console.error(this.stack); // Show stack trace in development environment
    }
  }
}

export { ApiError };
