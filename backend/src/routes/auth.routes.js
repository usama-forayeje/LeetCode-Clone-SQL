import express from "express";
import { profile, signIn, signOut, signUp, verify } from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const authRoutes = express.Router()

authRoutes.post("/signUp", signUp)

authRoutes.get("/verify", verify)

authRoutes.post("/signIn", signIn)

authRoutes.post("/signOut",verifyJWT, signOut)

authRoutes.get("/profile",verifyJWT, profile)

export default authRoutes