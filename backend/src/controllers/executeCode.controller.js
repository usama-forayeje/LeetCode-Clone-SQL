import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import { pollBatchResults, submitBatch } from "../utils/judge0.js";
import { logger } from "../utils/logger.js";

export const executeCode = asyncHandler(async (req, res) => {
  const { source_code, language_id, stdin, expected_outputs, problemId } =
    req.body;
  const userId = req.user.id;

  if (
    !Array.isArray(stdin) ||
    stdin.length === 0 ||
    !Array.isArray(expected_outputs) ||
    expected_outputs.length !== stdin.length
  ) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid or missing testCases"));
  }

  const submissions = stdin.map((input) => ({
    source_code,
    language_id,
    stdin: input,
  }));

  const submitResponse = await submitBatch(submissions);

  const tokens = submitResponse.map((res) => res.token);

  const results = await pollBatchResults(tokens);

  logger.success("Results---------", results);

  res.status(200).json(new ApiResponse(200, "Code execution successfully"));
});
