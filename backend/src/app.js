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

// Load environment variables first
dotenv.config();

const app = express();

// Validate required environment variables
if (!process.env.FRONTEND_BASE_URL) {
  console.error("FRONTEND_BASE_URL is not defined in environment variables");
  process.exit(1);
}

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_BASE_URL, 
    "https://localhost:5173",
    "http://localhost:5173" // Add HTTP for local development
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Authorization", "Set-Cookie"],
  optionsSuccessStatus: 200 // For legacy browser support
};

// Middleware setup (order matters!)
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
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
console.log("Final problem routes:");
problemsRoutes.stack.forEach(layer => {
  if (layer.route) {
    console.log(layer.route.path);
  }
});

// Error handler should be last
app.use(errorHandler);

export default app;