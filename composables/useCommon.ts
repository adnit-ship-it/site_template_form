import common from "~/data/common.json";
import type { CommonData } from "~/data/common-helpers";

/**
 * Site-wide config from data/common.json (single source of truth for brand, copy, announcement).
 */
export function useCommon(): CommonData {
  return common as CommonData;
}
