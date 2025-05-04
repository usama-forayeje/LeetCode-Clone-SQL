import express from "express";
import {
  profile,
  refreshToken,
  signIn,
  signOut,
  signUp,
  verify,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const authRoutes = express.Router();

authRoutes.post("/sign-up", signUp);

authRoutes.get("/verify", verify);

authRoutes.post("/sign-in", signIn);

authRoutes.post("/sign-out", verifyJWT, signOut);

authRoutes.post("/refresh-token", refreshToken);

authRoutes.get("/profile", verifyJWT, profile);

export default authRoutes;
