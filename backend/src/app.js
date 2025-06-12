import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import problemsRoutes from "./routes/problem.routes.js";
import executeRoute from "./routes/executeCode.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import playlistRoutes from "./routes/playlists.routes.js";
import healthRoute from "./routes/healthCheck.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoute from "./routes/user.routes.js";
import sheetRoutes from "./routes/sheet.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorHandler);

app.use(
  cors({
    origin: [process.env.FRONTEND_BASE_URL, "https://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposedHeaders: ["Set-Cookie", "*"],
  })
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/problems", problemsRoutes);
app.use("/api/v1/executes", executeRoute);
app.use("/api/v1/submissions", submissionRoutes);
app.use("/api/v1/playlists", playlistRoutes);
app.use("/api/v1/sheets", sheetRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/health", healthRoute);

export default app;
