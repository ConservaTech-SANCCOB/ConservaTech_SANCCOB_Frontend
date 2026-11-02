import Link from "next/link";
import { ICONS, LineIcon } from "../ui/line-icon";
import { buttonPrimary, card } from "../ui/styles";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// One "Needs your attention" card: a coloured icon, a big number or word, one plain sentence,
// and one button that goes straight to where the job gets done.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

const TONES = {
  morning: "bg-morning text-morning-ink",
  afternoon: "bg-afternoon text-afternoon-ink",
  sand: "bg-warn text-warn-ink",
} as const;

export function AttentionCard({
  tone,
  icon,
  value,
  label,
  text,
  href,
  action,
}: {
  tone: keyof typeof TONES;
  icon: string;
  value: string | number;
  label: string;
  text: string;
  href: string;
  action: string;
}) {
  const buttonContent = (
    <>
      {action}
      <LineIcon d={ICONS.arrowRight} size={18} strokeWidth={2.4} />
    </>
  );

  return (
    <div className={`${card} px-6 py-5.5 flex flex-col gap-3`}>
      <div className="flex items-center gap-3.5">
        <span className={`w-13 h-13 shrink-0 rounded-2xl flex items-center justify-center ${TONES[tone]}`}>
          <LineIcon d={icon} size={26} strokeWidth={2.2} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-4xl font-black text-ink">{value}</span>
          <span className="font-extrabold text-ink">{label}</span>
        </span>
      </div>
      <p className="text-ink-muted leading-snug">{text}</p>
      {/* "#..." jumps to a section on this page, anything else is another page */}
      {href.startsWith("#") ? (
        <a href={href} className={`${buttonPrimary} mt-auto self-start`}>
          {buttonContent}
        </a>
      ) : (
        <Link href={href} className={`${buttonPrimary} mt-auto self-start`}>
          {buttonContent}
        </Link>
      )}
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//