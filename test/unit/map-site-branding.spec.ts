import { describe, it, expect } from "vitest";
import { mapSiteBrandingRow } from "../../server/utils/mapSiteBranding";
import { DEFAULT_BRANDING } from "../../data/default-branding";

describe("mapSiteBrandingRow", () => {
  it("returns DEFAULT_BRANDING clone when row is null", () => {
    const result = mapSiteBrandingRow(null);
    expect(result.brand?.orgName).toBe(DEFAULT_BRANDING.brand?.orgName);
    expect(result.quiz?.defaultQuizId).toBe("weight-loss");
  });

  it("maps snake_case row to CommonData", () => {
    const result = mapSiteBrandingRow({
      org_name: "Apex MD",
      site_title: "Apex MD - GLP-1s",
      page_description: "Apex MD personalized care.",
      colors: { accentColor1: "#ff0000" },
      default_quiz_id: "hair-loss",
    });
    expect(result.brand?.orgName).toBe("Apex MD");
    expect(result.strings?.siteTitle).toBe("Apex MD - GLP-1s");
    expect(result.brand?.colors?.accentColor1).toBe("#ff0000");
    expect(result.brand?.colors?.bodyColor).toBe(DEFAULT_BRANDING.brand?.colors?.bodyColor);
    expect(result.quiz?.defaultQuizId).toBe("hair-loss");
  });
});
