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
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/api-response.js";
import { generateJWTTokens, generateTemporaryToken } from "../utils/token.js";
import { hashPassword } from "../utils/hash.js";
import { oauth2Client } from "../constants/OAuth.js";

export const signUp = asyncHandler(async (req, res) => {
  // 1. Extract fullname, email, and password from the request body
  // 2. Check if a user with the given email already exists
  // 3. If user exists and email is already verified, prevent registration
  // 4. If user exists but hasn't verified email and token is still valid, block registration
  // Token expired, overwrite old user record with new verification token and password
  // 5. Generate a temporary verification token (hashed and unhashed) and its expiry time
  // 6. Hash the user's password before saving to the database
  // 7. Create the new user in the database with verification info
  // 8. If user creation fails, throw an error
  // 9. Send a verification email with the unHashedToken link
  // 10. Return a success response asking the user to verify their email
  const { fullname, email, password } = req.body;

  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser && existingUser.isEmailVerified) {
    throw new ApiError(400, "User with this email or username already exists");
  }

  if (existingUser && !existingUser.isEmailVerified) {
    const isTokenExpired =
      new Date(existingUser.emailVerificationExpiry).getTime() < Date.now();

    if (!isTokenExpired) {
      throw new ApiError(400, "Email not verified. Please verify your email.");
    }

    await db.user.delete({ where: { email } }); // Clean up old user record
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
    throw new ApiError(401, "Error - while creating new user");
  }

  const mailContent = await verificationMailGenContent(
    fullname,
    `${process.env.BACKEND_BASE_URL}/api/v1/auth/verify-email/${unHashedToken}`
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
        "User created successfully. Please verify your email."
      )
    );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  // 1. Hash token
  // 2. Find user with valid token & not expired
  // 3. Verify email & clear token
  // 4. Issue access & refresh tokens and set cookies
  // 5. Save refresh token & return safe user info
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
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Email Verified Successfully!", {
      user: verifiedUser,
      accessToken,
      refreshToken,
    })
  );
});

export const signIn = asyncHandler(async (req, res) => {
  // 1. User exists check
  // 2. If registered via Google
  // 3. Email not verified
  // 4. Password check
  // 5. Generate JWT tokens + set cookies
  // 6. Save refreshToken to DB & only select non-sensitive fields
  // 7. Final response

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
    data: { refreshToken },
    select: {
      id: true,
      fullname: true,
      email: true,
      isEmailVerified: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "User signed in successfully", updatedUser));
});

export const signOut = asyncHandler(async (req, res) => {
  // 1. Find user by ID from token
  // 2. Remove refresh token from DB
  // 3. Clear auth cookies
  // 4. Send response
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
  // 1. Get the refresh token from cookies or Authorization header
  // 2. Verify the refresh token using JWT secret
  // 3. Find the user by decoded token ID
  // 4. Compare token in DB with token from cookie to avoid token mismatch
  // 5. Generate new access & refresh tokens and set them in cookies
  // 6. Save the new refresh token in the database
  // 7. Send new tokens back to the client
  const refreshTokenFromCookie =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!refreshTokenFromCookie) {
    throw new ApiError(404, "No Refresh token - Unauthorized");
  }

  try {
    const decoded = jwt.verify(
      refreshTokenFromCookie,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await db.user.findUnique({
      where: { id: decoded.id }, // NOTE: Make sure your token contains `id`
    });

    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    if (refreshTokenFromCookie !== user.refreshToken) {
      throw new ApiError(401, "Refresh token mismatch - Unauthorized");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      generateJWTTokens.generateAccessAndRefreshTokenAndSetCookie(user, res);

    const setRefreshToken = await db.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    if (!setRefreshToken) {
      throw new ApiError(404, "Error - setting refreshed token in DB");
    }

    res.status(200).json(
      new ApiResponse(200, "Token Refreshed successfully", {
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
  } catch (err) {
    throw new ApiError(403, "⛔ Invalid refresh token.");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  // 1. Extract email from request body
  // 2. Find user by email
  // 3. If user not found
  // 4. If email is not verified
  // 5. If a valid reset token already exists
  // 6. Generate token and expiry
  // 7. Save reset token in DB
  // 8. Send password reset email
  // 9. Respond success
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

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: tokenExpiry,
    },
  });

  if (!updatedUser) {
    throw new ApiError(500, "Failed to generate reset token");
  }

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
  // 1. Extract new password and token from request
  // 2. Hash the token
  // 3. Find user by reset token
  // 4. Check if token is expired
  // 5. Hash the new password
  // 6. Update user's password and clear token
  // 7. Respond success
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

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordExpiry: null,
    },
  });

  if (!updatedUser) {
    throw new ApiError(500, "Failed to reset password.");
  }

  res.status(200).json(new ApiResponse(200, "Password updated successfully."));
});

export const changePassword = asyncHandler(async (req, res) => {
  // 1. Extract userId from authenticated user
  // 2. Extract old and new passwords from request body
  // 3. Find user by ID
  // 4. Verify old password matches stored hash
  // 5. Prevent using the same password as before
  // 6. Hash the new password
  // 7. Update password and update passwordChangedAt timestamp in DB
  // 8. Send success response
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
        "Password changed successfully. Please log in again."
      )
    );
});


export const googleAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;

  // 1. Validate input
  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Invalid Google ID token");
  }

  try {
    // 3. Verify ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_AUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name: fullname, picture } = payload;

    if (!email) {
      throw new ApiError(400, "Google authentication failed - no email found");
    }

    // 4. Check existing user
    const existingUser = await db.user.findUnique({ where: { email } });

    // 5. Handle new users
    if (!existingUser) {
      // Create new user
      const newUser = await db.user.create({
        data: {
          email,
          fullname,
          profileImage: picture,
          isEmailVerified: true,
          isGoogleAuth: true,
        },
      });
      const { accessToken, refreshToken } =
        generateJWTTokens.generateAccessAndRefreshTokenAndSetCookie(
          newUser,
          res
        );

      return res.status(200).json(
        new ApiResponse(200, "Registration successful", {
          user: {
            email: newUser.email,
            fullname: newUser.fullname,
            profileImage: newUser.profileImage,
            isEmailVerified: newUser.isEmailVerified,
          },
          accessToken,
        })
      );
    }
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Google authentication failed");
  }
});
