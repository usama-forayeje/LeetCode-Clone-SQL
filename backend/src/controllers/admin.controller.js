import { db } from "../../config/db.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";

export const getUsersCountHandler = asyncHandler(async (req, res) => {
  const count = await db.user.count({});
  res
    .status(200)
    .json(new ApiResponse(200, "users count fetched successfully", { count }));
});

export const getProblemsCountHandler = asyncHandler(async (req, res) => {
  const count = await db.problem.count({});
  res
    .status(200)
    .json(
      new ApiResponse(200, "problems count fetched successfully", { count })
    );
});

export const getPlaylistsCountHandler = asyncHandler(async (req, res) => {
  const count = await db.playlist.count({});
  res
    .status(200)
    .json(
      new ApiResponse(200, "Playlists count fetched successfully", { count })
    );
});

export const getSubmissionsCountHandler = asyncHandler(async (req, res) => {
  const count = await db.submission.count({});
  res.status(200).json(
    new ApiResponse(200, "Submissions count fetched successfully", {
      count,
    })
  );
});

export const getUsersHandler = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const users = await db.user.findMany({
    omit: {
      password: true,
      emailVerificationToken: true,
      emailVerificationExpiry: true,
      forgotPasswordToken: true,
      forgotPasswordExpiry: true,
      refreshToken: true,
    },
    include: {
      solvedProblems: {
        where: {
          userId: userId,
        },
      },
      submissions: {
        where: {
          userId: userId,
        },
      },
      playlists: {
        where: {
          userId: userId,
        },
      },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Users fetched successfully", { users }));
});

export const deleteUserHandler = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "UserId is required");
  }

  await db.user.delete({
    where: {
      id: userId,
    },
  });

  res.status(200).json(new ApiResponse(200, "User deleted successfully"));
});

export const getPlaylistsHandler = asyncHandler(async (req, res) => {
  const playlists = await db.playlist.findMany({
    where: {},
    include: {
      problems: {
        include: {
          problem: {
            select: {
              title: true,
              id: true,
              difficulty: true,
              userId: true,
              isDemo: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          fullname: true,
          email: true,
          profileImage: true,
          role: true,
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

export const deletePlaylistHandler = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  await db.playlist.delete({
    where: {
      id: playlistId,
    },
  });

  res.status(200).json(new ApiResponse(200, "Playlist deleted successfully"));
});

export const getSubmissionsHandler = asyncHandler(async (req, res) => {
  const submissions = await db.submission.findMany({
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          tags: true,
          isDemo: true,
          company: true,
        },
      },
      user: {
        select: {
          id: true,
          fullname: true,
          email: true,
          profileImage: true,
          role: true,
        },
      },
    },
  });

  res.status(200).json(
    new ApiResponse(200, "Submissions fetched successfully", {
      submissions,
    })
  );
});

export const deleteSubmissionHandler = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  if (!submissionId) {
    throw new ApiError(200, "Submission id is required");
  }

  await db.submission.delete({
    where: {
      id: submissionId,
    },
  });

  res.status(200).json(new ApiResponse(200, "Submission deleted successfully"));
});
