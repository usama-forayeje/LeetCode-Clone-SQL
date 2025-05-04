import { db } from "../../config/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import {
  getLanguageName,
  pollBatchResults,
  submitBatch,
} from "../utils/judge0.js";

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

  let allPassed = true;
  const detailsResults = results.map((result, index) => {
    const stdout = result.stdout?.trim();
    const expected = expected_outputs[index]?.trim();
    const passed = stdout === expected;

    if (!passed) allPassed = false;

    return {
      testCase: index + 1,
      passed,
      stdin,
      stdout,
      expected,
      stderr: result.stderr || null,
      compile_output: result.compile_output || null,
      status: result.status,
      memory: result.memory ? `${result.memory} KB` : undefined,
      time: result.time ? `${result.time} s` : undefined,
      allPassed,
    };
  });

  const submission = await db.submission.create({
    data: {
      userId,
      problemId,
      sourceCode: source_code,
      language: getLanguageName(language_id),
      stdin: stdin.join("\n"),
      stdout: JSON.stringify(detailsResults.map((r) => r.stdout)),
      stderr: detailsResults.some((r) => r.stderr)
        ? JSON.stringify(detailsResults.map((r) => r.stderr))
        : null,
      compileOutput: detailsResults.some((r) => r.compile_output)
        ? JSON.stringify(detailsResults.map((r) => r.compile_output))
        : null,
      status: allPassed ? "Accepted" : "Wrong Anser",
      memory: detailsResults.some((r) => r.memory)
        ? JSON.stringify(detailsResults.map((r) => r.memory))
        : null,
      time: detailsResults.some((r) => r.time)
        ? JSON.stringify(detailsResults.map((r) => r.time))
        : null,
    },
  });

  if (allPassed) {
    await db.problemSolved.upsert({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      update: {},
      create: {
        userId,
        problemId,
      },
    });
  }

  const testCaseResults = detailsResults.map((result) => ({
    submissionId: submission.id,
    testCase: result.testCase,
    passed: result.passed,
    stdout: result.stdout,
    expected: result.expected,
    stderr: result.stderr,
    compileOutput: result.compile_output,
    status: result.status?.description ?? "Unknown",
    memory: result.memory,
    time: result.time,
  }));

  console.log(testCaseResults);

  await db.testCaseResult.createMany({
    data: testCaseResults,
  });

  const submissionWithTestCase = await db.submission.findUnique({
    where: {
      id: submission.id,
    },
    include: {
      testCases: true,
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Code execution successfully",
        submissionWithTestCase
      )
    );
});
