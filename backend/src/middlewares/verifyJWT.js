import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-errors.js";
import asyncHandler from "../utils/async-handler.js";
import { logger } from "../utils/logger.js";
import { db } from "../../config/db.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json(new ApiError(401, "You need to login to access this route"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        image: true,
        name: true,
        role: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json(new ApiError(401, "User not found"));
    }

    req.user = user;

    logger.info("User verified: ", req.user); // Debugging line
    next();
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    return next(new ApiError(401, "Unauthorized - Invalid token", error));
  }
});

export { verifyJWT };
