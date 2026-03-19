import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isValidBDPhone(phone: string): boolean {
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    return bdPhoneRegex.test(phone);
}

export function sanitizePhone(phone: string): string {
    if (!phone) return '';
    // Keep only digits
    const digits = phone.replace(/\D/g, '');
    // Take the last 11 (standard BD format)
    const last11 = digits.slice(-11);
    
    // If it's 10 digits and doesn't start with 0, it might be missing the leading 0
    if (last11.length === 10 && !last11.startsWith('0')) {
        return '0' + last11;
    }
    
    return last11;
}
