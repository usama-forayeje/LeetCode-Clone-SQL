import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  handlePaymentCallback,
  initiatePayment,
} from "../controllers/payment.controller.js";

const paymentRoutes = express.Router();
// Initiate Payment
paymentRoutes.post(
  "/initiate/:gateway/:sheetId",
  isAuthenticated,
  initiatePayment
);

paymentRoutes.get("/callback/:gateway", isAuthenticated, handlePaymentCallback);
paymentRoutes.post(
  "/callback/razorpay",
  isAuthenticated,
  handlePaymentCallback
);

export default paymentRoutes;
