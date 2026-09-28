// The only values the backend accepts for a volunteer's age bracket (anything else
// is a 400). Mirrors AGE_BRACKETS in web-app/app/lib/api/volunteers.ts — keep in sync.
export const AGE_BRACKETS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;

export type AgeBracket = (typeof AGE_BRACKETS)[number];

export function isAgeBracket(value: string | null | undefined): value is AgeBracket {
  return (AGE_BRACKETS as readonly string[]).includes(value ?? "");
}
