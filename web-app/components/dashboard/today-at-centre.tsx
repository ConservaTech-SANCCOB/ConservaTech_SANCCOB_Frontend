import Link from "next/link";
import { SLOT_INFO, type CentreWeek, type ShiftSpot } from "../../app/lib/centre-week";
import { PenguinFace } from "../ui/penguin";
import { SlotChip } from "../ui/slot-chip";
import { ICONS, LineIcon } from "../ui/line-icon";
import { buttonOutline, card, sectionTitle } from "../ui/styles";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// "Today at the centre": today's shifts grouped by time slot. Each area shows who is coming as a
// penguin name chip, every empty place as a dashed "Open spot" that links to Vacancies, and
// "Full" or "2 open" on the right.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

// More open places than this in one area shows as one pill ("5 open spots") instead of five.
const MAX_OPEN_PILLS = 3;

export function TodayAtCentre({ week, loaded, error }: { week: CentreWeek | null; loaded: boolean; error: string }) {
  const spots = week?.today.flatMap((g) => g.spots) ?? [];
  const capacity = spots.reduce((sum, s) => sum + s.capacity, 0);
  const open = spots.reduce((sum, s) => sum + s.open, 0);

  let subtitle = "Loading today's shifts…";
  if (loaded && error) subtitle = "Today's shifts couldn't be loaded.";
  else if (loaded && spots.length === 0) subtitle = "No shifts are set up for today.";
  else if (loaded && open === 0) subtitle = `All ${capacity} spots are filled`;
  else if (loaded) subtitle = `${capacity - open} of ${capacity} spots filled, ${open} still open`;

  return (
    <section aria-labelledby="today-title" className={`${card} flex-[1.6_1_560px] min-w-0 px-6.5 py-6 flex flex-col gap-4.5`}>
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="today-title" className={sectionTitle}>
            Today at the centre
          </h2>
          <span className="text-ink-muted">{subtitle}</span>
        </div>
        <Link href="/room" className={buttonOutline}>
          <LineIcon d={ICONS.tv} />
          Show on the room TV
        </Link>
      </div>

      {loaded && error && (
        <p className="text-sm font-semibold text-urgent-ink bg-urgent rounded-2xl px-4 py-3">{error}</p>
      )}

      {week?.today.map((group) => (
        <div key={group.slot} className="flex flex-col">
          <div className="flex flex-wrap items-center gap-3 pb-2">
            <SlotChip slot={group.slot} />
            <span className="font-extrabold text-ink-muted">{SLOT_INFO[group.slot].time}</span>
          </div>
          {group.spots.map((spot) => (
            <SpotRow key={spot.shiftId} spot={spot} />
          ))}
        </div>
      ))}
    </section>
  );
}

function SpotRow({ spot }: { spot: ShiftSpot }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 py-3 border-t border-line-soft">
      <span className="basis-[170px] shrink-0 font-extrabold">{spot.location}</span>

      <div className="flex-1 basis-60 min-w-0 flex flex-wrap gap-2">
        {spot.people.map((person) => (
          <span
            key={person.assignmentId}
            title={person.fullName}
            className="inline-flex items-center gap-2 min-h-10 pl-1.5 pr-3.5 rounded-full bg-tint font-extrabold"
          >
            <PenguinFace size={28} />
            {person.firstName}
          </span>
        ))}
        <OpenSpots spot={spot} />
      </div>

      <span className="shrink-0 min-w-21 flex justify-end font-black">
        {spot.open === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-ok-ink">
            <LineIcon d={ICONS.check} size={18} strokeWidth={2.8} />
            Full
          </span>
        ) : (
          <span className="text-open-ink">{spot.open} open</span>
        )}
      </span>
    </div>
  );
}

function OpenSpots({ spot }: { spot: ShiftSpot }) {
  if (spot.open === 0) return null;
  const pill =
    "inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border-2 border-dashed border-open-line bg-surface text-open-ink text-[0.94rem] font-extrabold hover:bg-tint transition-colors";
  const label = `Fill an open spot at ${spot.location}`;

  if (spot.open > MAX_OPEN_PILLS) {
    return (
      <Link href="/vacancies" aria-label={label} className={pill}>
        <LineIcon d={ICONS.plus} size={16} strokeWidth={2.8} />
        {spot.open} open spots
      </Link>
    );
  }
  return (
    <>
      {Array.from({ length: spot.open }, (_, i) => (
        <Link key={i} href="/vacancies" aria-label={label} className={pill}>
          <LineIcon d={ICONS.plus} size={16} strokeWidth={2.8} />
          Open spot
        </Link>
      ))}
    </>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//