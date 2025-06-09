import express from "express";
import {
  getUser,
  updateBasicInfo,
  updateProfileImage,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { uploadImageWithMulter } from "../middlewares/multer.middleware.js";

const userRoute = express.Router();

userRoute.get("/me", isAuthenticated, getUser);
userRoute.patch(
  "/update/profile-image",
  isAuthenticated,
  uploadImageWithMulter("profileImage"),
  updateProfileImage
);
userRoute.patch("/update/basic/info", isAuthenticated, updateBasicInfo);

export default userRoute;
