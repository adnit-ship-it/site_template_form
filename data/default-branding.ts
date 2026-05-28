import common from "./common.json";
import type { CommonData } from "./common-helpers";

/**
 * Fallback branding when Supabase is unreachable, env is unset, or
 * `site_branding` has no row for the current org. Mirrors `data/common.json`
 * plus the canonical default quiz id (formerly `quiz.defaultQuizId` in JSON).
 */
export const DEFAULT_BRANDING: CommonData = {
  ...(common as CommonData),
  quiz: {
    defaultQuizId: "weight-loss",
  },
};
