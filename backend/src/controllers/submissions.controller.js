import { db } from "../../config/db.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";

export const getAllSubmissions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const submission = await db.submission
    .findMany({
      where: {
        userId: userId,
      },
    })
    .catch((err) => {
      logger.error(err);
      return res
        .status(500)
        .json(
          new ApiError(500, "An error occurred while fetching submissions")
        );
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

  if (submission.length === 0) {
    return res
      .status(404)
      .json(new ApiError(404, "No submissions found for this problem"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Submissions fetched successfully", submission));
});

export const getSubmissionById = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const userId = req.userId;

  const submission = await db.submission.findUnique({
    where: {
      id: submissionId,
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          testcases: true,
        },
      },
      testCases: true,
    },
  });

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Submission fetched!", { submission }));
});

export const getAllTheSubmissionsCountForProblem = asyncHandler(async (req, res) => {
  const problemId = req.params.problemId;
  const submission = await db.submission.count({
    where: {
      problemId: problemId,
    },
  });

  if (submission === 0) {
    return res
      .status(404)
      .json(new ApiError(404, "No submissions found for this problem"));
  }

  res.status(200).json(
    new ApiResponse(200, "Submissions fetched successfully", {
      count: submission,
    })
  );
});

export const getAllSubmissionCount = asyncHandler(async (req, res) => {
  const submissionsCount = await db.submission.count({
    where: {
      userId: req.userId,
    },
  });

  res.status(200).json(
    new ApiResponse(200, "Submissions count fetched", {
      count: submissionsCount,
    })
  );
});
