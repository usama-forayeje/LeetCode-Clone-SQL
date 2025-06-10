import { db } from "../../config/db.js";
import asyncHandler from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-errors.js";

export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const newPlaylist = await db.playlist.create({
    data: {
      name,
      description,
      userId: req.user.id,
    },
  });

  if (!newPlaylist) {
    throw new ApiError(403, "Failed to create playlist");
  }

  res.status(201).json(
    new ApiResponse(201, "Playlist created successfully", {
      playlist: newPlaylist,
    })
  );
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  const existing = await db.playlist.findFirst({
    where: { id: playlistId, userId: req.user.id },
  });

  if (!existing) {
    throw new ApiError(404, "Playlist not found or access denied");
  }

  const updatedPlaylist = await db.playlist.update({
    where: { id: playlistId },
    data: {
      name,
      description: description || null,
    },
  });

  res.status(200).json(
    new ApiResponse(200, "Playlist updated successfully", {
      playlist: updatedPlaylist,
    })
  );
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  const exists = await db.playlist.findFirst({
    where: { id: playlistId, userId: req.user.id },
  });

  if (!exists) {
    throw new ApiError(404, "Playlist not found");
  }

  await db.playlist.delete({
    where: { id: playlistId },
  });

  res.status(200).json(new ApiResponse(200, "Playlist delete successfully"));
});

export const getAllPlaylists = asyncHandler(async (req, res) => {
  const playlists = await db.playlist.findMany({
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
    .json(
      new ApiResponse(200, "Playlists fetched successfully", { playlists })
    );
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }
  const playlist = await db.playlist.findFirst({
    where: {
      id: playlistId,
      userId: req.user.id,
    },
    include: {
      problems: {
        include: {
          problem: {
            include: {
              solvedBy: true,
            },
          },
        },
      },
    },
  });

  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Playlists fetched successfully", { playlist }));
});

export const addProblemInPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { problemIds } = req.body;
  if (!Array.isArray(problemIds) || problemIds.length == 0) {
    throw new ApiError(400, "problemIds are required and cannot be empty");
  }
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  const problems = await db.problem.findMany({
    where: {
      id: {
        in: problemIds,
      },
    },
  });

  if (!problems || problems.length == 0) {
    throw new ApiError(404, "No valid problems found with the provided IDs");
  }

  const problemsInPlaylist = await db.problemInPlaylist.createMany({
    data: problemIds.map((id) => ({
      playlistId,
      problemId: id,
    })),
    skipDuplicates: true,
  });

  if (!problemsInPlaylist) {
    throw new ApiError(500, "Failed to add problems to the playlist");
  }

  res.status(200).json(
    new ApiResponse(200, "Problems added to playlist successfully", {
      addedCount: problemsInPlaylist.count,
    })
  );
});

export const removeProblemFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { problemIds } = req.body;
  if (!Array.isArray(problemIds) || problemIds.length == 0) {
    throw new ApiError(400, "problemIds are required and cannot be empty");
  }
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  const problems = await db.problem.findMany({
    where: {
      id: {
        in: problemIds,
      },
    },
  });

  if (!problems || problems.length == 0) {
    throw new ApiError(404, "No valid problems found with the provided IDs");
  }

  const problemsInPlaylistExist = await db.problemInPlaylist.findMany({
    where: {
      playlistId: playlistId,
      problemId: {
        in: problemIds,
      },
    },
  });

  if (!problemsInPlaylistExist || problemsInPlaylistExist.length === 0) {
    throw new ApiError(404, "No matching problems found in the playlist");
  }

  await db.problemInPlaylist.deleteMany({
    where: {
      playlistId: playlistId,
      problemId: {
        in: problemIds,
      },
    },
  });

  res.status(200).json(new ApiResponse(200, "Problem removed successfully"));
});
