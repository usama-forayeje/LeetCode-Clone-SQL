import express from "express";
import {
  changePassword,
  forgotPassword,
  googleAuth,
  refreshToken,
  resendVerificationEmail,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { limiter } from "../middlewares/rateLimit.middleware.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const authRoutes = express.Router();

// Public routes with rate limiting
authRoutes.post("/sign-up", limiter, signUp);
authRoutes.post("/sign-in", limiter, signIn); 
authRoutes.post("/verify-email/:token", limiter, verifyEmail); 
authRoutes.post("/resend-verification", limiter, resendVerificationEmail); 
authRoutes.post("/forgot-password", limiter, forgotPassword);
authRoutes.post("/reset-password/:token", limiter, resetPassword);
authRoutes.post("/google-login", limiter, googleAuth); 
authRoutes.post("/refresh-token", refreshToken);        

// Protected routes (require authentication)
authRoutes.post("/sign-out", isAuthenticated, signOut); 
authRoutes.patch("/password", isAuthenticated, changePassword);

export default authRoutes;
