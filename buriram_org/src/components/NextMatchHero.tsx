import React, { useEffect, useState } from "react";
import { Tournament } from "../types";
import { convertToBengaliNumbers } from "../utils/dateFormatter";
import { Clock, Users, ArrowRight, Trophy, DollarSign } from "lucide-react";

interface NextMatchHeroProps {
  tournament: Tournament | null;
  isBengali: boolean;
  onSelect: (tournament: Tournament) => void;
}

export default function NextMatchHero({ tournament, isBengali, onSelect }: NextMatchHeroProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

  useEffect(() => {
    if (!tournament) return;

    const calculateTimeLeft = () => {
      const difference = new Date(tournament.startDateTime).getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formatNum = (num: number) => num < 10 ? `0${num}` : `${num}`;

      setTimeLeft({
        hours: formatNum(hours),
        minutes: formatNum(minutes),
        seconds: formatNum(seconds)
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [tournament]);

  if (!tournament) return null;

  const slotsLeft = tournament.totalSlots - tournament.takenSlots;
  const isExpired = tournament.status !== "Upcoming" || new Date(tournament.startDateTime).getTime() <= Date.now();
  const isFull = slotsLeft <= 0;
  const isUrgent = slotsLeft <= 10 && slotsLeft > 0;

  const slotsLeftDisplay = isBengali ? convertToBengaliNumbers(slotsLeft) : slotsLeft;
  const takenSlotsDisplay = isBengali ? convertToBengaliNumbers(tournament.takenSlots) : tournament.takenSlots;
  const totalSlotsDisplay = isBengali ? convertToBengaliNumbers(tournament.totalSlots) : tournament.totalSlots;
  const entryFeeDisplay = isBengali ? convertToBengaliNumbers(tournament.entryFee) : tournament.entryFee;
  const prizePoolDisplay = isBengali ? convertToBengaliNumbers(tournament.prizePool) : tournament.prizePool;

  const hDisplay = timeLeft ? (isBengali ? convertToBengaliNumbers(timeLeft.hours) : timeLeft.hours) : "00";
  const mDisplay = timeLeft ? (isBengali ? convertToBengaliNumbers(timeLeft.minutes) : timeLeft.minutes) : "00";
  const sDisplay = timeLeft ? (isBengali ? convertToBengaliNumbers(timeLeft.seconds) : timeLeft.seconds) : "00";

  const registeredSquads = tournament.slots || [];

  return (
    <div 
      onClick={() => onSelect(tournament)}
      className="relative overflow-hidden bg-gradient-to-br from-[#0c051a] via-[#0e0721] to-[#04020a] border border-violet-500/30 hover:border-violet-500/60 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 cursor-pointer transition-all duration-300 shadow-[0_0_50px_rgba(124,58,237,0.15)] group hover:shadow-[0_0_60px_rgba(124,58,237,0.25)]"
      style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}
    >
      {/* Visual background accents */}
      <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute left-1/4 bottom-0 w-[200px] h-[200px] bg-fuchsia-600/5 rounded-full blur-[80px] -z-10"></div>

      {/* Top Header Row: Category Badge & Countdown Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-white uppercase italic tracking-tight group-hover:text-violet-400 transition-colors">
            {tournament.title}
          </h2>
        </div>

        {/* 3. COUNTDOWN / TIME REMAINING / MATCH LIVE */}
        {isExpired ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-mono text-xs font-black uppercase tracking-wider animate-pulse shadow-lg shadow-rose-600/40">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            {tournament.status === "Completed"
              ? (isBengali ? "ম্যাচ সমাপ্ত" : "MATCH ENDED")
              : (isBengali ? "ম্যাচ লাইভ" : "MATCH LIVE")}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#120a26] border border-violet-500/30 px-4 py-2 rounded-2xl">
            <Clock className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-xs text-zinc-400 font-mono font-bold uppercase hidden sm:inline">
              {isBengali ? "কাউন্টডাউন:" : "COUNTDOWN:"}
            </span>
            <div className="flex items-center gap-1 font-mono font-black text-violet-300 text-sm sm:text-base">
              <span className="bg-black/50 px-2 py-0.5 rounded text-violet-400">{hDisplay}h</span>
              <span>:</span>
              <span className="bg-black/50 px-2 py-0.5 rounded text-violet-400">{mDisplay}m</span>
              <span>:</span>
              <span className="bg-black/50 px-2 py-0.5 rounded text-rose-400 animate-pulse">{sDisplay}s</span>
            </div>
          </div>
        )}
      </div>

      {/* Middle Key Metrics Row: 1. Prize Money, 2. Entry Fee, 4. Slots Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. PRIZE MONEY */}
        <div className="bg-black/50 border border-violet-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">
              {isBengali ? "প্রাইজ মানি (Prize Money)" : "PRIZE MONEY"}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-400 tracking-tight">
              ৳{prizePoolDisplay}
            </span>
          </div>
        </div>

        {/* 2. ENTRY FEE */}
        <div className="bg-black/50 border border-violet-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">
              {isBengali ? "এন্ট্রি ফি (Entry Fee)" : "ENTRY FEE"}
            </span>
            <span className="text-lg sm:text-xl font-black text-white">
              {tournament.entryFee === 0 ? (
                <span className="text-emerald-400 uppercase">{isBengali ? "ফ্রি (FREE)" : "FREE"}</span>
              ) : (
                `৳${entryFeeDisplay}`
              )}
            </span>
          </div>
        </div>

        {/* 4. TOTAL & BOOKED SLOTS */}
        <div className="bg-black/50 border border-violet-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="text-zinc-400 uppercase">
                {isBengali ? "স্লট বুকিং" : "SLOTS"}
              </span>
              <span className={isFull ? "text-rose-400 font-bold" : isUrgent ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                {takenSlotsDisplay} / {totalSlotsDisplay}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-900 border border-white/5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? "bg-rose-600" : isUrgent ? "bg-amber-500" : "bg-gradient-to-r from-violet-600 to-fuchsia-500"
                }`}
                style={{ width: `${Math.min(100, Math.floor((tournament.takenSlots / tournament.totalSlots) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 font-mono block mt-1">
              {isBengali ? `বাকি আছে: ${slotsLeftDisplay} টি` : `Remaining: ${slotsLeftDisplay}`}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: 5. REGISTERED USERS SUMMARY LIST & MATCH DETAILS BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
        {/* 5. REGISTERED USERS SUMMARY LIST */}
        <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
          <span className="text-xs font-bold text-zinc-400 shrink-0">
            {isBengali ? "নিবন্ধিত দল/প্লেয়ার:" : "Registered Squads:"}
          </span>
          {registeredSquads.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
              <div className="flex -space-x-2">
                {registeredSquads.slice(0, 5).map((squad, i) => (
                  <div 
                    key={i} 
                    className="h-7 w-7 rounded-full bg-violet-950 border-2 border-violet-500/60 flex items-center justify-center text-[10px] font-black text-violet-300 uppercase shadow-md shrink-0"
                    title={squad.teamName}
                  >
                    {squad.teamName ? squad.teamName.slice(0, 2) : "P"}
                  </div>
                ))}
              </div>
              <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/60 border border-violet-800/40 px-2.5 py-1 rounded-lg shrink-0">
                {isBengali ? `${convertToBengaliNumbers(registeredSquads.length)}টি স্কোয়াড নিবন্ধিত` : `${registeredSquads.length} squad(s) registered`}
              </span>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 italic font-mono">
              {isBengali ? "এখনো কেউ বুক করেনি, প্রথম স্লটটি আপনার করে নিন!" : "No registrations yet. Be the first to join!"}
            </span>
          )}
        </div>

        {/* MATCH DETAILS ACTION BUTTON */}
        <button 
          className="w-full sm:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-sans font-black uppercase text-xs rounded-xl tracking-widest shadow-[0_4px_20px_rgba(139,92,246,0.45)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border border-violet-400/30 shrink-0"
        >
          <span>{isBengali ? "ম্যাচ ডিটেইলস (Match Details)" : "MATCH DETAILS"}</span>
          <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
