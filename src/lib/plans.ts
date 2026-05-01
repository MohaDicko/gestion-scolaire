export type Plan = 'STARTER' | 'BUSINESS' | 'ELITE';

export interface PlanFeatures {
  maxStudents: number;
  hasHR: boolean;
  hasFinance: boolean;
  hasTimetable: boolean;
  hasEmails: boolean;
  hasIDCards: boolean;
  hasMultiCampus: boolean;
}

export const PLAN_CONFIGS: Record<Plan, PlanFeatures> = {
  STARTER: {
    maxStudents: 250,
    hasHR: false,
    hasFinance: true, // Basic finance only
    hasTimetable: true,
    hasEmails: false,
    hasIDCards: false,
    hasMultiCampus: false,
  },
  BUSINESS: {
    maxStudents: 750,
    hasHR: false,
    hasFinance: true,
    hasTimetable: true,
    hasEmails: true,
    hasIDCards: true,
    hasMultiCampus: false,
  },
  ELITE: {
    maxStudents: 999999,
    hasHR: true,
    hasFinance: true,
    hasTimetable: true,
    hasEmails: true,
    hasIDCards: true,
    hasMultiCampus: true,
  }
};

/**
 * Check if a feature is enabled for a given school plan.
 */
export function isFeatureAllowed(plan: Plan, feature: keyof PlanFeatures): boolean {
  const config = PLAN_CONFIGS[plan];
  if (!config) return false;
  
  const value = config[feature];
  return typeof value === 'boolean' ? value : true;
}

/**
 * Get the current student limit for a plan.
 */
export function getStudentLimit(plan: Plan): number {
  return PLAN_CONFIGS[plan]?.maxStudents || 0;
}
