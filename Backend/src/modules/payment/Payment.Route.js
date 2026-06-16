import express from "express";
import { createCheckout, handleWebhook, getSubscriptionStatus } from "./Payment.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Create checkout session (requires auth)
router.post("/checkout", authenticateUser, createCheckout);

// Get subscription status (requires auth)
router.get("/subscription", authenticateUser, getSubscriptionStatus);

// Webhook from Dodo Payments (no auth — Dodo calls this)
router.post("/webhook", handleWebhook);

export default router;