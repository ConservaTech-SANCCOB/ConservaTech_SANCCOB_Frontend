//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Line icons for the redesign. Each icon is one SVG path on a 24 x 24 grid, drawn with a rounded
// line in the current text colour, so an icon always matches the text next to it.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

export const ICONS = {
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  swap: "M4 8h14l-3.5-3.5M20 16H6l3.5 3.5",
  personPlus: "M12.5 8.5a3.5 3.5 0 1 1-7 0a3.5 3.5 0 1 1 7 0M2.8 20c.9-3.5 3.3-5.3 6.2-5.3s5.3 1.8 6.2 5.3M18 8v6M15 11h6",
  calendarCheck: "M4 6h16v14H4zM4 10h16M8.5 3.5v4M15.5 3.5v4M9 15l2 2 4-4",
  tv: "M2.5 4h19v13h-19zM8 21h8M12 17v4",
  warning: "M12 3.5L2.5 20h19zM12 10v4.5M12 17.2v.3",
  // Morning is a cup of coffee, the afternoon is the sun, a full day is a clock.
  cup: "M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 9h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2M12 3v2",
  sun: "M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  clock: "M20.5 12a8.5 8.5 0 1 1-17 0a8.5 8.5 0 1 1 17 0M12 7.5V12l3 2",
  // General-purpose icons shared by the admin pages built after the Dashboard.
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  close: "M6 6l12 12M18 6L6 18",
  chevronDown: "M6 9l6 6 6-6",
  bolt: "M13 2L4 14h6l-1 8 9-12h-6z",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRightSm: "M9 5l7 7-7 7",
  location: "M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11ZM12 13.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z",
} as const;

export function LineIcon({
  d,
  size = 20,
  strokeWidth = 2,
  className,
}: {
  d: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className ?? ""}`}
    >
      <path d={d} />
    </svg>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//