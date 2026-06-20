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

// Telefon raqam: hamma joyda bir xil "+998XXXXXXXXX" ko'rinishida, faqat raqam.
export function handlePhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('998')) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  return '+998' + digits;
}

export function isValidPhone(value: string): boolean {
  return /^\+998\d{9}$/.test(normalizePhone(value));
}

// Davlat raqami: faqat katta harf va raqam, 8 ta belgi (mas: 01B618XC).
export function handleGovNumberInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function isValidGovNumber(value: string): boolean {
  // 01B618XC (raqam+harf+raqam+harf) yoki 01777BBA (raqam+harf) ko'rinishlari
  return /^\d{2}[A-Z]\d{3}[A-Z]{2}$/.test(value) || /^\d{2}\d{3}[A-Z]{3}$/.test(value);
}

// Pasport seriyasi: faqat katta harf, 2 ta belgi (mas: AD).
export function handlePassportSeria(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
}

// Texpasport seriyasi: faqat katta harf, 3 ta belgi (mas: AAG).
export function handleTechSeria(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
}

// Faqat raqam, berilgan uzunlikgacha (pasport raqami, texpasport raqami va h.k.).
export function handleDigits(raw: string, maxLen: number): string {
  return raw.replace(/\D/g, '').slice(0, maxLen);
}
