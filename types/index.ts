import type { UserGroup } from "@/lib/groups";

export interface User {
  _id: string;
  name: {
    ru: string;
    en: string;
  };
  email: string;
  password?: string;
  phone: string;
  position: {
    ru: string;
    en: string;
  };
  birthday: string;
  avatar: string;
  role: "admin" | "worker";
  workerType?: "employee" | "top_manager";
  viewPermissions: "top_managers" | "employees" | "both";
  order_id: number;
  object_name: {
    ru: string;
    en: string;
  };
  hidden?: boolean;
  groups?: UserGroup[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name: {
    ru: string;
    en: string;
  };
  email: string;
  password: string;
  phone: string;
  position: {
    ru: string;
    en: string;
  };
  birthday: string;
  avatar: string;
  role: "admin" | "worker";
  workerType?: "employee" | "top_manager";
  viewPermissions: "top_managers" | "employees" | "both";
  order_id: number;
  object_name: {
    ru: string;
    en: string;
  };
  hidden?: boolean;
  groups?: UserGroup[];
}

export interface UpdateUserData {
  name: {
    ru: string;
    en: string;
  };
  email: string;
  password?: string;
  phone: string;
  position: {
    ru: string;
    en: string;
  };
  birthday: string;
  avatar: string;
  role: "admin" | "worker";
  workerType?: "employee" | "top_manager";
  viewPermissions: "top_managers" | "employees" | "both";
  order_id: number;
  object_name: {
    ru: string;
    en: string;
  };
  hidden?: boolean;
  groups?: UserGroup[];
}

export interface BirthdayUser {
  _id: string;
  name: {
    ru: string;
    en: string;
  };
  position: {
    ru: string;
    en: string;
  };
  avatar: string;
  birthday: string;
  daysUntilBirthday: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "worker";
}

export type Language = "ru" | "en";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Тип для многоязычных текстовых полей
export interface MultiLanguageText {
  ru: string;
  en: string;
}

// Утилитарные типы для работы с многоязычностью
export type LocalizedField<T> = T extends string ? MultiLanguageText : T;

// Функция-хелпер для получения локализованного текста
export type GetLocalizedText = (
  text: string | MultiLanguageText | undefined | null,
  language: Language
) => string;
