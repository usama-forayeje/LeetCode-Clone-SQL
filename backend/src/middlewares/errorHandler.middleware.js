const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV !== "production") {
    err.logError();
  }

  res.status(statusCode).json({
    success: err.success || false,
    name: err.name || "Error",
    message: err.message || "Something went wrong",
    ...(err.error && { error: err.error }),
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });
};

export { errorHandler };
