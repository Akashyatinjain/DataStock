import dodoClient from "../../services/dodo.service.js";
import prisma from "../../config/db.js";

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

    let productId;
    let planName;

    if (plan === "pro") {
      productId = process.env.DODO_PRO_PRODUCT_ID;
      planName = "PRO";
    } else if (plan === "family") {
      productId = process.env.DODO_FAMILY_PRODUCT_ID;
      planName = "FAMILY";
    } else {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const checkoutPayload = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      payment_link: true,
      success_url: `${frontendUrl}/payment-success?plan=${planName}`,
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

    return res.json({
      success: true,
      checkoutUrl: checkout.checkout_url,
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

        // Determine storage limit based on plan
        let storageLimit;
        if (plan === "PRO") {
          storageLimit = BigInt(2 * 1024 * 1024 * 1024 * 1024); // 2TB
        } else if (plan === "FAMILY") {
          storageLimit = BigInt(5 * 1024 * 1024 * 1024 * 1024); // 5TB
        } else {
          storageLimit = BigInt(10 * 1024 * 1024 * 1024); // 10GB default
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: plan,
            subscriptionId: data.subscription_id || data.id || null,
            dodoCustomerId: data.customer?.customer_id || null,
            storageLimit: storageLimit,
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
              storageLimit: BigInt(10 * 1024 * 1024 * 1024), // 10GB
            },
          });

          console.log(`[Dodo Webhook] User ${userId} downgraded to BASIC`);
        }
        break;
      }

      case "payment.succeeded": {
        const data = event.data;
        const metadata = data.metadata || {};
        console.log(`[Dodo Webhook] Payment succeeded for user ${metadata.userId}`);
        // Subscription activation is handled by subscription.active event
        // This is just for logging/audit
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
      subscription: {
        plan: user.subscriptionPlan,
        subscriptionId: user.subscriptionId,
        storageLimit: Number(user.storageLimit),
        storageUsed: user.storageUsed,
      },
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};