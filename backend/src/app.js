import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import problemsRoutes from "./routes/problem.routes.js";
import executeRoute from "./routes/executeCode.routes.js";
import submissionRoutes from "./routes/submission.routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorHandler);

app.use(
  cors({
    origin: "localhost:8000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Set-Cookie", "*"],
  })
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/problem", problemsRoutes);
app.use("/api/v1/execute", executeRoute);
app.use("/api/v1/submission", submissionRoutes);

export default app;
