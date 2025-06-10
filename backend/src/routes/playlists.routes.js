import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  addProblemInPlaylist,
  createPlaylist,
  deletePlaylist,
  getAllPlaylists,
  getPlaylistById,
  removeProblemFromPlaylist,
  updatePlaylist,
} from "../controllers/playlists.controller.js";

const playlistRoutes = express.Router();

playlistRoutes.post("/create", isAuthenticated, createPlaylist);

playlistRoutes.put("/:playlistId", isAuthenticated, updatePlaylist);
playlistRoutes.delete("/:playlistId", isAuthenticated, deletePlaylist);

playlistRoutes.get("/", isAuthenticated, getAllPlaylists);
playlistRoutes.get("/:playlistId", isAuthenticated, getPlaylistById);

playlistRoutes.post("/:playlistId/problems", isAuthenticated, addProblemInPlaylist);
playlistRoutes.delete("/:playlistId/problems", isAuthenticated, removeProblemFromPlaylist);


export default playlistRoutes;
