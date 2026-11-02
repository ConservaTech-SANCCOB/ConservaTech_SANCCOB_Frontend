import Link from "next/link";
import { SLOT_START, type CentreWeek } from "../../app/lib/centre-week";
import type { ConservationStats, TrainingVolunteerSummary } from "../../app/lib/api/dashboard";
import type { Section } from "../../app/lib/use-section";
import { ICONS, LineIcon } from "../ui/line-icon";
import { buttonOutline, buttonPrimary, card, cardTitle } from "../ui/styles";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// The three smaller cards along the bottom of the Dashboard: a preview of the volunteer room
// screen, conservation impact, and training progress.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

// ------------------------------------ Volunteer room screen ------------------------------------ //

// The preview is a tiny flip board: 23 letters per row, the place in white and SET (green) or
// NEED (sand) at the end. Decoration only; the real board is the room screen page.
const BOARD_WIDTH = 23;
const FLAP_TEXT = "#FFFFFF";
const FLAP_SET = "#9BE58A";
const FLAP_NEED = "#F8DD78";

function boardRows(week: CentreWeek | null) {
  const spots = week?.today.flatMap((g) => g.spots).slice(0, 4) ?? [];
  const lines =
    spots.length === 0
      ? [{ text: "NO SHIFTS TODAY", set: true }]
      : spots.map((s) => ({
          text: `${`${SLOT_START[s.slot]} ${s.location.toUpperCase()}`.trim().slice(0, 18).padEnd(18)} ${s.open === 0 ? "SET " : "NEED"}`,
          set: s.open === 0,
        }));

  return lines.map(({ text, set }) =>
    text
      .padEnd(BOARD_WIDTH)
      .slice(0, BOARD_WIDTH)
      .split("")
      .map((ch, i) => ({
        ch: ch === " " ? " " : ch,
        color: spots.length > 0 && i >= 19 ? (set ? FLAP_SET : FLAP_NEED) : FLAP_TEXT,
      }))
  );
}

export function RoomScreenCard({ week }: { week: CentreWeek | null }) {
  return (
    <section aria-labelledby="room-title" className={`${card} p-6 flex flex-col gap-3.5`}>
      <h2 id="room-title" className={cardTitle}>
        Volunteer room screen
      </h2>

      {/* A little TV on a stand */}
      <div aria-hidden="true" className="self-center flex flex-col items-center">
        <div className="bg-[#0E3754] border-[7px] border-[#C3CFDA] rounded-xl p-3 flex flex-col gap-1">
          {boardRows(week).map((row, r) => (
            <div key={r} className="flex gap-0.5">
              {row.map((tile, i) => (
                <span
                  key={i}
                  style={{ color: tile.color }}
                  className="inline-flex items-center justify-center shrink-0 w-[9px] h-[14px] rounded-[2px] bg-[linear-gradient(#15496B_0_50%,#103D5B_50%_100%)] text-[8px] font-black leading-none"
                >
                  {tile.ch}
                </span>
              ))}
            </div>
          ))}
        </div>
        <span className="block w-12 h-3 bg-[#C3CFDA]" />
        <span className="block w-[110px] h-1.5 rounded-sm bg-[#C3CFDA]" />
      </div>

      <p className="text-ink-muted leading-snug">Today&apos;s shifts on the TV in the volunteer room. First names only.</p>
      <Link href="/room" className={`${buttonPrimary} self-start`}>
        Open room screen
        <LineIcon d={ICONS.arrowRight} size={18} strokeWidth={2.4} />
      </Link>
    </section>
  );
}

// ------------------------------------ Conservation impact ------------------------------------ //

export function ImpactCard({
  section,
  year,
  years,
  onYearChange,
  onEdit,
}: {
  section: Section<ConservationStats>;
  year: number;
  years: number[];
  onYearChange: (year: number) => void;
  onEdit: () => void;
}) {
  const data = section.data;
  const percent = data && data.totalRescued > 0 ? Math.min(100, Math.round(data.percentReleased)) : 0;

  return (
    <section aria-labelledby="impact-title" className={`${card} p-6 flex flex-col gap-3.5`}>
      {/* The year sits under the title, so the title stays on one line in a narrow card */}
      <div className="flex flex-col gap-2">
        <h2 id="impact-title" className={cardTitle}>
          Conservation impact
        </h2>
        <label className="self-start inline-flex items-center gap-2 font-bold text-ink-muted">
          Year
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="min-h-9 font-extrabold text-ink bg-surface-muted border-[1.5px] border-line rounded-full px-3 hover:bg-tint cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!section.loaded && <p className="text-ink-muted">Loading…</p>}
      {section.loaded && !data && (
        <p className="text-sm font-semibold text-urgent-ink bg-urgent rounded-2xl px-4 py-3">
          {section.error || "Couldn't load conservation data."}
        </p>
      )}
      {data && (
        <>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[2.6rem] font-black leading-none text-ok-ink">{data.totalReleased.toLocaleString("en-ZA")}</span>
            <span className="text-lg font-extrabold">birds released</span>
          </div>
          <div
            role="img"
            aria-label={`${percent} percent of rescued birds released`}
            className="h-4 rounded-lg bg-ok overflow-hidden"
          >
            <span className="block h-full rounded-lg bg-ok-bar" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-ink-muted leading-snug">
            {data.totalRescued > 0
              ? `That is ${percent}% of the ${data.totalRescued.toLocaleString("en-ZA")} birds rescued in ${year}.`
              : `No rescues are recorded for ${year} yet.`}
          </p>
        </>
      )}

      <button type="button" onClick={onEdit} className={`${buttonOutline} self-start`}>
        Update the numbers
      </button>
    </section>
  );
}

// ------------------------------------ Training ------------------------------------ //

const MAX_TRAINING_ROWS = 3;

export function TrainingCard({ section }: { section: Section<TrainingVolunteerSummary[]> }) {
  const people = section.data ?? [];

  return (
    <section aria-labelledby="training-title" className={`${card} p-6 flex flex-col gap-4`}>
      <h2 id="training-title" className={cardTitle}>
        Training
      </h2>

      {!section.loaded && <p className="text-ink-muted">Loading…</p>}
      {section.loaded && section.error && (
        <p className="text-sm font-semibold text-urgent-ink bg-urgent rounded-2xl px-4 py-3">{section.error}</p>
      )}
      {section.loaded && !section.error && people.length === 0 && (
        <p className="text-ink-muted">No volunteers are in training right now.</p>
      )}

      {people.slice(0, MAX_TRAINING_ROWS).map((v) => {
        const percent = Math.min(100, Math.max(0, Math.round(v.progressPercentage)));
        const name = `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || "Unnamed volunteer";
        return (
          <div key={v.userId} className="flex flex-col gap-2">
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
              <span className="font-extrabold">{name}</span>
              <span className="text-ink-muted">
                {v.completedSkills} of {v.totalRequiredSkills} skills
              </span>
            </div>
            <div role="img" aria-label={`${name}: ${percent} percent trained`} className="h-3 rounded-md bg-ok overflow-hidden">
              <span className="block h-full rounded-md bg-ok-bar" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}

      <Link href="/training-staff" className="self-start min-h-12 inline-flex items-center gap-2 font-extrabold text-ok-ink hover:underline">
        Open the training hub
        <LineIcon d={ICONS.arrowRight} size={18} strokeWidth={2.4} />
      </Link>
    </section>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//