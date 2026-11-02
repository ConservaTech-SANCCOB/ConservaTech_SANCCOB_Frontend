"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { useCentreWeek } from "../../lib/use-centre-week";
import { buildRoomBoard, type BoardRow } from "../../lib/centre-week";
import { PenguinChick, PenguinFace, PenguinMascot } from "@/components/ui/penguin";
import { ICONS, LineIcon } from "@/components/ui/line-icon";

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Volunteer room screen, for the TV in the volunteer room: a flip board of today's shifts, who is on
// shift now (first names only), and a friendly ask where hands are missing.
//
// It is drawn at 1920 x 1080 and scaled to fit any screen, so it looks the same on a TV or a laptop.
// It reloads the roster every 5 minutes, turns the page every 12 seconds when there are more than six
// shifts, and asks the browser to keep the screen awake. Moving the mouse shows "Back" and "Full screen".
//</summary>
//---------------------------------------------------------------------------------------------------------------//

const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;
const ROWS_PER_PAGE = 6;
const PAGE_SECONDS = 12;
const REFRESH_MS = 5 * 60 * 1000;
const MAX_CREW = 18;

// Letters per column on the board
const TIME_TILES = 5;
const WHERE_TILES = 16;
const STATUS_TILES = 7;

const SET_COLOUR = "#9BE58A";
const NEED_COLOUR = "#F8DD78";
const SKY = "#9FD3F0";

const HEADINGS = {
  morning: "Good morning! Here is today.",
  afternoon: "Good afternoon! Here is today.",
  evening: "Thank you for today!",
};

// Window size and a once-a-second clock, read without setState-in-effect.
function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}
function subscribeSecond(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// Keeps the TV from going to sleep while the page is open, where the browser supports it.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function useKeepScreenAwake() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        // Not allowed or not supported; the screen may dim, nothing else breaks.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);
}

