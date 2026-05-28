import type { CommonData } from "~/data/common-helpers";
import { DEFAULT_BRANDING } from "~/data/default-branding";

/** Raw `site_branding` row from Supabase (snake_case). */
export interface SiteBrandingRow {
  org_name: string;
  site_title: string;
  page_description: string;
  colors: Record<string, string> | null;
  default_quiz_id: string | null;
}

/**
 * Maps a `site_branding` row to the `CommonData` shape consumed by the app.
 * Missing or partial rows merge with `DEFAULT_BRANDING` per field.
 */
export function mapSiteBrandingRow(row: SiteBrandingRow | null): CommonData {
  const base = DEFAULT_BRANDING;
  if (!row) {
    return structuredClone(base);
  }

  const orgName = row.org_name?.trim() || base.brand?.orgName || "The Hormone Experts";
  const siteTitle =
    row.site_title?.trim() ||
    base.strings?.siteTitle ||
    `${orgName} - Discover a better you with GLP-1s.`;
  const pageDescription =
    row.page_description?.trim() ||
    base.strings?.pageDescription ||
    `${orgName} is made personalized for you and your weight loss journey.`;

  return {
    brand: {
      orgName,
      colors: {
        ...base.brand?.colors,
        ...(row.colors && typeof row.colors === "object" ? row.colors : {}),
      },
      fonts: base.brand?.fonts,
    },
    strings: {
      siteTitle,
      pageDescription,
    },
    quiz: {
      defaultQuizId:
        row.default_quiz_id?.trim() ||
        base.quiz?.defaultQuizId ||
        "weight-loss",
    },
  };
}
