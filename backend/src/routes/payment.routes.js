import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  initiatePayment,
  handlePaymentCallback,
} from "../controllers/payment.controller.js";

const paymentRoutes = express.Router();

// Initiate Payment
paymentRoutes.post("/initiate/:sheetId/:gateway", isAuthenticated, initiatePayment);

// Payment Callbacks
paymentRoutes.get("/bkash/callback", handlePaymentCallback);
paymentRoutes.post("/sslcommerz/success", handlePaymentCallback);
paymentRoutes.post("/sslcommerz/fail", handlePaymentCallback);
paymentRoutes.post("/sslcommerz/cancel", handlePaymentCallback);
paymentRoutes.post("/razorpay/callback", handlePaymentCallback);


export default paymentRoutes;
