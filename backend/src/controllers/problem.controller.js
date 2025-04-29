import { db } from "../../config/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import {
  getJudge0LanguageId,
  pollBatchResults,
  submitBatch,
} from "../utils/judge0.js";
import { logger } from "../utils/logger.js";

export const createProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  // Only admin users are allowed to create problems
  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json(new ApiError(403, "You are not allowed to create a problem"));
  }

  // Validate all reference solutions before saving the problem
  for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
    const languageId = getJudge0LanguageId(language); // Get language ID for Judge0
    if (!languageId) {
      return res
        .status(400)
        .json(new ApiError(400, `Language ${language} is not supported.`));
    }

    // Prepare submissions for all testcases using the solution code
    const submissions = testcases.map(({ input, output }) => ({
      source_code: solutionCode,
      language_id: languageId,
      stdin: input,
      expected_output: output,
    }));

    // Submit all testcases batch-wise
    const submissionsResults = await submitBatch(submissions);

    // Extract tokens from submission results
    const tokens = submissionsResults.map((submission) => submission.token);

    // Poll Judge0 API to get results
    const results = await pollBatchResults(tokens);

    // Check if all testcases passed
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      logger.info("Result------", result);
      // If any testcase fails, return error
      if (result.status.id !== 3) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              `Testcase ${i + 1} failed for language ${language}`
            )
          );
      }
    }
  }

  // If all solutions pass, then create the problem
  const newProblem = await db.problem.create({
    data: {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testcases,
      codeSnippets,
      referenceSolutions,
      userId: req.user.id,
    },
  });

  // Respond with success
  return res
    .status(201)
    .json(new ApiResponse(201, "Problem Created Successfully", newProblem));
});

export const getAllProblems = asyncHandler(async (req, res) => {
  const problem = await db.problem.findMany();

  if (!problem) {
    return res.status(404).json(new ApiError(404, "No problem found"));
  }
  res
    .status(200)
    .json(new ApiResponse(200, "Problem fetched Successfully", problem));
});

export const getProblemsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const problem = await db.problem.findUnique({
    where: {
      id,
    },
  });

  if (!problem) {
    return res.status(404).json(new ApiError(404, "Problem not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Problem fetched Successfully", problem));
});

export const updateProblemsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  const problem = await db.problem.findUnique({
    where: {
      id,
    },
  });

  if (!problem) {
    return res.status(404).json(new ApiError(404, "This Problem is not found"));
  }

  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json(new ApiError(403, "You are not allowed to update this problem"));
  }

  const updatedProblem = await db.problem.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(difficulty && { difficulty }),
      ...(tags && { tags }),
      ...(examples && { examples }),
      ...(constraints && { constraints }),
      ...(testcases && { testcases }),
      ...(codeSnippets && { codeSnippets }),
      ...(referenceSolutions && { referenceSolutions }),
      userId: req.user.id,
    },
  });

  res.status(200).json({
    success: true,
    message: "Problem updated successfully",
    data: updatedProblem,
  });
});

export const deleteProblemsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const problem = await db.problem.findUnique({
    where: { id },
  });

  if (!problem) {
    return res.status(404).json(new ApiError(404, "Problem not found"));
  }

  await db.problem.delete({ where: { id } });

  res.status(200).json(new ApiResponse(200, "Problem Deleted Successfully"));
});

export const getAllSolvedProblemByUser = asyncHandler(async (req, res) => {});
