import asyncHandler from "../utils/async-handler.js";
import { db } from "../../config/db.js";
import { ApiError } from "../utils/api-errors.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  sendMail,
  forgotPasswordMailGenContent,
  verificationMailGenContent,
} from "../utils/mail.js";
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import { generateTokens } from "../utils/jwt.js";
import { ApiResponse } from "../utils/api-response.js";
import {
  generateEmailToken,
  generateResetToken,
} from "../constants/generateTemporaryToken.js";

export const signUp = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return res.status(400).json(new ApiError(400, "User already exists"));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: UserRole.USER,
    },
  });

  const emailToken = generateEmailToken(newUser);
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 দিন

  await db.user.update({
    where: { id: newUser.id },
    data: {
      emailToken,
      emailTokenExpiry: expiry,
    },
  });

  const verificationURL = `${process.env.BASE_URL}/verify-email/${emailToken}`;
  const mailContent = await verificationMailGenContent(
    newUser.name,
    verificationURL
  );

  await sendMail({
    email: newUser.email,
    subject: "Email Verification",
    mailgenContent: mailContent,
  });

  const { accessToken, refreshToken } = generateTokens(newUser);

  res.cookie("token", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });

  const { password: _, ...userWithoutPassword } = newUser;

  res
    .status(201)
    .json(
      new ApiResponse(201, "User created successfully", userWithoutPassword)
    );
});

export const verify = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    throw new ApiError(401, "Unauthorize user");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res
      .status(200)
      .json(new ApiResponse(200, "Token verified successfully", decoded));
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token.");
  }
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { emailToken } = req.params;

  const user = await db.user.findFirst({
    where: { emailToken: emailToken },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token.");
  }

  const currentDate = new Date();
  if (currentDate > user.emailTokenExpiry) {
    throw new ApiError(400, "Verification token has expired.");
  }

  const verifyUser = await db.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      emailToken: null,
      emailTokenExpiry: null,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully", verifyUser));
});

export const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(401).json(new ApiError(401, "User not found"));
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json(new ApiError(401, "Invalid credentials"));
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie("token", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });

  const { password: _, ...userWithoutPassword } = user;

  res
    .status(200)
    .json(
      new ApiResponse(200, "User signIn successfully", userWithoutPassword)
    );
});

export const signOut = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "User signed out successfully"));
});

export const profile = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(404, "User not found");
  }

  const { password: _, ...userWithoutPassword } = req.user;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "User profile fetched successfully",
        userWithoutPassword
      )
    );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie = req.cookies?.refreshToken;

  if (!refreshTokenFromCookie) {
    throw new ApiError(401, "⛔ No refresh token provided");
  }

  try {
    // Token verify
    const decoded = jwt.verify(
      refreshTokenFromCookie,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find user
    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.clearCookie("refreshToken");
      throw new ApiError(401, "⛔ User not found");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
    };

    res.cookie("token", accessToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    const { password: _, ...userWithoutPassword } = user;

    return res
      .status(200)
      .json(
        new ApiResponse(200, "✅ Access token refreshed successfully", userWithoutPassword)
      );
  } catch (err) {
    res.clearCookie("refreshToken");

    if (err.name === "TokenExpiredError") {
      throw new ApiError(403, "⛔ Refresh token expired. Please sign in again.");
    }

    throw new ApiError(403, "⛔ Invalid refresh token.");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found with this email.");
  }

  if (!user.isVerified) {
    throw new ApiError(401, "Email is not verified.");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = generateResetToken();

  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: tokenExpiry,
    },
  });

  const resetURL = `${process.env.BASE_URL}/reset-password/${unHashedToken}`;
  const mailContent = await forgotPasswordMailGenContent(user.name, resetURL);

  await sendMail({
    email: user.email,
    subject: "🔁 Reset Your Password",
    mailgenContent: mailContent,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset link sent to email."));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { forgotPasswordToken } = req.params;

  if (!forgotPasswordToken || !password) {
    throw new ApiError(400, "🔁 Reset token and new password are required.");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(forgotPasswordToken)
    .digest("hex");

  const user = await db.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: {
        gt: new Date(), // only valid tokens
      },
    },
  });

  if (!user) {
    throw new ApiError(400, "⛔ Invalid or expired reset token.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // 5️⃣ Update password and clear resetToken
  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "✅ Password has been reset successfully."));
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords are required.");
  }

  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(404, "❌ User not found.");
  }

  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordCorrect) {
    throw new ApiError(401, "⛔ Old password is incorrect.");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(
      400,
      "❌ New password cannot be the same as the old password."
    );
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "🔐 Password changed successfully. Please login again."
      )
    );
});

export const socialLogin = asyncHandler(async (req, res) => {
  const { email, name, image, provider } = req.body;

  if (!email || !name || !provider) {
    throw new ApiError(400, "Missing required social login fields");
  }

  let user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name,
        image: image || "", 
        provider,
        isVerified: true, 
      },
    });
  } else if (user.provider !== provider) {
    throw new ApiError(
      400,
      "This email is linked to a different social provider."
    );
  }

  const { accessToken, refreshToken } = generateTokens(user);

  user = await db.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      lastLoginAt: new Date(),
    },
  });

  res.cookie("token", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 1000 * 60 * 60 * 24 * 7, // ৭ দিন
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 1000 * 60 * 60 * 24 * 30, // ৩০ দিন
  });

  const { password: _, ...userWithoutPassword } = user;

  return res
    .status(200)
    .json(new ApiResponse(200, "Social login successful", userWithoutPassword));
});
