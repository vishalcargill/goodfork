-- Drop budget field now that pricing guardrails are out of scope
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "budgetTargetCents";
