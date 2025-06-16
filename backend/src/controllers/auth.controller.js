import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken"; 
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
import { changePasswordSchema, forgotPasswordSchema, googleAuthSchema, resetPasswordSchema, signInSchema, signUpSchema } from "../schemas/auth.schema.js";

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const generateAndSetTokens = (user, res) => {
  const { accessToken, refreshToken } =
    generateJWTTokens.generateAccessAndRefreshTokenAndSetCookie(user, res);
  return { accessToken, refreshToken };
};

export const signUp = asyncHandler(async (req, res) => {
  // Validate request body against schema
  const { fullname, email, password } = signUpSchema.parse(req.body);

  // Check if user already exists
  let user = await db.user.findUnique({ where: { email } });

  if (user) {
    if (user.isEmailVerified) {
      throw new ApiError(400, "User with this email already exists.");
    }
    // If user exists but email is not verified, and the token is not expired,
    // prevent new registration and ask to verify existing email.
    const isTokenExpired =
      new Date(user.emailVerificationExpiry).getTime() < Date.now();

    if (!isTokenExpired) {
      throw new ApiError(
        400,
        "Email not verified. Please verify your email with the link sent earlier."
      );
    }
    // If token is expired, update the existing user's details and resend verification
    const { hashedToken, unHashedToken, tokenExpiry } = generateTemporaryToken();
    const hashedPassword = await hashPassword(password);

    user = await db.user.update({
      where: { email },
      data: {
        fullname,
        password: hashedPassword,
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: tokenExpiry,
        lastVerificationEmailSentAt: new Date(),
      },
    });

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
      .status(200) // Changed to 200 as it's an update/resend scenario
      .json(
        new ApiResponse(
          200,
          "User account updated. Please verify your email with the new link.",
          { email }
        )
      );
  }

  // Create a new user if no existing unverified user is found or if token was expired
  const { hashedToken, unHashedToken, tokenExpiry } = generateTemporaryToken();
  const hashedPassword = await hashPassword(password);

  const newUser = await db.user.create({
    data: {
      fullname,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
      lastVerificationEmailSentAt: new Date(), 
    },
  });

  if (!newUser) {
    throw new ApiError(500, "Error while creating new user.");
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

  // 1. Token Validation: Basic check for token presence
  if (!token) {
    throw new ApiError(400, "Verification token is required.");
  }

  // 2. Hash the incoming token for comparison with stored hashed token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // 3. Find the user with the matching token and ensure it's not expired
  let user = await db.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { gt: new Date() }, 
    },
  });

  // 4. Handle cases where no user is found or token is invalid/expired
  if (!user) {
    throw new ApiError(400, "Verification link is invalid or has expired. Please request a new one.");
  }

  // 5. Prevent re-verification if email is already verified
  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified. You can now log in.");
  }

  // 6. Update user's verification status and clear verification tokens
  const { accessToken, refreshToken } = generateAndSetTokens(user, res); // Generate new tokens and set cookies

  // 7. Perform a single database update for user status and refresh token
  const verifiedUser = await db.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      refreshToken: refreshToken, // Update the user's refresh token in DB
    },
    select: {
      // Select only necessary fields for the response
      id: true,
      fullname: true,
      email: true,
      isEmailVerified: true,
      role: true,
      profileImage: true,
      lastLoginAt: true, 
    },
  });

  // 8. Send success response with user data and access token
  return res.status(200).json(
    new ApiResponse(200, "Email verified successfully! You are now logged in.", {
      user: verifiedUser,
      accessToken,
    })
  );
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "User not found.");

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified.");
  }

  // Rate limiting logic: Prevent sending multiple emails too quickly
  const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
  if (
    user.lastVerificationEmailSentAt &&
    Date.now() - new Date(user.lastVerificationEmailSentAt).getTime() < twoMinutes
  ) {
    const timeLeft = Math.ceil(
      (twoMinutes - (Date.now() - new Date(user.lastVerificationEmailSentAt).getTime())) / 1000
    );
    throw new ApiError(429, `Please wait ${timeLeft} seconds before requesting another email.`);
  }

  // Generate new token and send email
  const { hashedToken, unHashedToken, tokenExpiry } = generateTemporaryToken();

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
      lastVerificationEmailSentAt: new Date(), // Update last sent time
    },
  });

  const mailContent = await verificationMailGenContent(
    user.fullname,
    `${process.env.FRONTEND_BASE_URL}/verify-email/${unHashedToken}`
  );

  await sendMail({
    email,
    subject: "Verify your email!",
    mailgenContent: mailContent,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Verification email sent successfully!"));
});

