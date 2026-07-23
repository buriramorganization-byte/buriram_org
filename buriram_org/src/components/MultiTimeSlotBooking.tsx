import React, { useState } from "react";
import { Tournament, UserProfile } from "../types";
import { convertToBengaliNumbers, formatShortDateTime } from "../utils/dateFormatter";
import { registerForMultipleTournaments } from "../services/firebaseService";
import { sortTournamentsByPriority, processMatch } from "../utils/tournamentSorter";
import { Clock, CheckSquare, Square, Layers, ShieldCheck, Trophy, AlertTriangle } from "lucide-react";

interface MultiTimeSlotBookingProps {
  tournaments: Tournament[];
  currentUser: UserProfile | null;
  isBengali: boolean;
  onRefreshData: () => Promise<void>;
}

export default function MultiTimeSlotBooking({
  tournaments,
  currentUser,
  isBengali,
  onRefreshData
}: MultiTimeSlotBookingProps) {
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Champion Rush" | "Scrims" | "Paid Tournaments">("All");

  const filteredTournaments = tournaments.filter((t) => {
    if (t.status === "Completed") return false;
    if (selectedCategory === "All") return true;
    return t.category === selectedCategory;
  });

  const processedMatches = sortTournamentsByPriority(filteredTournaments);

  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [slotsPerMatch, setSlotsPerMatch] = useState<number>(1);
  const [squadName, setSquadName] = useState<string>("");
  const [ignName, setIgnName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  if (processedMatches.length === 0) {
    return null;
  }

  const toggleSelectMatch = (id: string, isBookingClosed: boolean) => {
    if (isBookingClosed) return;
    setSelectedMatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const bookableMatches = processedMatches.filter(p => !p.isBookingClosed);

  const toggleSelectAll = () => {
    if (selectedMatchIds.length === bookableMatches.length && bookableMatches.length > 0) {
      setSelectedMatchIds([]);
    } else {
      setSelectedMatchIds(bookableMatches.map((p) => p.tournament.id));
    }
  };

  const selectedTournaments = processedMatches
    .filter((p) => selectedMatchIds.includes(p.tournament.id))
    .map((p) => p.tournament);

  const totalFee = selectedTournaments.reduce(
    (sum, t) => sum + t.entryFee * slotsPerMatch,
    0
  );

  const hasBalance = currentUser ? currentUser.balance >= totalFee : false;

  const handleBulkBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (selectedMatchIds.length === 0) {
      setFeedback({ success: false, message: isBengali ? "কমপক্ষে একটি টাইম-স্লট বেছে নিন।" : "Please select at least one time-slot." });
      return;
    }
    if (!squadName.trim()) {
      setFeedback({ success: false, message: isBengali ? "টিমের নাম লিখুন।" : "Please enter team name." });
      return;
    }
    if (!ignName.trim()) {
      setFeedback({ success: false, message: isBengali ? "টিম লিডারের IGN / IGL Name লিখুন।" : "Please enter IGL / IGN Name." });
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await registerForMultipleTournaments(
        selectedMatchIds,
        currentUser.uid,
        currentUser.email,
        squadName.trim(),
        ignName.trim(),
        slotsPerMatch
      );

      if (res.success) {
        setFeedback({ success: true, message: res.message });
        setSelectedMatchIds([]);
        await onRefreshData();
      } else {
        setFeedback({ success: false, message: res.message });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || "Bulk booking failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="bg-gradient-to-br from-violet-950/60 via-zinc-950 to-black border border-violet-500/30 rounded-2xl p-6 shadow-2xl font-sans mb-8"
      style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-violet-500/20 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-violet-600/30 text-violet-300 border border-violet-500/40 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              {isBengali ? "মাল্টিপল স্লট সিলেকশন" : "MULTI-TIME SLOT SELECTION"}
            </span>
            <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {isBengali ? "সকল ক্যাটাগরি সাপোর্টেড" : "ALL CATEGORIES SUPPORTED"}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase italic mt-1.5 flex items-center gap-2">
            <Layers className="w-6 h-6 text-violet-400" />
            <span>{isBengali ? "একসাথে একাধিক টাইম-স্লটে বুকিং করুন" : "Book Multiple Time-Slots At Once"}</span>
          </h2>
          <p className="text-xs text-zinc-400 font-normal mt-1">
            {isBengali
              ? "চ্যাম্পিয়ন রাশ, স্ক্রিম ও পেইড সহ যেকোনো ক্যাটাগরির এভেইলএবল টাইম-স্লট বেছে নিয়ে একসাথে নিবন্ধন করুন।"
              : "Select all your desired match times across Champion Rush, Scrims & Paid Tournaments and register simultaneously."}
          </p>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 pt-3 font-mono text-xs overflow-x-auto">
            {(["All", "Champion Rush", "Scrims", "Paid Tournaments"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/50"
                    : "bg-black/40 border border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                {cat === "All" ? (isBengali ? "সকল ক্যাটাগরি" : "All Categories") : cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={toggleSelectAll}
          className="px-4 py-2 bg-violet-950/80 hover:bg-violet-900 border border-violet-500/40 text-violet-300 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          {selectedMatchIds.length === bookableMatches.length && bookableMatches.length > 0 ? (
            <>
              <CheckSquare className="w-4 h-4 text-violet-400" />
              <span>{isBengali ? "সবগুলো আনসেলেক্ট করুন" : "Deselect All"}</span>
            </>
          ) : (
            <>
              <Square className="w-4 h-4 text-zinc-400" />
              <span>{isBengali ? "সকল সচল স্লট সিলেক্ট করুন" : "Select Available Time-Slots"}</span>
            </>
          )}
        </button>
      </div>

      {/* List of Champion Rush Available Time-Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {processedMatches.map((pm) => {
          const t = pm.tournament;
          const isSelected = selectedMatchIds.includes(t.id);
          const timeDisplay = formatShortDateTime(pm.effectiveStartDateTime, isBengali);

          return (
            <div
              key={t.id}
              onClick={() => toggleSelectMatch(t.id, pm.isBookingClosed)}
              className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between ${
                pm.isBookingClosed
                  ? "bg-black/30 border-rose-500/30 opacity-75 cursor-not-allowed"
                  : isSelected
                  ? "bg-violet-900/30 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.25)] cursor-pointer"
                  : "bg-black/50 border-white/10 hover:border-zinc-700 hover:bg-zinc-900/50 cursor-pointer"
              }`}
            >
              {/* Status Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  {!pm.isBookingClosed ? (
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      isSelected ? "bg-violet-600 text-white" : "bg-zinc-800 border border-zinc-700 text-transparent"
                    }`}>
                      <CheckSquare className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{t.title}</span>
                      {pm.isGroupC && (
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
                          {isBengali ? "আগামীকাল" : "TOMORROW"}
                        </span>
                      )}
                    </h4>
                  </div>
                </div>

                {pm.isLive ? (
                  <span className="text-[9px] font-mono font-black uppercase text-white bg-rose-600 px-2 py-0.5 rounded animate-pulse">
                    {isBengali ? "লাইভ" : "LIVE NOW"}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    ৳{isBengali ? convertToBengaliNumbers(t.entryFee) : t.entryFee}
                  </span>
                )}
              </div>

              {/* Time & Slot metadata */}
              <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <span>{timeDisplay}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                  <span className="text-zinc-500">{isBengali ? "বাকি স্লট:" : "Available:"}</span>
                  <span className={`font-bold ${pm.isLive ? "text-rose-400" : "text-violet-300"}`}>
                    {pm.isLive 
                      ? (isBengali ? "বুকিং বন্ধ" : "CLOSED") 
                      : `${isBengali ? convertToBengaliNumbers(pm.slotsLeft) : pm.slotsLeft} / ${isBengali ? convertToBengaliNumbers(t.totalSlots) : t.totalSlots}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">{isBengali ? "পুরস্কার:" : "Prize:"}</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    ৳{isBengali ? convertToBengaliNumbers(t.prizePool) : t.prizePool}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Booking Summary & Submission Control Form */}
      {currentUser ? (
        <form onSubmit={handleBulkBooking} className="bg-black/60 border border-violet-500/30 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                  {isBengali ? "নির্বাচিত ম্যাচসমূহ" : "SELECTED TIME-SLOTS"}
                </span>
                <span className="text-base font-extrabold text-white font-mono">
                  {selectedMatchIds.length > 0 
                    ? (isBengali ? `${convertToBengaliNumbers(selectedMatchIds.length)}টি টাইম-স্লট সিলেক্টেড` : `${selectedMatchIds.length} match(es) selected`)
                    : (isBengali ? "কোনো ম্যাচ সিলেক্ট করা হয়নি" : "No match selected")}
                </span>
              </div>
            </div>

            {/* Slots per match selector */}
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
              <span className="text-xs font-bold text-zinc-300 font-mono">
                {isBengali ? "প্রতিটি ম্যাচে স্লট:" : "Slots per Match:"}
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSlotsPerMatch(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                      slotsPerMatch === num
                        ? "bg-violet-600 text-white shadow-md shadow-violet-950"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {isBengali ? convertToBengaliNumbers(num) : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Grand Total */}
            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                {isBengali ? "সর্বমোট এন্ট্রি ফি" : "GRAND TOTAL ENTRY FEE"}
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                ৳ {isBengali ? convertToBengaliNumbers(totalFee) : totalFee} BDT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono uppercase">
                {isBengali ? "১. টিমের নাম (Team Name) *" : "1. Team Name *"}
              </label>
              <input
                type="text"
                required
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                placeholder={isBengali ? "উদাহরণ: Buriram Esports" : "e.g. Buriram Esports"}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-600 text-xs font-mono"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-zinc-300 mb-1 font-mono uppercase">
                {isBengali ? "২. টিম লিডারের IGN / IGL Name *" : "2. Team Leader IGN / IGL Name *"}
              </label>
              <input
                type="text"
                required
                value={ignName}
                onChange={(e) => setIgnName(e.target.value)}
                placeholder={isBengali ? "উদাহরণ: BRM_RAIHAN / In-Game Name" : "e.g. BRM_RAIHAN / In-Game ID"}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-violet-600 text-xs font-mono"
              />
            </div>

            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={isSubmitting || selectedMatchIds.length === 0}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-950/50 uppercase cursor-pointer text-xs font-mono tracking-wider"
              >
                {isSubmitting
                  ? (isBengali ? "বুকিং প্রসেসিং হচ্ছে..." : "Processing Booking...")
                  : (isBengali ? `একসাথে ${selectedMatchIds.length}টি ম্যাচে বুকিং দিন` : `Book All ${selectedMatchIds.length} Matches`)}
              </button>
            </div>
          </div>

          {feedback && (
            <p className={`p-3 rounded-xl text-xs font-mono font-bold text-center border ${
              feedback.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}>
              {feedback.message}
            </p>
          )}
        </form>
      ) : (
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-xs text-zinc-400 font-mono">
            {isBengali ? "একসাথে একাধিক টাইম-স্লট বুকিং করতে আপনার একাউন্টে লগইন করুন।" : "Please login to your account to use multi-time slot booking."}
          </p>
        </div>
      )}
    </div>
  );
}
