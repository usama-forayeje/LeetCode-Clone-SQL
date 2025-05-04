import express from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import {
  getAllSubmissions,
  getAllTheSubmissionsForProblem,
  getSubmissionsForProblem,
} from "../controllers/submissions.controller.js";

const submissionRoutes = express.Router();

submissionRoutes.get("/get-all-submissions", verifyJWT, getAllSubmissions);
submissionRoutes.get(
  "/get-submission/:problemId",
  verifyJWT,
  getSubmissionsForProblem
);
submissionRoutes.get(
  "/get-submissions-count/:problemId",
  verifyJWT,
  getAllTheSubmissionsForProblem
);

export default submissionRoutes;
