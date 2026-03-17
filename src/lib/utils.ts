import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInYears, differenceInMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(birthDate: Date): string {
  const now = new Date();
  const years = differenceInYears(now, birthDate);
  const months = differenceInMonths(now, birthDate) % 12;
  if (years === 0) return `${months} мес.`;
  if (months === 0) return `${years} ${pluralize(years, "год", "года", "лет")}`;
  return `${years} ${pluralize(years, "год", "года", "лет")} ${months} мес.`;
}

export function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (lastDigit > 1 && lastDigit < 5) return few;
  if (lastDigit === 1) return one;
  return many;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatTime(time: string): string {
  return time;
}

export const SOUND_STAGES = [
  { value: "NOT_STARTED", label: "Не начат", color: "bg-gray-200 text-gray-600" },
  { value: "IN_PROGRESS", label: "В работе", color: "bg-yellow-200 text-yellow-800" },
  { value: "ISOLATED", label: "Изолированно", color: "bg-blue-200 text-blue-800" },
  { value: "SYLLABLES", label: "В слогах", color: "bg-indigo-200 text-indigo-800" },
  { value: "WORDS", label: "В словах", color: "bg-purple-200 text-purple-800" },
  { value: "PHRASES", label: "Во фразах", color: "bg-pink-200 text-pink-800" },
  { value: "SPEECH", label: "В речи", color: "bg-green-200 text-green-800" },
] as const;

export const RUSSIAN_SOUNDS = [
  "С", "Сь", "З", "Зь", "Ц",
  "Ш", "Ж", "Ч", "Щ",
  "Л", "Ль", "Р", "Рь",
  "К", "Кь", "Г", "Гь", "Х", "Хь",
  "Й", "В", "Ф", "Б", "Д", "Т", "Н", "М",
] as const;

export const SOUND_GROUPS: Record<string, string[]> = {
  "Свистящие": ["С", "Сь", "З", "Зь", "Ц"],
  "Шипящие": ["Ш", "Ж", "Ч", "Щ"],
  "Сонорные": ["Л", "Ль", "Р", "Рь"],
  "Заднеязычные": ["К", "Кь", "Г", "Гь", "Х", "Хь"],
  "Прочие": ["Й", "В", "Ф", "Б", "Д", "Т", "Н", "М"],
};

export const SESSION_STATUSES = [
  { value: "PLANNED", label: "Запланировано", color: "bg-blue-100 text-blue-700" },
  { value: "COMPLETED", label: "Проведено", color: "bg-green-100 text-green-700" },
  { value: "CANCELLED", label: "Отменено", color: "bg-red-100 text-red-700" },
  { value: "MISSED", label: "Пропущено", color: "bg-orange-100 text-orange-700" },
] as const;

export const CLIENT_SOURCES = [
  { value: "PRIVATE", label: "Частная практика" },
  { value: "INSTITUTION", label: "Учреждение" },
] as const;

export const CLIENT_STATUSES = [
  { value: "ACTIVE", label: "Активный", color: "bg-green-100 text-green-700" },
  { value: "COMPLETED", label: "Завершён", color: "bg-blue-100 text-blue-700" },
  { value: "ARCHIVED", label: "Архив", color: "bg-gray-100 text-gray-600" },
] as const;
