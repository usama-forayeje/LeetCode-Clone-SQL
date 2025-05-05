import { db } from "../../config/db.js";
import asyncHandler from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-errors.js";

// @desc    Create a new playlist
export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  const existing = await db.playlist.findFirst({
    where: { name, userId },
  });

  if (existing) {
    return res
      .status(409)
      .json(new ApiError(409, "You already have a playlist with this name"));
  }

  const playlist = await db.playlist.create({
    data: {
      name,
      description,
      userId,
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, "Playlist created successfully", playlist));
});

// @desc    Get all playlists for the logged-in user
export const getAllPlaylist = asyncHandler(async (req, res) => {
  const playlist = await db.playlist.findMany({
    where: {
      userId: req.user.id,
    },
    include: {
      problems: {
        include: {
          problem: true,
        },
      },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, "All playlists fetched successfully", playlist));
});

// @desc    Get a specific playlist by ID
export const getPlaylistDetails = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await db.playlist.findFirst({
    where: {
      id: playlistId,
      userId: req.user.id,
    },
    include: {
      problems: {
        include: {
          problem: true,
        },
      },
    },
  });

  if (!playlist) {
    return res.status(404).json(new ApiError(404, "Playlist not found"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Playlist details fetched successfully", playlist));
});

// @desc    Add problems to a playlist
export const addProblemToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { problemIds } = req.body;

  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid or missing problemIds"));
  }

  const playlistProblem = await db.playlistProblem.createMany({
    data: problemIds.map((problemId) => ({
      playlistId,
      problemId,
    })),
  });

  res
    .status(201)
    .json(new ApiResponse(201, "Problems added to playlist successfully", playlistProblem));
});

// @desc    Delete a playlist
export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await db.playlist.findFirst({
    where: {
      id: playlistId,
      userId: req.user.id,
    },
  });

  if (!playlist) {
    return res.status(404).json(new ApiError(404, "Playlist not found"));
  }

  const deleted = await db.playlist.delete({
    where: {
      id: playlistId,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Playlist deleted successfully", deleted));
});

// @desc    Remove problems from a playlist
export const removeProblemFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { problemIds } = req.body;

  if (!playlistId || !Array.isArray(problemIds) || problemIds.length === 0) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid playlistId or problemIds"));
  }

  const deleted = await db.playlistProblem.deleteMany({
    where: {
      playlistId,
      problemId: {
        in: problemIds,
      },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Problems removed from playlist successfully", deleted));
});

