const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easily-confused chars

export function generateShareCode(): string {
  let code = "";
  const arr = new Uint32Array(8);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 8; i++) code += ALPHABET[arr[i] % ALPHABET.length];
  return code;
}

export const EVENT_CATEGORIES = [
  {
    value: "wedding",
    label: "Wedding",
    emoji: "💍",
    desc: "Multi-day ceremonies — Haldi, Mehendi, Sangeet, Pheras, Reception.",
  },
  {
    value: "college_fest",
    label: "College Fest",
    emoji: "🎓",
    desc: "Annual fests, performances, sponsors, registrations.",
  },
  {
    value: "private_party",
    label: "Private Party",
    emoji: "🎉",
    desc: "Birthdays, anniversaries, engagements, house warmings.",
  },
  {
    value: "corporate",
    label: "Corporate Event",
    emoji: "💼",
    desc: "Conferences, product launches, team offsites.",
  },
] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORIES)[number]["value"];

export function categoryLabel(v: string) {
  return EVENT_CATEGORIES.find((c) => c.value === v)?.label ?? v;
}
export function categoryEmoji(v: string) {
  return EVENT_CATEGORIES.find((c) => c.value === v)?.emoji ?? "🎊";
}
