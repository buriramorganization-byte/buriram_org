import { Tournament } from "../types";

export type MatchGroup = "GROUP_A" | "GROUP_B" | "GROUP_C";

export interface ProcessedMatch {
  tournament: Tournament;
  group: MatchGroup;
  effectiveStartMs: number;
  effectiveStartDateTime: string;
  isLive: boolean;
  isGroupA: boolean;
  isGroupB: boolean;
  isGroupC: boolean;
  isBookingClosed: boolean;
  slotsLeft: number;
  takenSlots: number;
}

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * Process a single tournament's status based on current time (nowMs)
 * Group A: Available Matches (Countdown running, slots open, start time in future today/upcoming)
 * Group B: Live Matches (Start time arrived, 1-hour live window active, booking strictly closed)
 * Group C: Next Day / Rollover Matches (1-hour live window finished today, rolled over to tomorrow's slot)
 */
export function processMatch(tournament: Tournament, nowMs: number = Date.now()): ProcessedMatch {
  const originalStartMs = new Date(tournament.startDateTime).getTime();

  if (isNaN(originalStartMs)) {
    const slotsLeft = Math.max(0, tournament.totalSlots - tournament.takenSlots);
    return {
      tournament,
      group: "GROUP_A",
      effectiveStartMs: nowMs + ONE_HOUR,
      effectiveStartDateTime: tournament.startDateTime,
      isLive: false,
      isGroupA: true,
      isGroupB: false,
      isGroupC: false,
      isBookingClosed: false,
      slotsLeft,
      takenSlots: tournament.takenSlots,
    };
  }

  // 1. If start time is strictly in the future relative to nowMs
  if (originalStartMs > nowMs) {
    const slotsLeft = Math.max(0, tournament.totalSlots - tournament.takenSlots);
    const isFull = slotsLeft <= 0;
    
    return {
      tournament: {
        ...tournament,
        takenSlots: tournament.takenSlots,
      },
      group: "GROUP_A",
      effectiveStartMs: originalStartMs,
      effectiveStartDateTime: tournament.startDateTime,
      isLive: false,
      isGroupA: true,
      isGroupB: false,
      isGroupC: false,
      isBookingClosed: isFull || tournament.status === "Completed",
      slotsLeft,
      takenSlots: tournament.takenSlots,
    };
  }

  // 2. If nowMs is within the 1-hour LIVE window starting at originalStartMs
  if (nowMs >= originalStartMs && nowMs < originalStartMs + ONE_HOUR) {
    return {
      tournament: {
        ...tournament,
        takenSlots: tournament.takenSlots,
      },
      group: "GROUP_B",
      effectiveStartMs: originalStartMs,
      effectiveStartDateTime: tournament.startDateTime,
      isLive: true,
      isGroupA: false,
      isGroupB: true,
      isGroupC: false,
      isBookingClosed: true, // Strictly closed during live match
      slotsLeft: Math.max(0, tournament.totalSlots - tournament.takenSlots),
      takenSlots: tournament.takenSlots,
    };
  }

  // 3. Otherwise, originalStartMs + 1 Hour < nowMs.
  // Evaluate relative to today's date HH:MM for daily recurring time-slot automation
  const origDate = new Date(originalStartMs);
  const nowDate = new Date(nowMs);
  
  const todayStart = new Date(nowDate);
  todayStart.setHours(origDate.getHours(), origDate.getMinutes(), origDate.getSeconds(), origDate.getMilliseconds());
  const todayStartMs = todayStart.getTime();

  let effectiveStartMs: number;
  let group: MatchGroup;
  let isLive = false;
  let isBookingClosed = false;
  let takenSlots = tournament.takenSlots;

  if (nowMs < todayStartMs) {
    // Current time is before today's match time (e.g., 12:05 AM < 3:00 PM today)
    // Shifts automatically into Group A (Available Matches) for today!
    effectiveStartMs = todayStartMs;
    group = "GROUP_A";
    isBookingClosed = false;
  } else if (nowMs >= todayStartMs && nowMs < todayStartMs + ONE_HOUR) {
    // Currently in today's 1-hour LIVE window
    effectiveStartMs = todayStartMs;
    group = "GROUP_B";
    isLive = true;
    isBookingClosed = true;
  } else {
    // Today's 1-hour live window finished!
    // Rollover to Tomorrow (Next Day Booking)
    effectiveStartMs = todayStartMs + ONE_DAY;
    group = "GROUP_C";
    isBookingClosed = false;
    takenSlots = 0; // Fresh slots for tomorrow
  }

  const effectiveStartDateTime = new Date(effectiveStartMs).toISOString();
  const slotsLeft = Math.max(0, tournament.totalSlots - takenSlots);

  return {
    tournament: {
      ...tournament,
      startDateTime: effectiveStartDateTime,
      takenSlots,
    },
    group,
    effectiveStartMs,
    effectiveStartDateTime,
    isLive,
    isGroupA: group === "GROUP_A",
    isGroupB: group === "GROUP_B",
    isGroupC: group === "GROUP_C",
    isBookingClosed,
    slotsLeft,
    takenSlots,
  };
}

/**
 * Sorts tournaments into 3 Priority Groups:
 * Group A (Top Priority) -> Available Matches (Countdown running, booking open)
 * Group B (Middle Priority) -> Live Matches (1-hour live window active, booking closed)
 * Group C (Bottom Priority) -> Next Day Matches (Live window passed, rolled over to tomorrow)
 *
 * Within each group, items are sorted by earliest start time.
 */
export function sortTournamentsByPriority(
  tournaments: Tournament[],
  nowMs: number = Date.now()
): ProcessedMatch[] {
  const processed = tournaments.map((t) => processMatch(t, nowMs));

  const groupWeight: Record<MatchGroup, number> = {
    GROUP_A: 1,
    GROUP_B: 2,
    GROUP_C: 3,
  };

  return processed.sort((a, b) => {
    // 1. Primary sort: Group Weight (Group A -> Group B -> Group C)
    if (groupWeight[a.group] !== groupWeight[b.group]) {
      return groupWeight[a.group] - groupWeight[b.group];
    }
    // 2. Secondary sort: Chronological order of effectiveStartMs
    return a.effectiveStartMs - b.effectiveStartMs;
  });
}
