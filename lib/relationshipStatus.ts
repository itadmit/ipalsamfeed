/** אפשרויות סטטוס זוגי בעברית (שמירה בשרת כמחרוזת) */
export const RELATIONSHIP_STATUS_OPTIONS = [
  "רווק/ה",
  "במערכת יחסים",
  "מאורס/ת",
  "נשוי/אה",
  "גרוש/ה",
  "אלמן/ה",
  "זה מסובך",
] as const;

const EN_TO_HE: Record<string, string> = {
  single: "רווק/ה",
  "in a relationship": "במערכת יחסים",
  engaged: "מאורס/ת",
  married: "נשוי/אה",
  divorced: "גרוש/ה",
  widowed: "אלמן/ה",
  "it's complicated": "זה מסובך",
  complicated: "זה מסובך",
};

/** תצוגה בעברית — כולל המרה מערכים ישנים באנגלית */
export function relationshipStatusDisplay(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const t = raw.trim();
  const mapped = EN_TO_HE[t.toLowerCase()];
  if (mapped) return mapped;
  return t;
}
