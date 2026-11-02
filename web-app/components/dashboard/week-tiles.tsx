import Link from "next/link";
import { getMonday, weekRangeLabel, type CentreWeek, type DaySummary } from "../../app/lib/centre-week";
import { ICONS, LineIcon } from "../ui/line-icon";
import { buttonOutline, card, sectionTitle } from "../ui/styles";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// "This week": one tile per day with how full the morning and afternoon are, and a green "Full"
// or a peach "3 open" at the bottom. Today's tile has a navy border and a "Today" badge.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function WeekTiles({ week, loaded, error }: { week: CentreWeek | null; loaded: boolean; error: string }) {
  let subtitle = weekRangeLabel(getMonday());
  if (week && week.totalSpots > 0) subtitle += ` · ${week.filledSpots} of ${week.totalSpots} spots filled`;

  return (
    <section aria-labelledby="week-title" className={`${card} px-6.5 py-6 flex flex-col gap-4.5`}>
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="week-title" className={sectionTitle}>
            This week
          </h2>
          <span className="text-ink-muted">{subtitle}</span>
        </div>
        <Link href="/roster" className={buttonOutline}>
          Open the full roster
          <LineIcon d={ICONS.arrowRight} size={18} strokeWidth={2.4} />
        </Link>
      </div>

      {!loaded && <p className="text-ink-muted">Loading this week…</p>}
      {loaded && error && (
        <p className="text-sm font-semibold text-urgent-ink bg-urgent rounded-2xl px-4 py-3">{error}</p>
      )}
      {week && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(130px,100%),1fr))] gap-3">
          {week.days.map((day) => (
            <DayTile key={day.date} day={day} />
          ))}
        </div>
      )}
    </section>
  );
}

function DayTile({ day }: { day: DaySummary }) {
  return (
    <div
      className={`rounded-[20px] px-2.5 py-3.5 flex flex-col items-center gap-1.5 text-center ${
        day.isToday ? "border-[2.5px] border-brand bg-tint" : "border-[1.5px] border-line bg-surface"
      }`}
    >
      <span className="text-sm font-black tracking-[0.12em] text-morning-ink">{day.weekday}</span>
      <span className="text-[2rem] font-black leading-none">{day.dayOfMonth}</span>
      {day.isToday && (
        <span className="text-xs font-black tracking-widest uppercase text-brand-ink bg-brand rounded-full px-2.5 py-0.5">
          Today
        </span>
      )}
      {day.capacity === 0 ? (
        <span className="mt-1 text-[0.94rem] font-bold text-ink-faint">No shifts</span>
      ) : (
        <>
          <span className="text-[0.94rem] font-bold text-ink-muted">
            Morning {day.morning.filled}/{day.morning.capacity}
          </span>
          <span className="text-[0.94rem] font-bold text-ink-muted">
            Afternoon {day.afternoon.filled}/{day.afternoon.capacity}
          </span>
          {day.open === 0 ? (
            <span className="mt-1 inline-flex items-center gap-1 text-[0.94rem] font-black text-ok-ink bg-ok rounded-full px-3 py-1">
              <LineIcon d={ICONS.check} size={15} strokeWidth={3} />
              Full
            </span>
          ) : (
            <span className="mt-1 text-[0.94rem] font-black text-morning-ink bg-morning rounded-full px-3 py-1">
              {day.open} open
            </span>
          )}
        </>
      )}
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//