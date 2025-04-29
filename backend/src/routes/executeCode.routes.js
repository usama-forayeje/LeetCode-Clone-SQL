import express from "express";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { executeCode } from "../controllers/executeCode.controller.js";

const executeRoute = express.Router()

executeRoute.post("/execute-code", verifyJWT,executeCode)


export default executeRoute