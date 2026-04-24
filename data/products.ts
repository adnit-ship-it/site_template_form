import type { Category, Product } from "../types/checkout";
import data from "./intake-form/productsList.json";

// Categories and flat product list are loaded from `products.json` (editable by external tooling)
export const categories: Category[] = data.categories as Category[];
export const products: Product[] = categories.flatMap((c) => c.products);
