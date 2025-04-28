import { logger } from "./logger.js";

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      logger.error(err)
      next(err);
    });
  };
};

export default asyncHandler;
