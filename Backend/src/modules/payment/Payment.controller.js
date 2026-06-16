import dodoClient from "../../services/dodo.service.js";
import prisma from "../../config/db.js";

const STORAGE_LIMITS = {
  BASIC: BigInt(10 * 1024 * 1024 * 1024),
  PRO: BigInt(2 * 1024 * 1024 * 1024 * 1024),
  FAMILY: BigInt(5 * 1024 * 1024 * 1024 * 1024),
};

const PAYMENT_PLANS = {
  pro: {
    name: "PRO",
    productIdEnv: "DODO_PRO_PRODUCT_ID",
  },
  family: {
    name: "FAMILY",
    productIdEnv: "DODO_FAMILY_PRODUCT_ID",
  },
};

const getStorageLimit = (plan) => STORAGE_LIMITS[plan] || STORAGE_LIMITS.BASIC;

const ACTIVE_RETURN_STATUSES = new Set([
  "active",
  "succeeded",
  "paid",
  "completed",
  "complete",
]);

const normalizePlanName = (plan) => {
  if (!plan || typeof plan !== "string") {
    return null;
  }

  const normalized = plan.trim().toUpperCase();
  return STORAGE_LIMITS[normalized] ? normalized : null;
};

const buildSubscriptionPayload = (user) => ({
  plan: user.subscriptionPlan,
  subscriptionId: user.subscriptionId,
  storageLimit: Number(user.storageLimit),
  storageUsed: user.storageUsed,
});

// ======================
// CREATE CHECKOUT SESSION
// ======================
export const createCheckout = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.userId;

    // Look up the user so we can pass their email to Dodo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, dodoCustomerId: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const selectedPlan = PAYMENT_PLANS[plan];

    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    if (!process.env.DODO_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Dodo Payments API key is not configured",
      });
    }

    const productId = process.env[selectedPlan.productIdEnv];
    const planName = selectedPlan.name;

    if (!productId) {
      return res.status(500).json({
        success: false,
        message: `${selectedPlan.productIdEnv} is not configured`,
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const checkoutPayload = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      return_url: `${frontendUrl}/payment-success?plan=${planName}`,
      cancel_url: `${frontendUrl}/pricing`,
      metadata: {
        userId: userId,
        plan: planName,
      },
    };

    // If user has a saved Dodo customer ID, attach it
    if (user.dodoCustomerId) {
      checkoutPayload.customer = { customer_id: user.dodoCustomerId };
    }

    const checkout = await dodoClient.checkoutSessions.create(checkoutPayload);
    const checkoutUrl = checkout.checkout_url || checkout.checkoutUrl;

    if (!checkoutUrl) {
      return res.status(502).json({
        success: false,
        message: "Dodo Payments did not return a checkout URL",
      });
    }

    return res.json({
      success: true,
      checkoutUrl,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// WEBHOOK HANDLER
// ======================
export const handleWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log(`[Dodo Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "subscription.active":
      case "subscription.created": {
        const data = event.data;
        const metadata = data.metadata || {};
        const userId = metadata.userId;
        const plan = metadata.plan;

        if (!userId || !plan) {
          console.warn("[Dodo Webhook] Missing userId or plan in metadata", metadata);
          return res.status(200).json({ received: true });
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: plan,
            subscriptionId: data.subscription_id || data.id || null,
            dodoCustomerId: data.customer?.customer_id || null,
            storageLimit: getStorageLimit(plan),
          },
        });

        console.log(`[Dodo Webhook] User ${userId} upgraded to ${plan}`);
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        const data = event.data;
        const metadata = data.metadata || {};
        const userId = metadata.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionPlan: "BASIC",
              subscriptionId: null,
              storageLimit: STORAGE_LIMITS.BASIC,
            },
          });

          console.log(`[Dodo Webhook] User ${userId} downgraded to BASIC`);
        }
        break;
      }

      case "payment.succeeded": {
        const data = event.data;
        const metadata = data.metadata || {};
        const userId = metadata.userId;
        const plan = metadata.plan;
        
        console.log(`[Dodo Webhook] Payment succeeded for user ${userId}, plan ${plan}`);
        
        if (userId && plan) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionPlan: plan,
              subscriptionId: data.subscription_id || data.subscription?.subscription_id || null,
              dodoCustomerId: data.customer?.customer_id || null,
              storageLimit: getStorageLimit(plan),
            },
          });
          console.log(`[Dodo Webhook] User ${userId} upgraded to ${plan} via payment.succeeded`);
        }
        break;
      }

      default:
        console.log(`[Dodo Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Dodo Webhook] Error:", error);
    // Always return 200 to prevent Dodo from retrying
    return res.status(200).json({ received: true, error: error.message });
  }
};

// ======================
// SYNC PAYMENT RETURN
// ======================
export const syncPaymentReturn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId, paymentId, status, plan } = req.body;

    const normalizedStatus = String(status || "").toLowerCase();
    const requestedPlan = normalizePlanName(plan);
    const hasReturnProof = Boolean(subscriptionId || paymentId);

    if (!hasReturnProof && !ACTIVE_RETURN_STATUSES.has(normalizedStatus)) {
      return res.status(409).json({
        success: false,
        message: "Payment is not active yet",
      });
    }

    let resolvedPlan = requestedPlan;
    let resolvedSubscriptionId = subscriptionId || null;
    let resolvedCustomerId = null;

    if (subscriptionId && process.env.DODO_API_KEY) {
      try {
        const subscription = await dodoClient.subscriptions.retrieve(subscriptionId);
        const subscriptionStatus = String(subscription.status || "").toLowerCase();

        if (!["active", "trialing", "renewed"].includes(subscriptionStatus)) {
          return res.status(409).json({
            success: false,
            message: "Subscription is not active yet",
          });
        }

        resolvedSubscriptionId = subscription.subscription_id || subscription.id || subscriptionId;
        resolvedCustomerId =
          subscription.customer?.customer_id ||
          subscription.customer_id ||
          null;
        resolvedPlan =
          normalizePlanName(subscription.metadata?.plan) ||
          requestedPlan;
      } catch (verifyError) {
        console.warn("[Payment Sync] Could not verify subscription with Dodo:", verifyError.message);

        if (!ACTIVE_RETURN_STATUSES.has(normalizedStatus)) {
          return res.status(409).json({
            success: false,
            message: "Could not verify subscription yet",
          });
        }
      }
    } else if (!ACTIVE_RETURN_STATUSES.has(normalizedStatus)) {
      return res.status(409).json({
        success: false,
        message: "Payment is not active yet",
      });
    }

    if (!resolvedPlan) {
      return res.status(400).json({
        success: false,
        message: "Could not determine purchased plan",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: resolvedPlan,
        subscriptionId: resolvedSubscriptionId,
        dodoCustomerId: resolvedCustomerId,
        storageLimit: getStorageLimit(resolvedPlan),
      },
      select: {
        subscriptionPlan: true,
        subscriptionId: true,
        storageLimit: true,
        storageUsed: true,
      },
    });

    console.log(
      `[Payment Sync] User ${userId} synced to ${resolvedPlan}` +
        (paymentId ? ` via payment ${paymentId}` : "")
    );

    return res.json({
      success: true,
      subscription: buildSubscriptionPayload(updatedUser),
    });
  } catch (error) {
    console.error("Sync payment return error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// GET SUBSCRIPTION STATUS
// ======================
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        subscriptionId: true,
        storageLimit: true,
        storageUsed: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      subscription: buildSubscriptionPayload(user),
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