export default function RoomScreenPage() {
  const { token, logout } = useAuth();
  const { week, error, loaded } = useCentreWeek(token, logout, REFRESH_MS);
  useKeepScreenAwake();

  const scale = useSyncExternalStore(
    subscribeResize,
    () => Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT),
    () => 1
  );
  const second = useSyncExternalStore(subscribeSecond, () => Math.floor(Date.now() / 1000), () => 0);
  const now = new Date(second * 1000);

  const board = buildRoomBoard(week, now);
  const pages = Math.max(1, Math.ceil(board.rows.length / ROWS_PER_PAGE));
  const page = Math.floor(second / PAGE_SECONDS) % pages;
  const pageRows = board.rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // One message row when there's nothing to list
  let message: string | null = null;
  if (!loaded) message = "LOADING";
  else if (error && !week) message = "NO CONNECTION";
  else if (board.rows.length === 0) message = "NO SHIFTS TODAY";

  // "Back" and "Full screen" appear for 3 seconds after the mouse moves, so the TV stays clean.
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showControls = () => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  };
  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const toggleFullScreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const crew = board.crew.slice(0, MAX_CREW);
  const extraCrew = board.crew.length - crew.length;

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#0E3754] text-white"
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <div
        className={`absolute top-4 left-4 z-10 flex gap-2 transition-opacity duration-300 focus-within:opacity-100 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Link
          href="/dashboard"
          className="min-h-11 px-4 rounded-full bg-white/15 font-bold inline-flex items-center gap-2 hover:bg-white/25"
        >
          <LineIcon d="M19 12H5M11 6l-6 6 6 6" size={18} strokeWidth={2.4} />
          Back to the dashboard
        </Link>
        <button
          type="button"
          onClick={toggleFullScreen}
          className="min-h-11 px-4 rounded-full bg-white/15 font-bold inline-flex items-center gap-2 hover:bg-white/25"
        >
          <LineIcon d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" size={18} strokeWidth={2.4} />
          Full screen
        </button>
      </div>

      {/* The 1920 x 1080 stage, centred and scaled to fit */}
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden px-[80px] pt-[56px] pb-[48px] box-border"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <svg aria-hidden="true" viewBox="0 0 1920 240" preserveAspectRatio="none" className="absolute left-0 bottom-0 w-[1920px] h-[240px]">
          <path d="M0 40C220 10 420 70 660 44C900 18 1120 66 1360 40C1580 16 1760 50 1920 34V240H0Z" fill="#164462" />
          <path d="M0 100C240 74 460 126 700 104C940 82 1160 124 1400 100C1620 78 1780 108 1920 96V240H0Z" fill="#1C4D6C" />
          <path d="M0 160C230 138 470 182 710 162C950 142 1170 178 1410 156C1630 136 1790 162 1920 154V240H0Z" fill="#245878" />
          <path d="M0 212C240 196 480 228 720 214C960 200 1180 226 1420 210C1640 196 1800 214 1920 208V240H0Z" fill="#2D6384" />
        </svg>
        <svg aria-hidden="true" width="230" height="80" viewBox="0 0 150 60" className="absolute top-[64px] right-[430px]">
          <path
            d="M10 30c6-7 11-7 15 0 4-7 9-7 15 0M78 14c5-6 9-6 12 0 3-6 7-6 12 0M118 40c4-5 7-5 10 0 3-5 6-5 9 0"
            fill="none"
            stroke="#CFE8F7"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative h-full flex flex-col gap-[30px]">
          {/* Heading and clock */}
          <div className="flex justify-between items-start gap-[40px]">
            <div className="flex flex-col gap-[14px]">
              <div className="flex items-center gap-[14px]">
                <span className="w-[56px] h-[56px] shrink-0 rounded-full bg-white flex items-center justify-center">
                  <PenguinFace size={42} />
                </span>
                <span className="text-[22px] font-black tracking-[0.2em] uppercase" style={{ color: SKY }}>
                  SANCCOB · Volunteer room
                </span>
              </div>
              <h1 className="text-[76px] font-black leading-[1.02] tracking-[-0.01em] [text-shadow:0_3px_12px_rgba(0,0,0,0.3)]">
                {HEADINGS[board.part]}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-[6px] shrink-0">
              <span className="text-[120px] font-black leading-[0.9] tracking-[0.02em] tabular-nums">
                {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-[30px] font-extrabold" style={{ color: SKY }}>
                {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>
          </div>

          {/* Flip board */}
          <div className="relative self-start bg-[#0A2C46] rounded-[28px] px-[36px] pt-[26px] pb-[30px] flex flex-col gap-[12px]">
            <ul className="sr-only">
              {message ? <li>{message.toLowerCase()}</li> : board.rows.map((row, i) => <li key={i}>{row.spoken}</li>)}
            </ul>
            <div aria-hidden="true" className="flex flex-col gap-[12px]">
              <div className="flex gap-[36px] text-[18px] font-black tracking-[0.22em]" style={{ color: SKY }}>
                <span className="w-[236px] shrink-0">TIME</span>
                <span className="w-[764px] shrink-0">WHERE</span>
                <span className="w-[332px] shrink-0">STATUS</span>
              </div>
              {/* A new page remounts the rows, so the letters flip in again */}
              <div key={page} className="flex flex-col gap-[12px]" style={{ minHeight: pages > 1 ? ROWS_PER_PAGE * 72 - 12 : undefined }}>
                {message ? (
                  <BoardLine row={{ time: "", where: message, status: "", allSet: true, spoken: "" }} index={0} />
                ) : (
                  pageRows.map((row, i) => <BoardLine key={`${row.time}-${row.where}-${i}`} row={row} index={i} />)
                )}
              </div>
              {pages > 1 && (
                <span className="self-end text-[18px] font-black tracking-[0.22em]" style={{ color: SKY }}>
                  PAGE {page + 1} OF {pages}
                </span>
              )}
            </div>
          </div>

          {/* Who is on shift, and where help is needed */}
          {board.part !== "evening" && (
            <div className="flex flex-col gap-[16px] max-w-[1480px]">
              <span className="text-[20px] font-black tracking-[0.22em]" style={{ color: SKY }}>
                {board.part === "morning" ? "ON SHIFT THIS MORNING" : "ON SHIFT THIS AFTERNOON"}
              </span>
              {crew.length > 0 && (
                <div className="flex flex-wrap gap-[12px] max-w-[1280px]">
                  {crew.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-[10px] h-[56px] pl-[10px] pr-[22px] rounded-full bg-[#154766] text-[26px] font-black"
                    >
                      <PenguinFace size={36} />
                      {name}
                    </span>
                  ))}
                  {extraCrew > 0 && (
                    <span className="inline-flex items-center h-[56px] px-[22px] rounded-full bg-[#154766] text-[26px] font-black">
                      +{extraCrew} more
                    </span>
                  )}
                </div>
              )}
              {board.callout && (
                <div className="self-start inline-flex items-center gap-[14px] mt-[6px] bg-[#F8DD78] text-[#3E2E04] rounded-full pl-[22px] pr-[30px] py-[14px] text-[28px] font-black shadow-[0_6px_0_#C9A93E]">
                  <LineIcon d={ICONS.sun} size={34} strokeWidth={2.2} />
                  {board.callout}
                </div>
              )}
            </div>
          )}
        </div>

        <PenguinMascot width={200} className="absolute right-[96px] bottom-[36px] animate-bob motion-reduce:animate-none" />
        <PenguinChick width={84} className="absolute right-[290px] bottom-[40px]" />
      </div>
    </div>
  );
}

//---------------------------------------------------------------------------------------------------------------//
//<summary>
// One row of the flip board: time, place and status, each letter on its own tile. Letters flip in
// one after another (a little later for each row), and a changed letter flips again.
//</summary>
//---------------------------------------------------------------------------------------------------------------//
function BoardLine({ row, index }: { row: BoardRow; index: number }) {
  const cells = [
    { text: row.time, width: TIME_TILES, colour: "#FFFFFF" },
    { text: row.where, width: WHERE_TILES, colour: "#FFFFFF" },
    { text: row.status, width: STATUS_TILES, colour: row.allSet ? SET_COLOUR : NEED_COLOUR },
  ];
  let tile = 0;

  return (
    <div className="flex gap-[36px]">
      {cells.map((cell, c) => (
        <div key={c} className="flex gap-[4px]">
          {cell.text
            .padEnd(cell.width)
            .slice(0, cell.width)
            .split("")
            .map((ch, i) => {
              const delay = index * 110 + tile++ * 26;
              return (
                <span
                  key={`${i}-${ch}`}
                  style={{ color: cell.colour, animationDelay: `${delay}ms` }}
                  className="relative inline-flex items-center justify-center shrink-0 w-[44px] h-[60px] rounded-[6px] bg-[linear-gradient(#15496B_0_50%,#103D5B_50%_100%)] text-[36px] font-black leading-none shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)] animate-flip motion-reduce:animate-none after:content-[''] after:absolute after:inset-x-0 after:top-1/2 after:h-[2px] after:bg-[#082A42]"
                >
                  {ch === " " ? " " : ch}
                </span>
              );
            })}
        </div>
      ))}
    </div>
  );
}

//------------------------------------0-0-0- End Of File -0-0-0------------------------------------------------------//