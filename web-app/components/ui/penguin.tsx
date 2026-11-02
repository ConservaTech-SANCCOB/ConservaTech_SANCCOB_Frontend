//---------------------------------------------------------------------------------------------------------------//
//<summary>
// The SANCCOB penguin face: an African penguin with the pink patches above its eyes.
// Used as the portal logo and, later, for volunteer avatars. Drawn in SVG so it stays sharp
// at any size and needs no image file. The colours stay the same in light and dark mode.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

const FEATHERS = "#1F2430";
const FACE = "#FFFFFF";
const PINK_PATCH = "#F4A3B5";

export function PenguinFace({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className={className}>
      <circle cx="14" cy="14" r="14" fill={FEATHERS} />
      <ellipse cx="14" cy="16.6" rx="9" ry="8" fill={FACE} />
      <ellipse cx="10" cy="12.6" rx="2.6" ry="1.4" fill={PINK_PATCH} />
      <ellipse cx="18" cy="12.6" rx="2.6" ry="1.4" fill={PINK_PATCH} />
      <circle cx="10.6" cy="15.6" r="1.8" fill={FEATHERS} />
      <circle cx="17.4" cy="15.6" r="1.8" fill={FEATHERS} />
      <path d="M12.6 18.6h2.8L14 20.6z" fill={FEATHERS} />
    </svg>
  );
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// The whole penguin, standing, with the black chest band and spots African penguins have.
// Used as the mascot on the Dashboard's welcome banner. Decoration only, so screen readers skip it.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function PenguinMascot({ width = 132, className }: { width?: number; className?: string }) {
  return (
    <svg width={width} height={width * 1.25} viewBox="0 0 120 150" aria-hidden="true" className={className}>
      <ellipse cx="60" cy="145" rx="34" ry="5" fill="#0A2C46" opacity="0.45" />
      <ellipse cx="46" cy="141" rx="12" ry="5" fill="#2A2F3A" />
      <ellipse cx="74" cy="141" rx="12" ry="5" fill="#2A2F3A" />
      <path d="M22 72C10 86 8 103 14 116C21 107 25 95 27 83Z" fill={FEATHERS} />
      <path d="M98 72C110 86 112 103 106 116C99 107 95 95 93 83Z" fill={FEATHERS} />
      <path d="M60 16C31 16 19 47 19 84C19 118 37 141 60 141C83 141 101 118 101 84C101 47 89 16 60 16Z" fill={FEATHERS} />
      <path d="M60 62C41 62 33 83 33 103C33 125 45 137 60 137C75 137 87 125 87 103C87 83 79 62 60 62Z" fill={FACE} />
      <path d="M37 80C49 88 71 88 83 80" fill="none" stroke={FEATHERS} strokeWidth="4" strokeLinecap="round" />
      <circle cx="68" cy="102" r="2" fill={FEATHERS} />
      <circle cx="52" cy="112" r="1.6" fill={FEATHERS} />
      <circle cx="72" cy="116" r="1.4" fill={FEATHERS} />
      <path d="M60 29C44 29 35 39 35 52C35 63 45 70 60 70C75 70 85 63 85 52C85 39 76 29 60 29Z" fill={FACE} />
      <ellipse cx="47" cy="42" rx="7" ry="4" fill={PINK_PATCH} />
      <ellipse cx="73" cy="42" rx="7" ry="4" fill={PINK_PATCH} />
      <circle cx="48" cy="51" r="6.5" fill={FEATHERS} />
      <circle cx="50.2" cy="48.8" r="2.2" fill={FACE} />
      <circle cx="72" cy="51" r="6.5" fill={FEATHERS} />
      <circle cx="74.2" cy="48.8" r="2.2" fill={FACE} />
      <path d="M55 59H65L60 66Z" fill="#2B303C" />
    </svg>
  );
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// A fluffy grey penguin chick that stands next to the mascot on the room screen. Decoration only.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
export function PenguinChick({ width = 84, className }: { width?: number; className?: string }) {
  return (
    <svg width={width} height={width * 1.25} viewBox="0 0 80 100" aria-hidden="true" className={className}>
      <ellipse cx="40" cy="96" rx="22" ry="4" fill="#082A42" opacity="0.6" />
      <path d="M40 14C22 14 12 34 12 58C12 82 24 94 40 94C56 94 68 82 68 58C68 34 58 14 40 14Z" fill="#8D99A8" />
      <path d="M40 44C29 44 23 58 23 70C23 84 30 91 40 91C50 91 57 84 57 70C57 58 51 44 40 44Z" fill="#E9EDF2" />
      <circle cx="32" cy="34" r="4" fill={FEATHERS} />
      <circle cx="33.4" cy="32.8" r="1.3" fill={FACE} />
      <circle cx="48" cy="34" r="4" fill={FEATHERS} />
      <circle cx="49.4" cy="32.8" r="1.3" fill={FACE} />
      <path d="M36.5 40H43.5L40 45Z" fill="#2B303C" />
      <path d="M38 14c0-5 4-7 6-5" fill="none" stroke="#8D99A8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//