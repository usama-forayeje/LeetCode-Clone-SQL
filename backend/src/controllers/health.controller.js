import { db } from "../../config/db.js";
import { logger } from "../libs/logger.js";
import { ApiError } from "../utils/api-errors.js";
import asyncHandler from "../utils/async-handler.js";

export const HealthController = asyncHandler(async (req, res) => {
    try {
      const data = await db.user.findMany();

      res.status(200).json({
        message: "Server is Healthy",
        data: data,
      });
    } catch (error) {
      logger.error(`Error Health Check ${error}`);
      throw new ApiError(500, "Internal server error", error);
    }
  }
);
 


