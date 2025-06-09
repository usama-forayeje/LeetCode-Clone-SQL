import express from "express";
import {
  deletePlaylistHandler,
  deleteSubmissionHandler,
  deleteUserHandler,
  getPlaylistsCountHandler,
  getPlaylistsHandler,
  getProblemsCountHandler,
  getSubmissionsCountHandler,
  getSubmissionsHandler,
  getUsersCountHandler,
  getUsersHandler,
} from "../controllers/admin.controller.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const adminRoutes = express.Router();

adminRoutes.get("/users/count", isAuthenticated, isAdmin, getUsersCountHandler);

adminRoutes.get(
  "/problems/count",
  isAuthenticated,
  isAdmin,
  getProblemsCountHandler
);

adminRoutes.get(
  "/playlists/count",
  isAuthenticated,
  isAdmin,
  getPlaylistsCountHandler
);

adminRoutes.get(
  "/submissions/count",
  isAuthenticated,
  isAdmin,
  getSubmissionsCountHandler
);

adminRoutes.get("/users", isAuthenticated, isAdmin, getUsersHandler);
adminRoutes.delete(
  "/user/:userId/delete",
  isAuthenticated,
  isAdmin,
  deleteUserHandler
);

adminRoutes.get("/playlists", isAuthenticated, isAdmin, getPlaylistsHandler);
adminRoutes.delete(
  "/playlist/:playlistId/delete",
  isAuthenticated,
  isAdmin,
  deletePlaylistHandler
);

adminRoutes.get(
  "/submissions",
  isAuthenticated,
  isAdmin,
  getSubmissionsHandler
);
adminRoutes.delete(
  "/submission/:submissionId/delete",
  isAuthenticated,
  isAdmin,
  deleteSubmissionHandler
);

export default adminRoutes;
