import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken"; // Import jwt to fix the undeclared variable error
import { db } from "../../config/db.js";
import { logger } from "../libs/logger.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import { oauth2Client } from "../constants/OAuth.js";
import {
  forgotPasswordMailGenContent,
  sendMail,
  verificationMailGenContent,
} from "../utils/mail.js";
import { generateJWTTokens, generateTemporaryToken } from "../utils/token.js";

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const signUp = asyncHandler(async (req, res) => {
  const { fullname, email, password } = req.body;

  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser && existingUser.isEmailVerified) {
    throw new ApiError(400, "User with this email already exists");
  }

  if (existingUser && !existingUser.isEmailVerified) {
    const isTokenExpired =
      new Date(existingUser.emailVerificationExpiry).getTime() < Date.now();

    if (!isTokenExpired) {
      throw new ApiError(400, "Email not verified. Please verify your email.");
    }

    await db.user.delete({ where: { email } });
  }

  const { hashedToken, unHashedToken, tokenExpiry } = generateTemporaryToken();
  const hashedPassword = await hashPassword(password);

  const newUser = await db.user.create({
    data: {
      fullname,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
    },
  });

  if (!newUser) {
    throw new ApiError(401, "Error while creating new user");
  }

  const mailContent = await verificationMailGenContent(
    fullname,
    `${process.env.FRONTEND_BASE_URL}/verify-email/${unHashedToken}`
  );

  await sendMail({
    email,
    subject: "Verify your email!",
    mailgenContent: mailContent,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "User created successfully. Please verify your email.",
        { email }
      )
    );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) throw new ApiError(400, "Token is required!");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await db.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new ApiError(400, "Token is invalid or expired!");
  if (user.isEmailVerified)
    throw new ApiError(400, "Email is already verified");

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  const { accessToken, refreshToken } =
    generateJWTTokens.generateAccessAndRefreshTokenAndSetCookie(
      updatedUser,
      res
    );

  const verifiedUser = await db.user.update({
    where: { id: user.id },
    data: { refreshToken },
    select: {
      id: true,
      fullname: true,
      email: true,
      isEmailVerified: true,
      role: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Email verified successfully!", {
      user: verifiedUser,
      accessToken,
      refreshToken,
    })
  );
});

export const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "User doesn't exist!");

  if (user.isGoogleAuth) {
    throw new ApiError(400, "Please login using Google authentication.");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(401, "Email is not verified!");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    generateJWTTokens.generateAccessAndRefreshTokenAndSetCookie(user, res);

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: { 
      refreshToken,
      lastLoginAt: new Date()
    },
    select: {
      id: true,
      fullname: true,
      email: true,
      isEmailVerified: true,
      role: true,
      profileImage: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "User signed in successfully", {
      user: updatedUser,
      accessToken
    }));
});

export const signOut = asyncHandler(async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  await db.user.update({
    where: { id: user.id },
    data: { refreshToken: null },
  });

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json(new ApiResponse(200, "Logout successfully"));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!refreshTokenFromCookie) {
    throw new ApiError(404, "No refresh token - Unauthorized");
  }

  try {
    const decoded = jwt.verify(
      refreshTokenFromCookie,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    if (refreshTokenFromCookie !== user.refreshToken) {
      throw new ApiError(401, "Refresh token mismatch - Unauthorized");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      generateJWTTokens.generateAccessAndRefreshTokenAndSetCookie(user, res);

    await db.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.status(200).json(
      new ApiResponse(200, "Token refreshed successfully", {
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
  } catch (err) {
    throw new ApiError(403, "Invalid refresh token.");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(404, "User doesn't exist!");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(400, "Email is not verified!");
  }

  const { hashedToken, unHashedToken, tokenExpiry } = generateTemporaryToken();

  await db.user.update({
    where: { id: user.id },
    data: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: tokenExpiry,
    },
  });

  const mailContent = await forgotPasswordMailGenContent(
    user.fullname,
    `${process.env.FRONTEND_BASE_URL}/reset-password/${unHashedToken}`
  );

  await sendMail({
    email,
    subject: "Reset your password!",
    mailgenContent: mailContent,
  });

  res.status(200).json(new ApiResponse(200, "Password reset email sent."));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await db.user.findFirst({
    where: { forgotPasswordToken: hashedToken },
  });

  if (!user) {
    throw new ApiError(404, "Invalid or expired token.");
  }

  if (user.forgotPasswordExpiry < new Date()) {
    throw new ApiError(400, "Token expired. Please request a new one.");
  }

  const hashedPassword = await hashPassword(password);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordExpiry: null,
      passwordChangedAt: new Date(),
    },
  });

  res.status(200).json(new ApiResponse(200, "Password updated successfully."));
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords are required.");
  }

  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect.");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(400, "New password must be different from the old one.");
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Password changed successfully."
      )
    );
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Invalid Google ID token");
  }

  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_AUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name: fullname, picture } = payload;

    if (!email) {
      throw new ApiError(400, "Google authentication failed - no email found");
    }

    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser && !existingUser.isGoogleAuth) {
      throw new ApiError(400, "Email already registered with password authentication");
    }

    if (!existingUser) {
      const newUser = await db.user.create({
        data: {
          email,
          fullname,
          profileImage: picture,
          isEmailVerified: true,
          isGoogleAuth: true,
        },
      });
      
      const { accessToken, refreshToken } = generateJWTTokens.generateAccessAndRefreshTokenAndSetCookie(newUser, res);

      await db.user.update({
        where: { id: newUser.id },
        data: { refreshToken }
      });

      return res.status(200).json(
        new ApiResponse(200, "Registration successful", {
          user: {
            id: newUser.id,
            email: newUser.email,
            fullname: newUser.fullname,
            profileImage: newUser.profileImage,
            isEmailVerified: newUser.isEmailVerified,
            role: newUser.role,
          },
          accessToken,
        })
      );
    }

    const { accessToken, refreshToken } = generateJWTTokens.generateAccessAndRefreshTokenAndSetCookie(existingUser, res);
    
    await db.user.update({
      where: { id: existingUser.id },
      data: { 
        refreshToken,
        lastLoginAt: new Date()
      }
    });

    return res.status(200).json(
      new ApiResponse(200, "Login successful", {
        user: {
          id: existingUser.id,
          email: existingUser.email,
          fullname: existingUser.fullname,
          profileImage: existingUser.profileImage,
          isEmailVerified: existingUser.isEmailVerified,
          role: existingUser.role,
        },
        accessToken,
      })
    );
  } catch (error) {
    logger.error("Google auth error:", error);
    throw new ApiError(500, "Google authentication failed");
  }
});
