/** Shape of data/common.json (branding + tokens). */
export interface CommonData {
  brand?: {
    orgName: string;
    colors: Record<string, string>;
    fontStacks: Record<string, string[]>;
  };
  strings?: {
    siteTitle?: string;
    pageDescription?: string;
  };
  announcement?: {
    enabled: boolean;
    text?: string;
    link?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

/**
 * Formats a font stack for CSS `font-family` from token names in common.json
 * (e.g. Times New Roman → quoted).
 */
export function fontStackToCssValue(families: string[]): string {
  return families
    .map((name) => (/\s/.test(name) ? `"${name}"` : name))
    .join(", ");
}

/**
 * Build `:root { --token: value; }` for colors + font stacks in common.json
 */
export function buildBrandRootStyle(common: CommonData): string {
  const brand = common.brand;
  if (!brand?.colors) return "";

  const lines: string[] = [];

  for (const [key, value] of Object.entries(brand.colors)) {
    lines.push(`  --${key}: ${value};`);
  }

  if (brand.fontStacks) {
    for (const [key, stack] of Object.entries(brand.fontStacks)) {
      lines.push(`  --${key}: ${fontStackToCssValue(stack)};`);
    }
  }

  if (lines.length === 0) return "";
  return `:root {\n${lines.join("\n")}\n}`;
}
