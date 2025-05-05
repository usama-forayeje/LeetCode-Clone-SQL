import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true, // Sends `RateLimit-*` headers
  legacyHeaders: false, // Disables the `X-RateLimit-*` headers
});
