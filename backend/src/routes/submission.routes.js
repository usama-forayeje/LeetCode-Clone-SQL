import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  getAllSubmissionCount,
  getAllSubmissions,
  getAllSubmissionsCountForProblem,
  getSubmissionById,
  getSubmissionsForProblem,
} from "../controllers/submissions.controller.js";

const submissionRoutes = express.Router();

submissionRoutes.get("/submissions", isAuthenticated, getAllSubmissions);
submissionRoutes.get(
  "/submissions/problem/:problemId",
  isAuthenticated,
  getSubmissionsForProblem
);
submissionRoutes.get(
  "/submissions/:submissionId",
  isAuthenticated,
  getSubmissionById
);
submissionRoutes.get(
  "/submissions/count/:problemId",
  isAuthenticated,
  getAllSubmissionsCountForProblem
);
submissionRoutes.get(
  "/submissions/count",
  isAuthenticated,
  getAllSubmissionCount
);

export default submissionRoutes;
