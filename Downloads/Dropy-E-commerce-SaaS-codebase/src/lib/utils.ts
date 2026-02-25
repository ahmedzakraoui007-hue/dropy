import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanStoreSlug(slug: string): string {
  if (!slug) return '';
  // Remove trailing slashes and 'shop/' prefix if present
  return slug.replace(/^\/?(shop\/)?/, '').replace(/\/$/, '');
}

export function formatPrice(price: number | string) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
  }).format(Number(price))
}

export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat("fr-TN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function getURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // set by Vercel
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  // Handle case where VERCEL_URL doesn't include protocol
  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }

  // Remove trailing slash if present
  url = url.replace(/\/$/, "");

  return url;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}
