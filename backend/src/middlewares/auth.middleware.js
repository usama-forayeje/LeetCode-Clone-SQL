import { logger } from "../libs/logger.js";
import { ApiError } from "../utils/api-errors.js";
import asyncHandler from "../utils/async-handler.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    throw new ApiError(401, "Unauthorized - No token provided!");
  }

  let decoded;
  try {
    decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decoded) {
      throw new ApiError(401, "Unauthorized - Invalid token");
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    logger.error(`Error ${error}`);
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Unauthorized - Token has expired", error);
    }
    throw new ApiError(500, "Internal Server Error", error);
  }
});
