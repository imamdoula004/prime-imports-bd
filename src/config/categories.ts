export interface Category {
  id: string;
  name: string;
  slug: string;
  keywords: string[];
  featured?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    id: "beverages",
    name: "Beverages & Drinks",
    slug: "beverages",
    keywords: ["beverage", "drink", "juice", "soda", "water", "cola", "pepsi", "coke", "fanta", "sprite", "red bull", "monster", "prime"],
    featured: true
  },
  {
    id: "tea-coffee",
    name: "Tea & Coffee",
    slug: "tea-coffee",
    keywords: ["tea", "coffee", "latte", "espresso", "cappuccino", "nescafe", "starbucks", "lipton", "matcha", "bean"],
    featured: true
  },
  {
    id: "chocolates",
    name: "Chocolate Bars",
    slug: "chocolates",
    keywords: ["chocolate", "choco", "candy", "cocoa", "hershey", "dairy milk", "kitkat", "snickers", "mars", "bounty", "ferrero", "lindt", "kinder", "toblerone"],
    featured: true
  },
  {
    id: "biscuits",
    name: "Biscuits & Cookies",
    slug: "biscuits",
    keywords: ["biscuit", "cookie", "cracker", "oreo", "biscoff", "digestive", "mcvities", "lotus"],
    featured: true
  },
  {
    id: "snacks",
    name: "Snacks & Confectionery",
    slug: "snacks",
    keywords: ["snack", "chip", "crisp", "popcorn", "pringles", "lays", "doritos", "confectionery", "sweet", "gummy", "pocky", "pretzel"],
    featured: true
  },
  {
    id: "beauty",
    name: "Cosmetics & Beauty",
    slug: "beauty",
    keywords: ["cosmetic", "beauty", "makeup", "skin", "face", "lotion", "cream", "shampoo", "soap", "body", "care", "perfume", "serum"],
    featured: true
  },
  {
    id: "health-wellness",
    name: "Health & Wellness",
    slug: "health-wellness",
    keywords: ["health", "wellness", "vitamin", "supplement", "medicine", "sanitizer", "mask"],
    featured: true
  },
  {
    id: "grocery",
    name: "Grocery and Essentials",
    slug: "grocery",
    keywords: ["grocery", "essential", "oil", "rice", "spice", "salt", "sugar", "flour", "pasta", "noodle", "sauce", "ketchup", "mayo"],
    featured: true
  },
  {
    id: "dairy",
    name: "Dairy & Cheese",
    slug: "dairy",
    keywords: ["dairy", "cheese", "milk", "butter", "yogurt", "cream", "mozzarella", "cheddar"],
    featured: true
  },
  {
    id: "baby",
    name: "Baby Care Imports",
    slug: "baby",
    keywords: ["baby", "diaper", "wipe", "formula", "pampers", "johnson", "huggies", "cerelac"],
    featured: true
  },
  {
    id: "home",
    name: "Home & Kitchen",
    slug: "home",
    keywords: ["home", "kitchen", "cleaning", "detergent", "dish", "towel", "air freshener"],
    featured: true
  },
  {
    id: "gifts",
    name: "Hampers & Gifts",
    slug: "gifts",
    keywords: ["hamper", "gift", "box", "present", "basket"],
    featured: true
  },
  {
    id: "uncategorized",
    name: "Uncategorized",
    slug: "uncategorized",
    keywords: []
  }
];

export const getCategoryById = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'uncategorized')!;
export const getCategoryBySlug = (slug: string) => CATEGORIES.find(c => c.slug === slug) || CATEGORIES.find(c => c.id === 'uncategorized')!;
