import express from "express";
import {
  changePassword,
  forgotPassword,
  googleAuth,
  refreshToken,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { limiter } from "../middlewares/rateLimit.middleware.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const authRoutes = express.Router();

authRoutes.post("/sign-up", limiter, signUp);

authRoutes.get("/verify-email/:token", limiter, verifyEmail);

authRoutes.post("/sign-in", limiter, signIn);

authRoutes.post("/sign-out", isAuthenticated, signOut);

authRoutes.post("/forgot-password", limiter, forgotPassword);

authRoutes.post("/reset-password/:token", limiter, resetPassword);

authRoutes.put("/change-password", isAuthenticated, changePassword);

authRoutes.post("/google-login", limiter, googleAuth);

authRoutes.post("/refresh-token", limiter, refreshToken);

export default authRoutes;
