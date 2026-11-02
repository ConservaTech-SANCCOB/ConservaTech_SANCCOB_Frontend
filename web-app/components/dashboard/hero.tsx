import Link from "next/link";
import { PenguinMascot } from "../ui/penguin";
import { ICONS, LineIcon } from "../ui/line-icon";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Welcome banner at the top of the Dashboard: ocean waves, the penguin mascot, a greeting with the
// admin's first name, one sentence about the week, and the two things Cathy does most.
// The ocean colours stay the same in dark mode, the way a picture would.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function DashboardHero({ greeting, name, summary }: { greeting: string; name: string; summary: string }) {
  return (
    <section
      aria-labelledby="dashboard-hello"
      className="relative overflow-hidden rounded-[28px] bg-[#1F4E6E] text-white min-h-[270px] px-6 sm:px-10 pt-8 pb-7 flex flex-wrap items-end justify-between gap-6"
    >
      {/* Four layers of waves, lighter towards the bottom */}
      <svg aria-hidden="true" viewBox="0 0 1100 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <path d="M0 96C150 74 290 116 440 96C590 76 730 112 880 92C980 79 1050 90 1100 84V300H0Z" fill="#22536F" />
        <path d="M0 156C140 136 300 176 450 158C600 140 740 172 890 152C990 139 1060 150 1100 146V300H0Z" fill="#275B79" />
        <path d="M0 212C160 194 300 230 460 214C620 198 760 226 910 208C1000 197 1060 206 1100 202V300H0Z" fill="#2C6383" />
        <path d="M0 262C150 248 310 278 470 264C630 250 770 274 920 258C1010 249 1060 256 1100 254V300H0Z" fill="#326B8B" />
      </svg>
      {/* Three seagulls */}
      <svg aria-hidden="true" width="150" height="60" viewBox="0 0 150 60" className="absolute top-7 right-[210px] hidden md:block">
        <path
          d="M10 30c6-7 11-7 15 0 4-7 9-7 15 0M78 14c5-6 9-6 12 0 3-6 7-6 12 0M118 40c4-5 7-5 10 0 3-5 6-5 9 0"
          fill="none"
          stroke="#CFE8F7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative flex flex-col gap-2.5 max-w-[660px]">
        <span className="text-sm font-black tracking-[0.18em] uppercase text-[#9FD3F0]">{greeting}</span>
        <h1 id="dashboard-hello" className="text-5xl font-black leading-[1.05] [text-shadow:0_2px_8px_rgba(0,0,0,0.25)]">
          {name}
        </h1>
        <p className="text-lg leading-normal text-[#E6F2FA]">{summary}</p>
        <div className="flex flex-wrap gap-3 mt-2.5">
          <Link
            href="/roster"
            className="min-h-13 px-6 rounded-full bg-sand text-sand-ink font-black inline-flex items-center gap-2.5 shadow-[0_4px_0_#D9B94A] hover:brightness-105 transition"
          >
            Open this week&apos;s roster
            <LineIcon d={ICONS.arrowRight} strokeWidth={2.4} />
          </Link>
          <Link
            href="/room"
            className="min-h-13 px-5.5 rounded-full bg-sidebar border-2 border-[#9FD3F0] text-white font-extrabold inline-flex items-center gap-2.5 hover:bg-sidebar-hover transition-colors"
          >
            <LineIcon d={ICONS.tv} />
            Show the room screen
          </Link>
        </div>
      </div>

      {/* Only on wide screens, so it never pushes the buttons down */}
      <PenguinMascot className="relative shrink-0 self-end -mb-3.5 mr-2 hidden xl:block" />
    </section>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//
