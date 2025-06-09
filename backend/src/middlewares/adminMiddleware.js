import { db } from "../../config/db.js";
import { logger } from "../libs/logger.js";
import { ApiError } from "../utils/api-errors.js";
import asyncHandler from "../utils/async-handler.js";

export const isAdmin = asyncHandler(async (req, res,next) => {
  const userId = req.user.id;

  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  });

  if (user.role == "ADMIN") {
    logger.info("User is admin");
  }

  if (!user || user.role !== "ADMIN") {
    return res
      .status(403).
      json(new ApiError(403, "Access denied - Admin only"));
  }
  next()
});
