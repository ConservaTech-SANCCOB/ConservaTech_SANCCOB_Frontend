import { api } from "../utils/api";

function parseHoursResponse(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidate = obj.totalHours ?? obj.hours ?? obj.value;
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
  }
  return null;
}

export async function getMyTotalHours(): Promise<number | null> {
  const raw = await api.get<unknown>("/api/Attendance/me/hours");
  return parseHoursResponse(raw);
}
