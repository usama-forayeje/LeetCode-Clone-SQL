import axios from "axios";
import crypto from "crypto";
import { db } from "../../config/db.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";
import Razorpay from "razorpay";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// ==================== Core Payment Service ====================
class PaymentService {
  // Initialize payment based on gateway
  static async initiatePayment(gateway, data) {
    switch (gateway) {
      case "BKASH":
        return this._initiateBkash(data);
      case "SSLCOMMERZ":
        return this._initiateSslCommerz(data);
      case "RAZORPAY":
        return this._initiateRazorpay(data);
      default:
        throw new ApiError(400, "Invalid payment gateway");
    }
  }
  // Verify payment callback
  static async verifyPayment(gateway, payload) {
    switch (gateway) {
      case "BKASH":
        return this._verifyBkash(payload);
      case "SSLCOMMERZ":
        return this._verifySslCommerz(payload);
      case "RAZORPAY":
        return this._verifyRazorpay(payload);
      default:
        throw new ApiError(400, "Invalid payment gateway");
    }
  }

  // ========== Gateway-Specific Methods ==========
  static async _initiateBkash({ sheet, userId }) {
    const token = await this._getBkashToken();
    const response = await axios.post(
      `${process.env.BKASH_BASE_URL}/v1.2.0-beta/payment/create`,
      {
        mode: "0011",
        payerReference: userId,
        callbackURL: `${process.env.BACKEND_BASE_URL}/api/payments/bkash/callback`,
        amount: sheet.price.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: `INV-${Date.now()}-${sheet.id}`,
      },
      {
        headers: {
          Authorization: token,
          "X-APP-Key": process.env.BKASH_APP_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    return { paymentURL: response.data.bkashURL };
  }

  static async _verifyBkash({ paymentID, status, userId }) {
    if (status !== "completed") throw new ApiError(400, "Payment failed");

    const token = await this._getBkashToken();
    const payment = await axios.post(
      `${process.env.BKASH_BASE_URL}/v1.2.0-beta/payment/execute/${paymentID}`,
      {},
      { headers: { Authorization: token, "X-APP-Key": process.env.BKASH_APP_KEY } }
    );

    return {
      amount: parseFloat(payment.data.amount),
      currency: "BDT",
      paymentId: paymentID,
      metadata: { gateway: "BKASH" },
    };
  }

  static async _initiateSslCommerz({ sheet, userId }) {
    const response = await axios.post(
      `${process.env.SSL_BASE_URL}/gwprocess/v4/api.php`,
      new URLSearchParams({
        total_amount: sheet.price,
        currency: "BDT",
        tran_id: `TXN_${Date.now()}`,
        success_url: `${process.env.BACKEND_BASE_URL}/api/payments/sslcommerz/success`,
        fail_url: `${process.env.BACKEND_BASE_URL}/api/payments/sslcommerz/fail`,
        cancel_url: `${process.env.BACKEND_BASE_URL}/api/payments/sslcommerz/cancel`,
        product_name: sheet.title,
        value_a: sheet.id, // Sheet ID
        value_b: userId,   // User ID
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return { paymentURL: response.data.GatewayPageURL };
  }

  static async _verifySslCommerz({ val_id, amount, value_a, value_b }) {
    return {
      amount: parseFloat(amount),
      currency: "BDT",
      paymentId: val_id,
      metadata: { sheetId: value_a, userId: value_b, gateway: "SSLCOMMERZ" },
    };
  }

  static async _initiateRazorpay({ sheet }) {
    return new Promise((resolve, reject) => {
      razorpay.orders.create(
        {
          amount: sheet.price * 100,
          currency: "INR",
          receipt: `RCPT_${Date.now()}`,
        },
        (err, order) => {
          if (err) reject(new ApiError(500, "Razorpay order failed"));
          resolve({ order, key: process.env.RAZORPAY_API_KEY });
        }
      );
    });
  }

  static async _verifyRazorpay({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Invalid Razorpay signature");
    }

    return {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      metadata: { gateway: "RAZORPAY" },
    };
  }

  static async _getBkashToken() {
    const response = await axios.post(
      `${process.env.BKASH_BASE_URL}/v1.2.0-beta/token/grant`,
      {
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET,
      },
      {
        headers: {
          username: process.env.BKASH_USERNAME,
          password: process.env.BKASH_PASSWORD,
        },
      }
    );
    return response.data.id_token;
  }
}

// ==================== Controller Methods ====================
export const initiatePayment = asyncHandler(async (req, res) => {
  const { sheetId, gateway } = req.params;
  const sheet = await db.sheet.findUnique({ where: { id: sheetId } });
  if (!sheet) throw new ApiError(404, "Sheet not found");

  const result = await PaymentService.initiatePayment(gateway.toUpperCase(), {
    sheet,
    userId: req.userId,
  });

  res.status(200).json(
    new ApiResponse(200, `${gateway} payment initiated`, result)
  );
});

export const handlePaymentCallback = asyncHandler(async (req, res) => {
  // Detect gateway from URL or params
  let gateway = req.params.gateway;
  
  // If gateway not in params, detect from URL path
  if (!gateway) {
    const path = req.path;
    if (path.includes('bkash')) gateway = 'BKASH';
    else if (path.includes('sslcommerz')) gateway = 'SSLCOMMERZ';
    else if (path.includes('razorpay')) gateway = 'RAZORPAY';
    else throw new ApiError(400, "Gateway not detected");
  }

  // Get payload based on gateway
  const payload = gateway === 'RAZORPAY' ? req.body : req.query;

  // Verify payment
  const verification = await PaymentService.verifyPayment(
    gateway.toUpperCase(),
    payload
  );

  // Extract user ID and sheet ID from verification metadata
  const userId = verification.metadata.userId || payload.value_b;
  const sheetId = verification.metadata.sheetId || payload.value_a;

  if (!userId || !sheetId) {
    throw new ApiError(400, "Missing user ID or sheet ID in payment callback");
  }

  // Record purchase
  const purchase = await db.purchase.create({
    data: {
      userId: userId,
      sheetId: sheetId,
    },
  });

  // Record payment
  await db.payment.create({
    data: {
      userId: purchase.userId,
      purchaseId: purchase.id,
      amount: verification.amount,
      currency: verification.currency || "BDT",
      status: "COMPLETED",
      paymentId: verification.paymentId,
      orderId: verification.orderId,
      gateway: verification.metadata.gateway,
    },
  });

  // Redirect based on gateway
  if (req.path.includes('fail') || req.path.includes('cancel')) {
    res.redirect(`${process.env.FRONTEND_BASE_URL}/payment/failed`);
  } else {
    res.redirect(`${process.env.FRONTEND_BASE_URL}/payment/success`);
  }
});