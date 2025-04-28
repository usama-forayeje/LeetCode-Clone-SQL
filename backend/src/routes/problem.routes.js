import express from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import {
  createProblem,
  deleteProblemsById,
  getAllProblems,
  getAllSolvedProblemByUser,
  getProblemsById,
  updateProblemsById,
} from "../controllers/problem.controller.js";

const problemsRoutes = express.Router();

problemsRoutes.post("/create-problem", verifyJWT, isAdmin, createProblem);

problemsRoutes.get("/get-all-problems", verifyJWT, getAllProblems);

problemsRoutes.get("/get-problems/:id", verifyJWT, getProblemsById);

problemsRoutes.put("/update-problems/:id", verifyJWT,isAdmin, updateProblemsById);

problemsRoutes.delete("/delete-problems/:id", verifyJWT,isAdmin, deleteProblemsById);

problemsRoutes.get("/get-solved-problems", verifyJWT,getAllSolvedProblemByUser);

export default problemsRoutes;
