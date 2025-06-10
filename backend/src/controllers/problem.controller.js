import { db } from "../../config/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import {
  getJudge0LanguageId,
  pollBatchResults,
  submitBatch,
} from "../utils/judge0.js";

export const createProblem = asyncHandler(async (req, res) => {
  // Get all data
  // Check user admin or not
  // Go through each refrence solution for defferent language

  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    hints,
    editorial,
    testcases,
    codeSnippets,
    referenceSolutions,
    company,
    isDemo,
    sheetId,
    isPremium,
  } = req.body;

  console.log(req.body);

  const user = await db.user.findUnique({
    where: {
      id: req.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError(400, "Access denied");
  }

  for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
    const languageId = getJudge0LanguageId(language);

    if (!languageId) {
      throw new ApiError(400, `Language ${language} is not supported`);
    }

    console.log(`Language ${language} is Id ${languageId}`);

    const submissions = testcases.map(({ input, output }) => {
      return {
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      };
    });

    const submissionsResult = await submitBatch(submissions);

    const tokens = submissionsResult.map((res) => res.token);

    const results = await pollBatchResults(tokens);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log("Result ---------------- ", result);

      if (result.status.id !== 3) {
        throw new ApiError(
          400,
          `Testcase ${i + 1} failed for language ${language}`
        );
      }
    }
  }

  const newProblem = await db.problem.create({
    data: {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      hints,
      editorial,
      testcases,
      codeSnippets,
      referenceSolutions,
      userId: req.user.id,
      company,
      isDemo,
      isPremium,
    },
  });
  if (!newProblem)
    throw new ApiError(
      403,
      "New Problem creation failed: Unable to save problem to the database"
    );

  if (sheetId) {
    const sheetExists = await db.sheet.findUnique({
      where: { id: sheetId },
      select: { id: true },
    });

    if (!sheetExists) {
      throw new ApiError(404, "Sheet not found");
    }

    await db.sheetProblem.createMany({
      data: [
        {
          sheetId,
          problemId: newProblem.id,
        },
      ],
      skipDuplicates: true,
    });
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Problem Created successfully", { newProblem }));
});

export const updateProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    hints,
    editorial,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  const { id: problemId } = req.params;

  const problem = await db.problem.findUnique({
    where: {
      id: problemId,
    },
  });
  if (!problem) throw new ApiError(404, "Problem Not found");

  console.log("Testcases or ref Solution changed");

  for (const [language, solutionCode] of Object.entries(
    referenceSolutions || {}
  )) {
    const languageId = getJudge0LanguageId(language);

    if (!languageId) {
      throw new ApiError(400, `Language ${language} is not supported`);
    }

    console.log(`Language ${language} is Id ${languageId}`);

    const submissions = testcases.map(({ input, output }) => {
      return {
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      };
    });

    const submissionsResult = await submitBatch(submissions);

    const tokens = submissionsResult.map((res) => res.token);
    const results = await pollBatchResults(tokens);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status.id !== 3) {
        throw new ApiError(
          400,
          `Testcase ${i + 1} failed for language ${language}`
        );
      }
    }
  }

  const updatedProblem = await db.problem.update({
    where: {
      id: problemId,
    },
    data: {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      hints,
      editorial,
      testcases,
      codeSnippets,
      referenceSolutions,
    },
  });

  if (!updatedProblem)
    throw new ApiError(
      400,
      "Problem update failed: Unable to save updated problem to the database"
    );

  return res.status(200).json(
    new ApiResponse(200, "Problem updated successfully", {
      updatedProblem,
    })
  );
});

export const deleteProblem = asyncHandler(async (req, res) => {
  const { id: problemId } = req.params;
  if (!problemId) throw new ApiError(400, "ProblemId is required");

  const problem = await db.problem.findUnique({
    where: {
      id: problemId,
    },
  });
  if (!problem) throw new ApiError(404, "No problem found!");

  await db.problem.delete({
    where: {
      id: problemId,
    },
  });

  res.json(new ApiResponse(200, "Problem deleted successfully"));
});

export const getAllProblems = asyncHandler(async (req, res) => {
  const { search, tags, difficulty, company } = req.query;

  const where = {
    isPremium: false,
  };

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }
  if (tags) {
    where.tags = { has: tags };
  }

  if (company) {
    where.company = { has: company };
  }

  if (difficulty) {
    where.difficulty = { equals: difficulty.toUpperCase() };
  }

  const problems = await db.problem.findMany({
    where,
    include: {
      submissions: {
        select: {
          id: true,
          problemId: true,
          status: true,
        },
      },
      solvedBy: true,
    },
  });

  res.json(new ApiResponse(200, "Problem fetched successfully", { problems }));
});

export const getProblemById = asyncHandler(async (req, res) => {
  const { id: problemId } = req.params;
  if (!problemId) throw new ApiError(400, "ProblemId is required");

  const problem = await db.problem.findUnique({
    where: {
      id: problemId,
    },
  });

  if (!problem) throw new ApiError(404, "No problem found");

  res.json(new ApiResponse(200, "Problem fetched successfully", { problem }));
});

export const getSolvedProblems = asyncHandler(async (req, res) => {
  const solvedProblems = await db.problem.findMany({
    where: {
      solvedBy: {
        some: {
          userId: req.user.id,
        },
      },
    },
    include: {
      solvedBy: {
        where: {
          userId: req.user.id,
        },
      },
    },
  });

  res.status(200).json(
    new ApiResponse(200, "Solved Problem fetched successfully", {
      solvedProblems,
    })
  );
});

export const getSolvedProblemsCount = asyncHandler(async (req, res) => {
  const solvedProblems = await db.problem.count({
    where: {
      solvedBy: {
        some: {
          userId: req.user.id,
        },
      },
    },
  });

  res.status(200).json(
    new ApiResponse(200, "Solved Problem count fetched successfully", {
      count: solvedProblems,
    })
  );
});

export const getProblemsCount = asyncHandler(async (req, res) => {
  const problems = await db.problem.count({});

  res.status(200).json(
    new ApiResponse(200, "Solved Problem count fetched successfully", {
      count: problems,
    })
  );
});
