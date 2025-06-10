import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
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
import purchaseRoutes from "./routes/purchase.routes.js";

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
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/problem", problemsRoutes);
app.use("/api/v1/execute", executeRoute);
app.use("/api/v1/submission", submissionRoutes);
app.use("/api/v1/playlist", playlistRoutes);
app.use("/api/v1/sheet", sheetRoutes);
app.use("/api/v1/purchase", purchaseRoutes);
app.use("/api/v1/health", healthRoute);

export default app;
