// Plan type for frequency selection
export type PlanType = 'monthly' | 'twoMonthly' | 'threeMonthly' | 'fourMonthly' | 'sixMonthly' | 'yearly';

// A single pricing/duration variation within a product.
//
// Two distinct identifiers live on each variation:
//   - `id`        : the local/variation UUID. Used by the NEW API
//                   (`buildFormPayloadNew`) and surfaces in URLs as
//                   `?productId=…`. Also used to look up which quiz to load.
//   - `bundleId`  : the upstream "product bundle" UUID consumed by the LEGACY
//                   API (`buildFormPayload` → `productBundleId` field).
// Keeping both lets a single variation reference its in-app id and the
// pharmacy-side bundle id without callers having to know which goes where.
//
// `stagingId` / `stagingBundleId` are optional staging-only overrides. When a
// submission is routed to the CareValidate staging API (dev builds or embedded
// sessions — see `resolveEnvMode` / `useEnvMode`), these are sent in place of
// `id` / `bundleId` so test cases reference the staging-side products. When an
// override is absent we fall back to the prod `id` / `bundleId`.
export interface ProductVariation {
  duration: PlanType;
  id?: string;
  bundleId?: string;
  stagingId?: string;
  stagingBundleId?: string;
  price: number;
  refillPrice?: number;
}

export interface ProductImages {
  mainImg: string;
}

// Product interface (was ProductVariation)
export interface Product {
  id: string;
  name: string;
  selectionName?: string;
  selectionDescription?: string;
  cardName?: string;
  cardDescription?: string;
  type: 'injections' | 'drops' | 'tablets' | 'cream' | 'patch' | 'gel' | 'spray';
  intro?: string;
  description?: string;
  images: ProductImages;
  patientCount?: number;
  tag?: string;
  variations: ProductVariation[];
  popular?: boolean;
  availability?: 'in_stock' | 'out_of_stock' | 'coming_soon';
  features?: string[];
  faqs?: {
    question: string;
    answer: string;
  }[];
  quizId?: string;
}

// Category interface (was Product)
export interface Category {
  id: string;
  name: string;
  description?: string;
  images: ProductImages;
  products: Product[];
  popular?: boolean;
  availability?: 'in_stock' | 'out_of_stock' | 'coming_soon';
}

// Checkout page state interface
export interface CheckoutState {
  selectedCategory?: Category;
  selectedProduct?: Product;
  billingCycle?: 'monthly';
}

// --- Helper functions for accessing variations ---

/** Get the price for a specific duration, or undefined if not available */
export function getVariationPrice(product: Product, duration: PlanType): number | undefined {
  return product.variations.find(v => v.duration === duration)?.price
}

/**
 * Get the variation ID (local UUID) for a specific duration, or undefined if
 * not available. When `useStaging` is true, prefers the variation's
 * `stagingId` and falls back to the prod `id` when no override is set.
 */
export function getVariationId(product: Product, duration: PlanType, useStaging = false): string | undefined {
  const variation = product.variations.find(v => v.duration === duration)
  if (!variation) return undefined
  return useStaging && variation.stagingId ? variation.stagingId : variation.id
}

/**
 * Get the upstream pharmacy bundle ID for a specific duration, or undefined if
 * not set. When `useStaging` is true, prefers the variation's
 * `stagingBundleId` and falls back to the prod `bundleId` when no override is set.
 */
export function getVariationBundleId(product: Product, duration: PlanType, useStaging = false): string | undefined {
  const variation = product.variations.find(v => v.duration === duration)
  if (!variation) return undefined
  return useStaging && variation.stagingBundleId ? variation.stagingBundleId : variation.bundleId
}

/** Get the refill price for a specific duration, or undefined if not set */
export function getVariationRefillPrice(product: Product, duration: PlanType): number | undefined {
  return product.variations.find(v => v.duration === duration)?.refillPrice
}

/** Check if a product has a specific duration available */
export function hasVariation(product: Product, duration: PlanType): boolean {
  return product.variations.some(v => v.duration === duration)
}

