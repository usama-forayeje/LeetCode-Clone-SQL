import express from "express";
import { HealthController } from "../controllers/health.controller.js";

const healthRoute = express.Router();

healthRoute.get("/", HealthController);

export default healthRoute;
