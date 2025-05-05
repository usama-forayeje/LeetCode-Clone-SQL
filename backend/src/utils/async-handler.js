import { logger } from "./logger.js";

const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    try {
      await requestHandler(req, res, next);
    } catch (err) {
      logger.error(err);
      next(err);
    }
  };
};

export default asyncHandler;
