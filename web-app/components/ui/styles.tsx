//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Shared Tailwind class strings for the redesign, so every page's cards and buttons look the same.
// Use them on a <button>, a <Link> or an <a>, and add layout classes next to them when needed.
//</summary>
//---------------------------------------------------------------------------------------------------------------//

// White card with a soft border and big rounded corners.
export const card = "bg-surface border-[1.5px] border-line rounded-3xl";

// Card heading sizes: big for main sections, smaller for the three cards along the bottom.
export const sectionTitle = "text-2xl font-black text-ink-strong";
export const cardTitle = "text-xl font-black text-ink-strong";

// Main action: filled navy pill. Secondary action: navy outline pill.
export const buttonPrimary =
  "min-h-12 px-5 rounded-full bg-brand text-brand-ink font-extrabold inline-flex items-center justify-center gap-2 hover:bg-brand-hover disabled:opacity-60 transition-colors";
export const buttonOutline =
  "min-h-12 px-5 rounded-full border-2 border-brand bg-surface text-brand font-extrabold inline-flex items-center justify-center gap-2 hover:bg-tint disabled:opacity-60 transition-colors";

// Text inputs: tall, rounded, with a border that stays visible.
export const input =
  "w-full min-h-12 px-4 rounded-2xl border-2 border-line-strong bg-surface text-ink font-semibold placeholder:text-ink-faint focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/20";

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//