import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes Tailwind com merge inteligente (resolve conflitos). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
