import { logger } from "../libs/logger.js";

const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    try {
      await requestHandler(req, res, next);
    } catch (err) {
      logger.error(`Error in asyncHandler: ${err}`);
      next(err);
    }
  };
};

export default asyncHandler;
