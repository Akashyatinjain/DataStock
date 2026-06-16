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
