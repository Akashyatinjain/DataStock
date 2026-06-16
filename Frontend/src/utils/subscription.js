export const SUBSCRIPTION_UPDATED_EVENT = "datastock:subscription-updated";

export const PLAN_KEYS = {
  BASIC: "basic",
  PRO: "pro",
  FAMILY: "family",
};

export function normalizePlan(plan) {
  if (!plan || typeof plan !== "string") {
    return "BASIC";
  }

  return plan.trim().toUpperCase();
}

export function planToKey(plan) {
  return normalizePlan(plan).toLowerCase();
}

export function plansMatch(planA, planB) {
  return normalizePlan(planA) === normalizePlan(planB);
}

export function isPaidPlan(plan) {
  const normalized = normalizePlan(plan);
  return normalized === "PRO" || normalized === "FAMILY";
}

export function notifySubscriptionUpdated(subscription) {
  window.dispatchEvent(
    new CustomEvent(SUBSCRIPTION_UPDATED_EVENT, {
      detail: subscription,
    })
  );
}

export async function refreshCachedUser(getProfile) {
  try {
    const response = await getProfile();
    const user = response.data?.user || response.user;

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }

    return user;
  } catch (error) {
    console.error("Failed to refresh cached user:", error);
    return null;
  }
}
