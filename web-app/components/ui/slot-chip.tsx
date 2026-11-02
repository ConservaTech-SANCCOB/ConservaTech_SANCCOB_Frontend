import { SLOT_INFO, type SlotKey } from "../../app/lib/centre-week";
import { ICONS, LineIcon } from "./line-icon";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// A coloured label for a shift's time slot, matching the mobile app: peach with a coffee cup for
// the morning, sky blue with a sun for the afternoon, and sand with a clock for a full day.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

const SLOT_STYLE: Record<SlotKey, { chip: string; icon: string }> = {
  morning: { chip: "bg-morning text-morning-ink", icon: ICONS.cup },
  afternoon: { chip: "bg-afternoon text-afternoon-ink", icon: ICONS.sun },
  fullday: { chip: "bg-warn text-warn-ink", icon: ICONS.clock },
  other: { chip: "bg-surface-sunken text-ink-strong", icon: ICONS.clock },
};

export function SlotChip({ slot }: { slot: SlotKey }) {
  const style = SLOT_STYLE[slot];
  return (
    <span className={`inline-flex items-center gap-2 min-h-9 px-3.5 rounded-full font-black ${style.chip}`}>
      <LineIcon d={style.icon} size={18} strokeWidth={2.2} />
      {SLOT_INFO[slot].label}
    </span>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//