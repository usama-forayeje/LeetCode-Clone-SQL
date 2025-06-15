import express from "express";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import {
  createProblem,
  deleteProblem,
  getAllProblems,
  getProblemById,
  getProblemsCount,
  getSolvedProblems,
  getSolvedProblemsCount,
  updateProblem,
} from "../controllers/problem.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const problemsRoutes = express.Router();

problemsRoutes.post("/create", isAuthenticated, isAdmin, createProblem);
problemsRoutes.put("/:id", isAuthenticated, isAdmin, updateProblem);
problemsRoutes.delete("/:id", isAuthenticated, isAdmin, deleteProblem);

problemsRoutes.get("/solved/count", isAuthenticated, getSolvedProblemsCount);
problemsRoutes.get("/solved", isAuthenticated, getSolvedProblems);
problemsRoutes.get("/count", isAuthenticated, getProblemsCount);
problemsRoutes.get("/", isAuthenticated, getAllProblems);
problemsRoutes.get("/:id", isAuthenticated, isAdmin, getProblemById);

export default problemsRoutes;
