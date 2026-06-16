import express from "express";
import { createCheckout, handleWebhook, getSubscriptionStatus, syncPaymentReturn } from "./Payment.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Create checkout session (requires auth)
router.post("/checkout", authenticateUser, createCheckout);

// Get subscription status (requires auth)
router.get("/subscription", authenticateUser, getSubscriptionStatus);

// Sync subscription after Dodo redirect (requires auth)
router.post("/sync", authenticateUser, syncPaymentReturn);

// Webhook from Dodo Payments (no auth — Dodo calls this)
router.post("/webhook", handleWebhook);

export default router;