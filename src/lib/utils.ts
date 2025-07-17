// lib/utils.ts

/**
 * Merges class names into a single string
 * Handles strings, arrays, objects, and falsy values
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Formats a number as currency (Nigerian Naira)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date in a readable format
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Generates a unique ID
 * Useful for keys in lists where stable IDs aren't available
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Truncates text to a specified length
 */
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Delays execution for a specified time
 * Useful for simulating loading states
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts snake_case to Title Case
 */
export function snakeToTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}

/**
 * Converts camelCase to Title Case
 */
export function camelToTitleCase(str: string): string {
  return capitalize(str.replace(/([A-Z])/g, " $1"));
}
