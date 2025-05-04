import { db } from "../../config/db.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";

export const getAllSubmissions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const submission = await db.submission.findMany({
    where: {
      userId: userId,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Submissions fetched successfully", submission));
});

export const getSubmissionsForProblem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const problemId = req.params.problemId;
  const submission = await db.submission.findMany({
    where: {
      userId: userId,
      problemId: problemId,
    },
  });
  res
    .status(200)
    .json(new ApiResponse(200, "Submissions fetched successfully", submission));
});

export const getAllTheSubmissionsForProblem = asyncHandler(async (req, res) => {
  const problemId = req.params.problemId;
  const submission = await db.submission.count({
    where: {
      problemId: problemId,
    },
  });
  res
    .status(200)
    .json(new ApiResponse(200, "Submissions fetched successfully", {count: submission}));
});