export const signIn = asyncHandler(async (req, res) => {
  const { email, password } = signInSchema.parse(req.body);

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "Invalid credentials."); 

  if (user.isGoogleAuth) {
    throw new ApiError(400, "Please log in using Google authentication.");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(401, "Email is not verified. Please check your inbox or resend verification.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials.");
  }

  const { accessToken, refreshToken } = generateAndSetTokens(user, res);

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      lastLoginAt: new Date(),
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

  return res.status(200).json(
    new ApiResponse(200, "User signed in successfully", {
      user: updatedUser,
      accessToken,
    })
  );
});

export const signOut = asyncHandler(async (req, res) => {
  // Assuming req.userId is set by an auth middleware
  const userId = req.userId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User ID not found in request.");
  }

  await db.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });

  // Clear cookies (ensure these are configured with httpOnly for security)
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax", // Or "Strict" depending on your needs
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });

  res.status(200).json(new ApiResponse(200, "Logout successful."));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!refreshTokenFromCookie) {
    throw new ApiError(401, "Unauthorized: No refresh token provided.");
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
      throw new ApiError(401, "Unauthorized: Invalid refresh token (user not found).");
    }

    if (refreshTokenFromCookie !== user.refreshToken) {
      // Rotate token or revoke all tokens if mismatch indicates potential token theft
      logger.warn(`Refresh token mismatch for user ${user.id}. Possible token reuse attack.`);
      // Consider revoking user's all tokens for better security
      await db.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw new ApiError(401, "Unauthorized: Refresh token compromised. Please log in again.");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      generateAndSetTokens(user, res);

    await db.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.status(200).json(
      new ApiResponse(200, "Tokens refreshed successfully.", {
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
  } catch (err) {
    logger.error("Error refreshing token:", err);
    // Be generic for security reasons
    throw new ApiError(403, "Unauthorized: Invalid or expired refresh token. Please log in again.");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    // Respond generically to avoid leaking information about existing emails
    return res.status(200).json(new ApiResponse(200, "If an account with that email exists, a password reset link has been sent."));
  }

  if (!user.isEmailVerified) {
    throw new ApiError(400, "Email is not verified. Please verify your email first.");
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
  const { password } = resetPasswordSchema.parse(req.body); 
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Password reset token is required.");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await db.user.findFirst({
    where: { forgotPasswordToken: hashedToken },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token.");
  }

  // Check token expiry specifically for forgot password
  if (user.forgotPasswordExpiry < new Date()) {
    throw new ApiError(400, "Password reset token has expired. Please request a new one.");
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

  const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User ID not found in request.");
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

  res.status(200).json(new ApiResponse(200, "Password changed successfully."));
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { token } = googleAuthSchema.parse(req.body);

  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_AUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name: fullname, picture } = payload;

    if (!email) {
      throw new ApiError(400, "Google authentication failed: No email found in token.");
    }

    let existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
      if (!existingUser.isGoogleAuth) {
        throw new ApiError(
          400,
          "Email already registered with password authentication. Please use password to login."
        );
      }
      // User exists and is registered with Google, proceed to login
      const { accessToken, refreshToken } = generateAndSetTokens(existingUser, res);

      await db.user.update({
        where: { id: existingUser.id },
        data: {
          refreshToken,
          lastLoginAt: new Date(),
          profileImage: picture || existingUser.profileImage, // Update profile image if new one exists
        },
      });

      return res.status(200).json(
        new ApiResponse(200, "Login successful with Google.", {
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
    } else {
      // New user via Google, create an account
      const newUser = await db.user.create({
        data: {
          email,
          fullname,
          profileImage: picture,
          isEmailVerified: true, // Google verifies email automatically
          isGoogleAuth: true,
          lastLoginAt: new Date(),
        },
      });

      const { accessToken, refreshToken } = generateAndSetTokens(newUser, res);

      await db.user.update({
        where: { id: newUser.id },
        data: { refreshToken },
      });

      return res.status(200).json(
        new ApiResponse(200, "Registration successful with Google.", {
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
  } catch (error) {
    logger.error("Google authentication error:", error);
    throw new ApiError(500, "Google authentication failed. Please try again.");
  }
});
