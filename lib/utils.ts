import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Language, MultiLanguageText } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalizedText(
  text: string | MultiLanguageText | undefined | null,
  language: Language
): string {
  if (!text) return "";

  // If it's a string (old format), return as is
  if (typeof text === "string") return text;

  // If it's an object with languages, choose the right one
  if (typeof text === "object" && text !== null) {
    return text[language] || text.ru || text.en || "";
  }

  return "";
}
