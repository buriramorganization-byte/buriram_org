import React from "react";
import { Tournament } from "../types";
import CountdownTimer from "./CountdownTimer";
import { convertToBengaliNumbers, formatDhakaTime, formatDhakaDate } from "../utils/dateFormatter";

interface TournamentCardProps {
  key?: React.Key;
  tournament: Tournament;
  categoryBanner?: string;
  isBengali: boolean;
  onSelect: (tournament: Tournament) => void;
}

export default function TournamentCard({ tournament, categoryBanner, isBengali, onSelect }: TournamentCardProps) {
  const slotsLeft = tournament.totalSlots - tournament.takenSlots;
  const isFull = slotsLeft <= 0;
  const isExpired = tournament.status !== "Upcoming" || new Date(tournament.startDateTime).getTime() <= Date.now();
  const isLocked = isFull || isExpired;
  
  const takenSlotsDisplay = isBengali ? convertToBengaliNumbers(tournament.takenSlots) : tournament.takenSlots;
  const totalSlotsDisplay = isBengali ? convertToBengaliNumbers(tournament.totalSlots) : tournament.totalSlots;
  const entryFeeDisplay = isBengali ? convertToBengaliNumbers(tournament.entryFee) : tournament.entryFee;
  const prizePoolDisplay = isBengali ? convertToBengaliNumbers(tournament.prizePool) : tournament.prizePool;

  const progressPercentage = Math.min(100, Math.floor((tournament.takenSlots / tournament.totalSlots) * 100));

  // Time & Date format using Dhaka timezone formatting
  const matchTime = formatDhakaTime(tournament.startDateTime, isBengali);
  const matchDate = formatDhakaDate(tournament.startDateTime, isBengali);

  // Generate unique team list for avatar rows
  const registeredSquads = tournament.slots || [];

  return (
    <div 
      className="group bg-[#0b0b0d] border border-white/5 hover:border-violet-500/50 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-xl hover:shadow-[0_0_25px_rgba(124,58,237,0.15)] w-full max-w-md mx-auto sm:max-w-none"
      onClick={() => onSelect(tournament)}
    >
      {/* Dynamic/fallback category banner */}
      <div className="relative h-16 sm:h-32 overflow-hidden bg-zinc-950">
        {categoryBanner ? (
          <img
            src={categoryBanner}
            alt={tournament.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-60"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-950/80 via-zinc-900 to-black flex items-center justify-center p-2 sm:p-4">
            <div className="text-center">
              <span className="text-[8px] sm:text-[9px] font-mono text-violet-400 font-bold uppercase tracking-widest block">
                BURIRAM ESPORTS
              </span>
              <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tight font-sans">
                {tournament.category}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-[#0b0b0d]/50"></div>
        <div className="absolute inset-0 bg-violet-600/5 mix-blend-color"></div>
        
        {/* Category Tag */}
        <span className="absolute top-1.5 left-2 sm:top-3 sm:left-3 bg-violet-600/90 text-white font-sans text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded shadow-md">
          {tournament.category}
        </span>

        {/* Live Countdown at bottom right of image */}
        <div className="absolute bottom-1.5 right-2 sm:bottom-2.5 sm:right-3 scale-90 sm:scale-100 origin-bottom-right">
          <CountdownTimer tournament={tournament} isBengali={isBengali} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
        <div>
          {/* Match Time & Date inside card */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-mono text-violet-400 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">
            <span>{matchDate}</span>
            <span className="text-zinc-600">•</span>
            <span>{matchTime}</span>
          </div>

          <h3 className="font-sans text-xs sm:text-base font-black text-white group-hover:text-violet-400 transition-colors line-clamp-1 uppercase tracking-tight">
            {tournament.title}
          </h3>
          <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[11px] text-zinc-500 font-mono line-clamp-1">
            {tournament.description || (isBengali ? "রুলস অনুযায়ী খেলা হবে" : "Played according to standard rules")}
          </p>
        </div>

        {/* VISIBLE HIGHLIGHTS: Entry Fee and Prize Pool (bold, striking, noticeable) */}
        <div className="grid grid-cols-2 gap-1 sm:gap-2 bg-black/40 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-white/5">
          <div className="flex flex-col items-center justify-center py-0.5 sm:py-1 border-r border-white/5 text-center">
            <span className="text-[7px] sm:text-[8px] text-zinc-500 font-mono uppercase font-black tracking-wider mb-0.5">
              {isBengali ? "প্রবেশ ফি" : "ENTRY FEE"}
            </span>
            <span className="text-[11px] sm:text-sm font-black text-white tracking-tight">
              {tournament.entryFee === 0 ? (
                <span className="text-emerald-400 uppercase font-sans font-black">
                  {isBengali ? "ফ্রি" : "FREE"}
                </span>
              ) : (
                <span className="text-zinc-100 font-sans font-black">৳{entryFeeDisplay}</span>
              )}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-0.5 sm:py-1 text-center">
            <span className="text-[7px] sm:text-[8px] text-zinc-500 font-mono uppercase font-black tracking-wider mb-0.5">
              {isBengali ? "সর্বমোট প্রাইজপুল" : "TOTAL PRIZE POOL"}
            </span>
            <span className="text-[11px] sm:text-sm font-black text-amber-400 tracking-tight glow-text font-sans">
              ৳{prizePoolDisplay}
            </span>
          </div>
        </div>

        {/* Sleek Dynamic Slot Tracker with a Premium Progress Bar */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-mono font-bold">
            <span className="text-zinc-400 uppercase">
              {isBengali ? "স্লট বুকিং" : "SLOT BOOKING"}
            </span>
            <span className={isExpired ? "text-rose-500 font-extrabold uppercase animate-pulse" : isFull ? "text-rose-400" : "text-emerald-400"}>
              {isExpired ? (isBengali ? "বুকিং বন্ধ" : "CLOSED") : `${takenSlotsDisplay} / ${totalSlotsDisplay} ${isBengali ? "পূরণ" : "Filled"}`}
            </span>
          </div>
          {/* Progress bar container */}
          <div className="w-full h-1 sm:h-1.5 bg-zinc-900 border border-zinc-800/50 rounded-full overflow-hidden relative">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isExpired
                  ? "bg-rose-600"
                  : isFull 
                  ? "bg-rose-500" 
                  : progressPercentage > 80 
                  ? "bg-amber-500" 
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-500"
              }`}
              style={{ width: `${isExpired ? 100 : progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Registrations Avatar Indicator List */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-hidden">
            {registeredSquads.length > 0 ? (
              <div className="flex -space-x-1.5 sm:-space-x-2 overflow-hidden">
                {registeredSquads.slice(0, 3).map((squad, i) => (
                  <div 
                    key={i} 
                    className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-violet-950 border border-violet-500/50 flex items-center justify-center text-[7px] sm:text-[8px] font-black font-sans text-violet-300 uppercase shadow-md"
                    title={squad.teamName}
                  >
                    {squad.teamName.slice(0, 2)}
                  </div>
                ))}
                {registeredSquads.length > 3 && (
                  <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[6px] sm:text-[7px] font-black font-mono text-zinc-400">
                    +{registeredSquads.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-zinc-600 font-mono uppercase italic">
                {isBengali ? "বুকিং নেই" : "No bookings"}
              </span>
            )}
            
            {registeredSquads.length > 0 && (
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-tight truncate max-w-[80px] sm:max-w-none">
                {isBengali 
                  ? `${convertToBengaliNumbers(registeredSquads.length)}টি স্কোয়াড` 
                  : `${registeredSquads.length} squad${registeredSquads.length > 1 ? "s" : ""}`}
              </span>
            )}
          </div>

          {/* Compact action button to open view details modal */}
          <button 
            className="px-2 py-1 sm:px-3 sm:py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-sans font-black uppercase text-[9px] sm:text-[10px] rounded-md sm:rounded-lg tracking-wider transition-all duration-300 cursor-pointer shadow-md hover:shadow-violet-900/40 shrink-0"
          >
            {isBengali ? "বিস্তারিত" : "Details"}
          </button>
        </div>
      </div>
    </div>
  );
}

