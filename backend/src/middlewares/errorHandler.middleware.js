
import { ZodError } from "zod";
import { ApiError } from "../utils/api-errors.js";

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error("--- Error Details ---");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    if (err.errors) {
      console.error("Additional Errors (from ApiError/ZodError):", err.errors);
    }
    console.error("--- End Error Details ---");
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong on the server.";
  let responseErrors = [];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed. Please check your input.";
    responseErrors = err.errors.map((error) => ({
      field: error.path[0],
      message: error.message,
    }));
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      responseErrors = err.errors.map((error) => ({
        field: error.field || "general",
        message: error.message,
      }));
    }
  } else if (err.code === 11000 && err.keyValue) {
    statusCode = 400;
    message = `Duplicate value entered for ${Object.keys(err.keyValue)[0]} field. Please use another value.`;
    responseErrors.push({
      field: Object.keys(err.keyValue)[0],
      message: message,
    });
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired. Please log in again.";
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    errors: responseErrors.length > 0 ? responseErrors : undefined,
  });
};

export { errorHandler };
