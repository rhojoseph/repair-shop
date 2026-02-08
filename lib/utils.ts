export function getTodayStringFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatPhone(value: string): string {
  let val = value.replace(/[^0-9]/g, '');
  if (val.length > 11) val = val.slice(0, 11);
  if (val.length > 7) val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7);
  else if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3);
  return val;
}

export const DEFAULT_CATEGORIES: Record<string, string[]> = {
  "바지": ["단수선", "기장수선", "통줄임", "허리줄임"],
  "자켓": ["소매줄임", "어깨줄임", "기장줄임"],
  "셔츠": ["소매줄임", "사이즈수선"],
  "코트": ["기장줄임", "안감수선"],
  "원피스": ["기장수선", "사이즈수선"],
  "가방": ["지퍼수리", "가죽수선"],
  "기타": ["단추", "지퍼", "기타수선"],
};
