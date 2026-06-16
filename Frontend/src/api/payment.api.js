import API from "./axios.js";

/**
 * Create a Dodo Payments checkout session.
 * @param {"pro" | "family"} plan - The plan to purchase
 * @returns {Promise<{ success: boolean, checkoutUrl: string }>}
 */
export const createCheckoutSession = async (plan) => {
  const response = await API.post("/payment/checkout", { plan });
  return response.data;
};

/**
 * Get the current user's subscription status.
 * @returns {Promise<{ success: boolean, subscription: object }>}
 */
export const getSubscriptionStatus = async () => {
  const response = await API.get("/payment/subscription");
  return response.data;
};

/**
 * Activate subscription immediately after Dodo redirect.
 * Uses subscription_id / payment_id + status from the return URL.
 */
export const syncPaymentReturn = async (payload) => {
  const response = await API.post("/payment/sync", payload);
  return response.data;
};
