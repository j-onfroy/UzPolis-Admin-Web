import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-\(\)]/g, '');
  const digits = cleaned.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (cleaned.startsWith('+998')) return '+998' + digits.slice(3, 12);
  if (digits.startsWith('998')) return '+' + digits.slice(0, 12);
  return '+998' + digits.slice(0, 9);
}

export function handlePhoneInput(raw: string): string {
  return raw.replace(/[\s\-\(\)]/g, '');
}
