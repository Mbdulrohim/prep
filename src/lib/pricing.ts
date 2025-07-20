// src/lib/pricing.ts
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: "individual" | "group";
  features: string[];
  maxUsers?: number;
  attemptsPerUser: number;
  examTypes: string[];
  retakeAllowed: boolean;
  groupLeaderboard: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "premium_access",
    name: "Focused RN Exam Prep",
    description:
      "Build confidence and test your knowledge with this essential preparation package, designed specifically for your professional exams.",
    price: 1000,
    currency: "NGN",
    type: "individual",
    features: [
      "**Full Mock Exam Experience** - Practice under real CBT conditions",
      "**Current NMCN Questions** - Updated curriculum content",
      "**Core Clinical Topics** - Medical-Surgical, Foundations & Maternal Health",
      "**Professional Scenarios** - Ethics, Management & Current Trends",
      "**Performance Analysis** - Identify strengths and focus areas",
    ],
    attemptsPerUser: 6, // 3 mock exams total (Paper 1 & Paper 2)
    examTypes: ["RN", "RM", "RPHN"],
    retakeAllowed: true,
    groupLeaderboard: false,
  },
];

export const EXAM_TOPICS = {
  RN: [
    "Accident and Emergency Nursing",
    "Critical care nursing",
    "Public health Nursing",
    "Community health nursing",
    "Mental health nursing",
    "Pediatric nursing",
    "Cardio thoracic Nursing",
    "General Nursing",
    "Nephrology nursing",
    "Nose and throat nursing",
    "Occupational health nursing",
    "Ophthalmic nurses",
    "Basic Midwifery",
    "Burns and Plastic Nursing",
    "Dept. of nursing-bnsc",
    "Maternal and child health nursing",
    "Nurse administrator",
    "Nurse Educator",
    "Orthopaedic nursing",
    "Perioperative nurses",
  ],
  RM: [
    "Basic Midwifery",
    "Maternal and child health nursing",
    "Obstetric and Gynaecological nursing",
    "Neonatal nursing",
    "Family planning and reproductive health",
    "Antenatal care",
    "Intrapartum care",
    "Postpartum care",
    "High-risk pregnancy management",
    "Birth complications",
    "Newborn care",
    "Breastfeeding and lactation",
  ],
  RPHN: [
    "Public health Nursing",
    "Community health nursing",
    "Epidemiology and disease prevention",
    "Health promotion and education",
    "Environmental health",
    "Occupational health nursing",
    "School health nursing",
    "Immunization programs",
    "Communicable disease control",
    "Non-communicable disease management",
    "Health policy and administration",
    "Research and statistics",
  ],
};

export function getPlanById(planId: string): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === planId);
}

export function formatPrice(amount: number, currency: string = "NGN"): string {
  return `₦${amount.toLocaleString()}`;
}

// Pricing display utilities
export const PRICING_CONFIG = {
  originalPrice: 3000,
  discountPercentage: 66,
  finalPrice: 1000,
  mockExamCount: 3,
  showDiscount: true,
  promotionStartDate: new Date("2025-08-01"), // August 1st, 2025
  promotionDurationDays: 50,
};

export function getPromotionTimeLeft() {
  const now = new Date();
  const endDate = new Date(PRICING_CONFIG.promotionStartDate);
  endDate.setDate(endDate.getDate() + PRICING_CONFIG.promotionDurationDays);

  const timeLeft = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return {
    daysLeft: Math.max(0, daysLeft),
    endDate,
    isActive: daysLeft > 0 && now >= PRICING_CONFIG.promotionStartDate,
    hasStarted: now >= PRICING_CONFIG.promotionStartDate,
  };
}

export function getDiscountedPrice() {
  return {
    original: PRICING_CONFIG.originalPrice,
    discounted: PRICING_CONFIG.finalPrice,
    discountPercent: PRICING_CONFIG.discountPercentage,
    savings: PRICING_CONFIG.originalPrice - PRICING_CONFIG.finalPrice,
  };
}

export function formatPriceWithDiscount() {
  const discount = getDiscountedPrice();
  const promotion = getPromotionTimeLeft();

  return {
    originalFormatted: formatPrice(discount.original),
    discountedFormatted: formatPrice(discount.discounted),
    savingsFormatted: formatPrice(discount.savings),
    savings: discount.savings,
    discountPercent: discount.discountPercent,
    daysLeft: promotion.daysLeft,
    isPromotionActive: promotion.isActive,
    hasPromotionStarted: promotion.hasStarted,
  };
}
