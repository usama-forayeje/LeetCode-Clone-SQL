import { logger } from "../libs/logger.js";
import { ApiError } from "../utils/api-errors.js";
import asyncHandler from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
import { db } from "../../config/db.js";

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
    
    // Get user details for consistency
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        isEmailVerified: true,
      }
    });

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.userId = decoded.id;
    req.user = user; // Add user object for consistency
    next();
  } catch (error) {
    logger.error(`Error ${error}`);
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Unauthorized - Token has expired", error);
    }
    throw new ApiError(500, "Internal Server Error", error);
  }
});
