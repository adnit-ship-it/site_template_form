// Plan type for frequency selection
export type PlanType = 'monthly' | 'twoMonthly' | 'threeMonthly' | 'fourMonthly' | 'sixMonthly' | 'yearly';

// A single pricing/duration variation within a product
export interface ProductVariation {
  duration: PlanType;
  id: string;
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

/** Get the bundle ID for a specific duration, or undefined if not available */
export function getVariationId(product: Product, duration: PlanType): string | undefined {
  return product.variations.find(v => v.duration === duration)?.id
}

/** Get the refill price for a specific duration, or undefined if not set */
export function getVariationRefillPrice(product: Product, duration: PlanType): number | undefined {
  return product.variations.find(v => v.duration === duration)?.refillPrice
}

/** Check if a product has a specific duration available */
export function hasVariation(product: Product, duration: PlanType): boolean {
  return product.variations.some(v => v.duration === duration)
}

