import asyncHandler from "../utils/async-handler.js";
import { db } from "../../config/db.js";
import { ApiError } from "../utils/api-errors.js";
import bcrypt from "bcryptjs";
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import { generateTokens } from "../utils/jwt.js";
import { ApiResponse } from "../utils/api-response.js";

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

  const { accessToken, refreshToken } = generateTokens(newUser);

  res.cookie("token", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
  });

  res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", newUser));
});

export const verify = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    throw new ApiError(401, "Unauthorize user");
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  return res.status(200).json(200, "Token verified successfully", decoded);
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

  res.status(200).json(new ApiResponse(200, "User signIn successfully", user));
});

export const signOut = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
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

  return res
    .status(200)
    .json(new ApiResponse(200, "User profile fetched successfully", req.user));
});
