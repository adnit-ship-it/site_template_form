import type { CommonData } from "~/data/common-helpers";
import { DEFAULT_BRANDING } from "~/data/default-branding";

/**
 * Typed shape of the runtime config that lives in Supabase.
 *
 * Three tables back this:
 *   - `site_config` (one row per org) — feature flags + integration ids
 *   - `announcement` (one row per org) — banner content
 *   - `site_branding` (one row per org) — org name, colors, SEO strings, default quiz
 *
 * The exact column → field mapping is documented in
 * `docs/SUPABASE_SCHEMA.md`. That doc + this file are the contract between
 * this reader app and the dashboard app that writes to Supabase.
 *
 * `DEFAULT_RUNTIME_CONFIG` is what every consumer falls back to when:
 *   - Supabase isn't configured yet (env vars empty)
 *   - The Supabase fetch fails (network blip)
 *   - No row exists for the current org_id
 *
 * Defaults intentionally mirror today's hardcoded behavior so removing the
 * env vars and migrating to DB doesn't change any user-visible behavior
 * until rows are actually populated.
 */

/**
 * One named Everflow event. `id` is the numeric event id from Everflow's
 * dashboard (e.g. 111 for "Begin Quiz"). `name` is a human-readable label
 * the integration code uses to look up the right id when firing events.
 */
export interface EverflowEvent {
  name: string;
  id: number;
}

export interface SiteConfig {
  /**
   * When false, the BNPL (Buy Now Pay Later) payment option is hidden in
   * checkout. Composed with `useIsEmbedded()` at the consumer site — BNPL
   * also auto-disables inside iframes because of Stripe redirect quirks.
   */
  bnplActivated: boolean;

  /**
   * External "home" URL used by the confirmation page's "Go home" CTA. Per
   * client (e.g. https://hormoneexpertsclinic.com/).
   */
  homeUrl: string;

  /**
   * Toggles between the legacy `/dynamic-case` endpoint + old payload
   * builder, and the new `/cases` endpoint + new payload builder. Both
   * builders are bundled regardless; this is a runtime branch.
   */
  useNewAPI: boolean;

  /**
   * Selects the card payment provider for checkout.
   *   - `true`  (default): collect card details with Stripe Elements; BNPL
   *     (Klarna/Affirm/Afterpay) remains available subject to
   *     `bnplActivated` + embed gating.
   *   - `false`: collect card details with NMI (Collect.js tokenization)
   *     while still using the Stripe Address Element for shipping. BNPL is
   *     always hidden in this mode. Submission sends an `nmiPaymentToken`
   *     to CareValidate instead of a Stripe SetupIntent/PaymentIntent id.
   */
  useStripe: boolean;

  /**
   * Everflow base URL + offer/event ids. Used by the (currently dormant)
   * Everflow integration. Per-campaign values, kept in DB so marketing can
   * rotate without a redeploy.
   *
   * `everflowEventIds` is an array of named events: e.g.
   *   [{ name: "Begin Quiz", id: 111 }, { name: "Submit Form", id: 222 }]
   * Lets you wire multiple Everflow events from one config row without
   * needing a fixed schema field per event.
   */
  everflowBaseUrl: string;
  everflowOfferId: string;
  everflowEventIds: EverflowEvent[];

  /**
   * Optional hot-swap override for the default quiz id. When set, wins over
   * `site_branding.default_quiz_id`. When null/empty, branding default is used.
   */
  defaultQuizIdOverride: string | null;
}

export interface AnnouncementConfig {
  enabled: boolean;
  text: string;
  // Link target is hardcoded to /consultation in the AnnouncementBar
  // component, so there's no `link` field here (or column in Supabase).
  // The bar auto-suppresses the link when the user is already on
  // /consultation or /checkout.
  backgroundColor: string;
  textColor: string;
}

export interface RuntimeConfigDB {
  siteConfig: SiteConfig;
  announcement: AnnouncementConfig;
  /** Brand identity (formerly `data/common.json`). Source: `site_branding` table. */
  branding: CommonData;
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfigDB = {
  siteConfig: {
    bnplActivated: true,
    homeUrl: "https://hormoneexpertsclinic.com/",
    useNewAPI: true,
    useStripe: true,
    everflowBaseUrl: "",
    everflowOfferId: "",
    everflowEventIds: [],
    defaultQuizIdOverride: null,
  },
  announcement: {
    enabled: false,
    text: "",
    backgroundColor: "#000000",
    textColor: "#ffffff",
  },
  branding: DEFAULT_BRANDING,
};
