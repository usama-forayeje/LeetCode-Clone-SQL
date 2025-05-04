import express from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import {
  addProblemToPlaylist,
  createPlaylist,
  deletePlaylist,
  getAllPlaylist,
  getPlaylistDetails,
  removeProblemFromPlaylist,
} from "../controllers/playlists.controller.js";

const playlistRoutes = express.Router();

playlistRoutes.get("/", verifyJWT, getAllPlaylist);

playlistRoutes.get("/:playlistId", verifyJWT, getPlaylistDetails);

playlistRoutes.post("/crate-playlist", verifyJWT, createPlaylist);

playlistRoutes.post(
  "/:playlistId/add-problem",
  verifyJWT,
  addProblemToPlaylist
);

playlistRoutes.delete("/:playlistId", verifyJWT, deletePlaylist);

playlistRoutes.delete(
  "/remove-problem/:playlistId",
  verifyJWT,
  removeProblemFromPlaylist
);

export default playlistRoutes;
