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
    name: "Premium Access",
    description: "Complete exam preparation with 3 mock exams",
    price: 1000,
    currency: "NGN",
    type: "individual",
    features: [
      "Access to all nursing exam questions",
      "3 Full Mock Exams (Paper 1 & Paper 2)",
      "AI-powered explanations & hints",
      "Detailed progress tracking & analytics",
      "University leaderboards",
      "Unlimited practice sessions",
      "Study performance insights",
      "Exam readiness assessment"
    ],
    attemptsPerUser: 6, // 3 mock exams total (Paper 1 & Paper 2)
    examTypes: ["RN", "RM", "RPHN"],
    retakeAllowed: true,
    groupLeaderboard: false
  }
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
    "Perioperative nurses"
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
    "Breastfeeding and lactation"
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
    "Research and statistics"
  ]
};

export function getPlanById(planId: string): PricingPlan | undefined {
  return PRICING_PLANS.find(plan => plan.id === planId);
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
  showDiscount: true
};

export function getDiscountedPrice() {
  return {
    original: PRICING_CONFIG.originalPrice,
    discounted: PRICING_CONFIG.finalPrice,
    discountPercent: PRICING_CONFIG.discountPercentage,
    savings: PRICING_CONFIG.originalPrice - PRICING_CONFIG.finalPrice
  };
}

export function formatPriceWithDiscount() {
  const discount = getDiscountedPrice();
  return {
    originalFormatted: formatPrice(discount.original),
    discountedFormatted: formatPrice(discount.discounted),
    savingsFormatted: formatPrice(discount.savings),
    discountPercent: discount.discountPercent
  };
}
