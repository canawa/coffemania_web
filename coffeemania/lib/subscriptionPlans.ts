export type SubscriptionPlanId = "1m" | "3m" | "12m";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  label: string;
  periodLabel: string;
  days: number;
  price: number;
  discount?: string;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "1m", label: "1 месяц", periodLabel: "30 дней", days: 30, price: 1 },
  {
    id: "3m",
    label: "3 месяца",
    periodLabel: "90 дней",
    days: 90,
    price: 399,
    discount: "−15%",
  },
  {
    id: "12m",
    label: "12 месяцев",
    periodLabel: "365 дней",
    days: 365,
    price: 899,
    discount: "−50%",
  },
];

export function getPlanById(id: SubscriptionPlanId): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id) ?? SUBSCRIPTION_PLANS[0];
}
