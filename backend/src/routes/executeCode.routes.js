import express from "express";
import { runCode, submitCode } from "../controllers/executeCode.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const executeRoute = express.Router();

executeRoute.post("/submit/:problemId", isAuthenticated, submitCode);
executeRoute.post("/run/:problemId", isAuthenticated, runCode);

export default executeRoute;
