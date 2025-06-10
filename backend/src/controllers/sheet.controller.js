import { db } from "../../config/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import {
  buildPaginationMeta,
  getPaginationParams,
} from "../utils/pagination.js";

export const createSheet = asyncHandler(async (req, res) => {
  const parsedData = req.body;

  const { title, description, languages, price, isPremium, tags } = parsedData;

  const newSheet = await db.sheet.create({
    data: {
      title: title,
      description: description,
      languages: languages,
      price: price,
      tags,
      isPremium: isPremium,
    },
  });

  if (!newSheet) {
    throw new ApiError(500, "Failed to create sheet");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, "Sheet Created success fully", { sheet: newSheet })
    );
});

export const updateSheet = asyncHandler(async (req, res) => {
  const parsedData = req.body;
  const { title, description, languages, price, isPremium } = parsedData;

  const { sheetId } = req.params;
  if (!sheetId) {
    throw new ApiError(400, "Sheet ID is required");
  }

  const updatedSheet = await db.sheet.update({
    where: {
      id: sheetId,
    },
    data: {
      title: title,
      description: description,
      languages: languages,
      price: price,
      isPremium: isPremium,
    },
  });

  if (!updatedSheet) {
    throw new ApiError(500, "Failed to update sheet");
  }

  res.status(200).json(
    new ApiResponse(200, "Sheet updated successfully", {
      sheet: updatedSheet,
    })
  );
});

export const deleteSheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  if (!sheetId) {
    throw new ApiError(400, "Sheet ID is required");
  }

  await db.sheet.delete({
    where: {
      id: sheetId,
    },
  });

  res.status(200).json(new ApiResponse(200, "Sheet deleted successfully"));
});

export const addProblemsInSheet = asyncHandler(async (req, res) => {
  const { problemIds } = req.body;
  const { sheetId } = req.params;

  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    throw new ApiError(400, "problemIds must be a non-empty array");
  }
  const invalidIds = problemIds.filter(
    (id) => typeof id !== "string" || !id.trim()
  );
  if (invalidIds.length > 0) {
    throw new ApiError(400, "All problemIds must be non-empty strings");
  }

  if (!sheetId) {
    throw new ApiError(400, "Sheet ID is required");
  }

  const sheetExists = await db.sheet.findUnique({
    where: { id: sheetId },
    select: { id: true },
  });
  if (!sheetExists) {
    throw new ApiError(404, "Sheet not found");
  }

  const validProblems = await db.problem.findMany({
    where: { id: { in: problemIds } },
    select: { id: true },
  });
  const validIds = validProblems.map((p) => p.id);
  const notFound = problemIds.filter((pid) => !validIds.includes(pid));
  if (notFound.length > 0) {
    throw new ApiError(
      404,
      `These problem IDs were not found: ${notFound.join(", ")}`
    );
  }

  const result = await db.sheetProblem.createMany({
    data: problemIds.map((pid, idx) => ({
      sheetId,
      problemId: pid,
      orderIndex: idx,
    })),
    skipDuplicates: true,
  });

  res.status(200).json(
    new ApiResponse(200, "Problems added to sheet successfully", {
      addedCount: result.count,
    })
  );
});

export const removeProblemFromSheet = asyncHandler(async (req, res) => {
  const { problemId } = req.body;
  const { sheetId } = req.params;
  if (!problemId || typeof problemId !== "string" || !problemId.trim()) {
    throw new ApiError(400, "problemId must be a non-empty string");
  }
  if (!sheetId) {
    throw new ApiError(400, "Sheet ID is required");
  }

  // Check if the sheetProblem exists
  const sheetProblem = await db.sheetProblem.findUnique({
    where: {
      sheetId_problemId: {
        sheetId,
        problemId,
      },
    },
  });
  if (!sheetProblem) {
    throw new ApiError(404, "Problem not found in the sheet");
  }

  // Delete the problem from the sheet
  await db.sheetProblem.delete({
    where: {
      sheetId_problemId: {
        sheetId,
        problemId,
      },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Problem removed from sheet successfully"));
});

export const getAllSheets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req);

  const totalCount = await db.sheet.count();
  const sheets = await db.sheet.findMany({
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  const pagination = buildPaginationMeta(totalCount, page, limit);
  res.status(200).json(
    new ApiResponse(200, "Sheets fetched successfully", {
      sheets,
      pagination,
    })
  );
});

export const getSheetById = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const userId = req.userId;

  if (!sheetId) {
    throw new ApiError(400, "Sheet ID is required");
  }

  const purchase = await db.purchase.findUnique({
    where: {
      userId_sheetId: {
        userId,
        sheetId,
      },
    },
  });
  if (!purchase) {
    throw new ApiError(403, "You do not have access to this sheet");
  }

  const sheet = await db.sheet.findUnique({
    where: { id: sheetId },
    include: {
      sheetAssignments: {
        orderBy: { orderIndex: "asc" },
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
  if (!sheet) {
    throw new ApiError(404, "Sheet not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Sheet fetched successfully", { sheet }));
});

export const getSheetFreeDetails = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  if (!sheetId) {
    throw new ApiError(400, "Sheet ID is required");
  }
  const sheet = await db.sheet.findUnique({
    where: { id: sheetId },
  });
  if (!sheet) {
    throw new ApiError(404, "Sheet not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, "Sheet fetched successfully", { sheet }));
});

export const getUserSheets = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const sheets = await db.sheet.findMany({
    where: {
      purchases: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      purchases: {
        select: {
          boughtAt: true,
        },
      },
      _count: {
        select: {
          sheetAssignments: true,
        },
      },
    },
  });

  res.status(200).json(
    new ApiResponse(200, "Sheets fetched successfully", {
      sheets,
    })
  );
});
