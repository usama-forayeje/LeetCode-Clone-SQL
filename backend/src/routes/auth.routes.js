import express from "express";
import {
  changePassword,
  forgotPassword,
  profile,
  refreshToken,
  resetPassword,
  signIn,
  signOut,
  signUp,
  socialLogin,
  verify,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { limiter } from "../middlewares/rateLimit.middleware.js";

const authRoutes = express.Router();

authRoutes.post("/sign-up",limiter, signUp);

authRoutes.get("/verify", verify);

authRoutes.get("/verify-email/:verificationToken",limiter, verifyEmail);

authRoutes.post("/sign-in",limiter, signIn);

authRoutes.post("/sign-out", verifyJWT, signOut);

authRoutes.post("/forgot-password",limiter, forgotPassword);

authRoutes.post("/reset-password/:forgotPasswordToken",limiter, resetPassword);

authRoutes.put("/change-password", verifyJWT, changePassword);

authRoutes.post("/social-login",limiter, socialLogin);

authRoutes.post("/refresh-token",limiter, refreshToken);

authRoutes.get("/profile", verifyJWT, profile);

export default authRoutes;
