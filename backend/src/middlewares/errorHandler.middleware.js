const errorHandler = (err, req, res, next) => {
  // Use a default statusCode of 500 for unhandled errors
  const statusCode = err.statusCode || 500;

  // Log the error if it's in development environment
  if (process.env.NODE_ENV !== 'production') {
    err.logError();  // Log detailed error in development mode
  }

  res.status(statusCode).json({
    success: err.success || false,
    name: err.name || "Error",
    message: err.message || "Something went wrong",
    ...(err.error && { error: err.error }), // Add error array if it exists
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined // Include stack trace in dev mode
  });
};

export { errorHandler };
