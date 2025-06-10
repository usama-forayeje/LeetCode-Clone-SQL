import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
    addProblemsInSheet,
  createSheet,
  deleteSheet,
  getAllSheets,
  getSheetById,
  getSheetFreeDetails,
  getUserSheets,
  removeProblemFromSheet,
  updateSheet,
} from "../controllers/sheet.controller.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";

const sheetRoutes = express.Router();

sheetRoutes.post("/create", isAuthenticated, isAdmin, createSheet);
sheetRoutes.put("/:sheetId", isAuthenticated, isAdmin, updateSheet);
sheetRoutes.delete("/:sheetId", isAuthenticated, isAdmin, deleteSheet);

sheetRoutes.post("/:sheetId/problems/create", isAuthenticated, isAdmin, addProblemsInSheet);
sheetRoutes.delete("/:sheetId/problems/remove", isAuthenticated, isAdmin, removeProblemFromSheet);

sheetRoutes.get("/all", isAuthenticated, getAllSheets);
sheetRoutes.get("/sheets", isAuthenticated, getUserSheets);
sheetRoutes.get("/:sheetId", isAuthenticated, getSheetById);
sheetRoutes.get("/:sheetId/free/details", isAuthenticated, getSheetFreeDetails);

export default sheetRoutes;
