import { db } from "../../config/db.js";
import { logger } from "../libs/logger.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import cloudinary from "../utils/cloudinary.js";

import path from "path";
import fs from "fs/promises";

export const getUser = asyncHandler(async (req, res) => {
  // 1. Find user by ID (from token/middleware)
  // 2. If user not found, throw 404 error
  // 3. Remove sensitive fields before sending back user
  // 4. Send response

  const user = await db.user.findUnique({
    where: {
      id: req.userId,
    },
    include: {
      problemSolved: true,
      basicInfo: {
        include: {
          socials: true,
        },
      },
      purchases: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist!");
  }

  const {
    password,
    emailVerificationToken,
    emailVerificationExpiry,
    forgotPasswordToken,
    forgotPasswordExpiry,
    ...safeUser
  } = user;

  res
    .status(200)
    .json(
      new ApiResponse(200, "User retrieved successfully!", { user: safeUser })
    );
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  // 1. Check if image was uploaded
  // 2. Resolve uploaded image file path
  // 3. Upload to Cloudinary
  // 4. Get image URL from Cloudinary
  // 5. Delete the local file after upload
  // 6. Update user profile image in DB
  // 7. Send success response
  const profileImage = req.file;

  if (!profileImage) {
    throw new ApiError(400, "Profile Image is required");
  }

  let uploadPath;

  try {
    uploadPath = path.resolve(profileImage.path);

    const uploadResult = await cloudinary.uploader.upload(uploadPath, {
      folder: "leetlab/user/profileImages",
    });

    const imageUrl = uploadResult.secure_url;

    await fs.unlink(uploadPath);

    const updatedUser = await db.user.update({
      where: { id: req.userId },
      data: {
        profileImage: imageUrl,
      },
      select: {
        id: true,
        fullname: true,
        profileImage: true,
      },
    });

    res.status(200).json(
      new ApiResponse(200, "Profile image updated successfully!", {
        user: updatedUser,
      })
    );
  } catch (uploadError) {
    logger.error(`Error uploading profile image: ${uploadError}`);
    if (uploadPath) await fs.unlink(uploadPath);
    throw new ApiError(500, "Error uploading profile image!");
  }
});

export const updateBasicInfo = asyncHandler(async (req, res) => {
  // 1. Update user data using Prisma upsert for related nested records
  // 2. If somehow failed to update
  // 3. Send response
  const {
    fullname,
    username,
    gender,
    birth,
    bio,
    website,
    github,
    twitter,
    linkedIn,
  } = req.body;

  const updateUser = await db.user.update({
    where: {
      id: req.userId,
    },
    data: {
      fullname: fullname,
      username: username,
      basicInfo: {
        upsert: {
          create: {
            gender,
            birth,
            bio,
            socials: {
              create: { website, github, twitter, linkedIn },
            },
          },
          update: {
            gender,
            birth,
            bio,
            socials: {
              upsert: {
                create: { website, github, twitter, linkedIn },
                update: { website, github, twitter, linkedIn },
              },
            },
          },
        },
      },
    },
    select: {
      fullname: true,
      username: true,
      isEmailVerified: true,
      email: true,
    },
  });

  if (!updateUser) {
    throw new ApiError(500, "Failed to update user");
  }

  res.status(200).json(
    new ApiResponse(200, "Profile updated successfully", {
      user: updateUser,
    })
  );
});
