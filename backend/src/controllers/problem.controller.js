import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import {
  getJudge0LanguageId,
  pollBatchResults,
  submitBatch,
} from "../utils/judge0.js";

// Create a new problem
export const createProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    example,
    constraints,
    hints,
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
    const languageId = await getJudge0LanguageId(language); // Get language ID for Judge0

    if (!languageId) {
      return res
        .status(400)
        .json(new ApiError(400, `Language ${language} is not supported.`));
    }

    // Prepare submissions for all testcases using the solution code
    const submissions = testcases.map(({ input, output }) => ({
      source_code: solutionCode,
      language_id: languageId, // Corrected typo: language_id
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
      example,
      constraints,
      testcases,
      codeSnippets,
      referenceSolutions,
      hints,
      userId: req.user.id,
    },
  });

  // Respond with success
  return res
    .status(201)
    .json(new ApiResponse(201, "Problem Created Successfully", newProblem));
});

export const getAllProblems = asyncHandler(async (req, res) => {});

export const getProblemsById = asyncHandler(async (req, res) => {});

export const updateProblemsById = asyncHandler(async (req, res) => {});

export const deleteProblemsById = asyncHandler(async (req, res) => {});

export const getAllSolvedProblemByUser = asyncHandler(async (req, res) => {});
