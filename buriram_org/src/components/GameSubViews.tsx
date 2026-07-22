import React, { useState } from "react";
import { 
  Trophy, 
  Calendar, 
  Award, 
  ShieldAlert,
  Sword, 
  Map, 
  Users, 
  Search, 
  Clock, 
  Flame,
  ChevronRight
} from "lucide-react";
import { convertToBengaliNumbers } from "../utils/dateFormatter";

interface SubViewProps {
  isBengali: boolean;
  category: "Champion Rush" | "Scrims" | "Paid Tournaments";
  siteSettings?: any;
}

// 1. Dynamic Match Schedule View
export function ScheduleView({ isBengali, category }: SubViewProps) {
  // Mock detailed matches based on category
  const schedules = [
    {
      id: "M-101",
      map: "Bermuda",
      time: "04:30 PM",
      date: "Today",
      dateBn: "আজ",
      mode: "Squad (Settle Clan)",
      modeBn: "স্কোয়াড (ক্ল্যান লড়াই)",
      status: "Live soon",
      statusBn: "শীঘ্রই লাইভ",
      slotsFilled: 11,
      totalSlots: 12,
    },
    {
      id: "M-102",
      map: "Purgatory",
      time: "07:00 PM",
      date: "Today",
      dateBn: "আজ",
      mode: "Squad (Rush)",
      modeBn: "স্কোয়াড (রাশ)",
      status: "Registration Open",
      statusBn: "নিবন্ধন সচল",
      slotsFilled: 8,
      totalSlots: 12,
    },
    {
      id: "M-103",
      map: "Kalahari",
      time: "09:30 PM",
      date: "Today",
      dateBn: "আজ",
      mode: "Squad (Survival)",
      modeBn: "স্কোয়াড (সারভাইভাল)",
      status: "Registration Open",
      statusBn: "নিবন্ধন সচল",
      slotsFilled: 4,
      totalSlots: 12,
    },
    {
      id: "M-104",
      map: "Bermuda",
      time: "03:00 PM",
      date: "Tomorrow",
      dateBn: "আগামীকাল",
      mode: "Duo (Classic)",
      modeBn: "ডুও (ক্লাসিক)",
      status: "Upcoming",
      statusBn: "আসন্ন",
      slotsFilled: 0,
      totalSlots: 24,
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <Calendar className="w-5 h-5 text-violet-400" />
            {isBengali ? "ম্যাচ সময়সূচী" : "Match Schedule"}
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-1 uppercase">
            {isBengali ? `${category} ক্যাটাগরির চূড়ান্ত সময়সূচী` : `Detailed timeline for ${category}`}
          </p>
        </div>
        <span className="bg-violet-950/40 border border-violet-500/20 text-violet-400 font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase">
          {category}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((s, idx) => {
          const filledText = isBengali ? convertToBengaliNumbers(s.slotsFilled) : s.slotsFilled;
          const totalText = isBengali ? convertToBengaliNumbers(s.totalSlots) : s.totalSlots;
          const mapDisplay = isBengali ? (s.map === "Bermuda" ? "বারমুডা" : s.map === "Purgatory" ? "পারগেটরি" : "কালাহারি") : s.map;

          return (
            <div 
              key={s.id} 
              className="relative overflow-hidden bg-white/5 border border-white/10 hover:border-violet-500/30 rounded-2xl p-5 transition-all duration-300 shadow-lg group flex flex-col justify-between"
            >
              {/* Card Aura on Hover */}
              <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div>
                <div className="flex items-center justify-between mb-3.5 z-10 relative">
                  <div className="flex items-center gap-2">
                    <span className="bg-black/60 border border-zinc-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded text-zinc-400 uppercase">
                      ID: {s.id}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                      s.status === "Live soon" 
                        ? "bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-600/30 animate-pulse" 
                        : "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {isBengali ? s.statusBn : s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono font-bold">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <span>{isBengali ? s.dateBn : s.date} - {s.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2 border-y border-white/5 my-3">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-violet-400" />
                    <div>
                      <span className="block text-[8px] text-zinc-500 uppercase font-black leading-none">{isBengali ? "মানচিত্র" : "MAP"}</span>
                      <span className="text-xs font-black text-white">{mapDisplay}</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="flex items-center gap-2">
                    <Sword className="w-4 h-4 text-violet-400" />
                    <div>
                      <span className="block text-[8px] text-zinc-500 uppercase font-black leading-none">{isBengali ? "মোড" : "GAME MODE"}</span>
                      <span className="text-xs font-black text-white">{isBengali ? s.modeBn : s.mode}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between z-10 relative">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <span className="text-[11px] font-mono text-zinc-400">
                    {isBengali ? "নিবন্ধিত দল" : "Registered Teams"}: <span className="font-bold text-violet-400">{filledText} / {totalText}</span>
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-24 bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div 
                    className="bg-violet-600 h-1.5 rounded-full" 
                    style={{ width: `${(s.slotsFilled / s.totalSlots) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. Beautiful Tournament Bracket Visualizer
export function BracketsView({ isBengali }: Omit<SubViewProps, "category">) {
  // Highly premium visual tree of matches
  const rounds = {
    quarter: [
      { id: "Q1", teamA: "Buriram Clan", teamB: "Ravage Esports", scoreA: "3", scoreB: "1", winner: "A" },
      { id: "Q2", teamA: "Sylhet Royals", teamB: "Ctg Thunders", scoreA: "0", scoreB: "2", winner: "B" },
      { id: "Q3", teamA: "Apex Hunters", teamB: "Viper Elite", scoreA: "2", scoreB: "3", winner: "B" },
      { id: "Q4", teamA: "Deadly Titans", teamB: "BD Warriors", scoreA: "1", scoreB: "3", winner: "B" },
    ],
    semi: [
      { id: "S1", teamA: "Buriram Clan", teamB: "Ctg Thunders", scoreA: "3", scoreB: "2", winner: "A" },
      { id: "S2", teamA: "Viper Elite", teamB: "BD Warriors", scoreA: "3", scoreB: "1", winner: "A" },
    ],
    final: [
      { id: "F1", teamA: "Buriram Clan", teamB: "Viper Elite", scoreA: "Pending", scoreB: "Pending", winner: null }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
          <Trophy className="w-5 h-5 text-amber-400" />
          {isBengali ? "টুর্নামেন্ট ব্র্যাকেট (প্লে-অফ)" : "Tournament Brackets (Playoffs)"}
        </h3>
        <p className="text-xs text-zinc-500 font-mono mt-1 uppercase">
          {isBengali ? "সরাসরি নকআউট পর্ব এবং ফাইনাল রোডম্যাপ" : "Direct knockout stages and road to finals"}
        </p>
      </div>

      {/* Visual responsive desktop view of brackets, wrap in horizontal scroll */}
      <div className="overflow-x-auto custom-scrollbar py-6 rounded-2xl bg-black/30 border border-white/5 px-4">
        <div className="min-w-[800px] grid grid-cols-3 gap-8 relative items-center">
          
          {/* QUARTER FINALS */}
          <div className="space-y-10">
            <h4 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest text-center border-b border-zinc-900 pb-2 mb-4">
              {isBengali ? "কোয়ার্টার ফাইনাল" : "QUARTER FINALS"}
            </h4>
            {rounds.quarter.map((match) => (
              <div key={match.id} className="relative bg-[#070707] border border-white/5 rounded-xl overflow-hidden shadow-md">
                <div className="bg-black/80 px-3 py-1 border-b border-white/5 text-[8px] font-mono text-zinc-500 flex justify-between uppercase">
                  <span>Match {match.id}</span>
                  <span className="text-violet-400">BO5</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className={`flex items-center justify-between text-xs font-bold ${match.winner === "A" ? "text-violet-400" : "text-zinc-400"}`}>
                    <span>{match.teamA}</span>
                    <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">{match.scoreA}</span>
                  </div>
                  <div className={`flex items-center justify-between text-xs font-bold ${match.winner === "B" ? "text-violet-400" : "text-zinc-400"}`}>
                    <span>{match.teamB}</span>
                    <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">{match.scoreB}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SEMI FINALS */}
          <div className="space-y-24">
            <h4 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest text-center border-b border-zinc-900 pb-2 mb-4">
              {isBengali ? "সেমি ফাইনাল" : "SEMI FINALS"}
            </h4>
            {rounds.semi.map((match) => (
              <div key={match.id} className="relative bg-[#070707] border border-white/5 rounded-xl overflow-hidden shadow-md">
                <div className="bg-black/80 px-3 py-1 border-b border-white/5 text-[8px] font-mono text-zinc-500 flex justify-between uppercase">
                  <span>Match {match.id}</span>
                  <span className="text-violet-400">BO5</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className={`flex items-center justify-between text-xs font-bold ${match.winner === "A" ? "text-violet-400" : "text-zinc-400"}`}>
                    <span>{match.teamA}</span>
                    <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">{match.scoreA}</span>
                  </div>
                  <div className={`flex items-center justify-between text-xs font-bold ${match.winner === "B" ? "text-violet-400" : "text-zinc-400"}`}>
                    <span>{match.teamB}</span>
                    <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">{match.scoreB}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FINALS */}
          <div className="space-y-48">
            <h4 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest text-center border-b border-zinc-900 pb-2 mb-4">
              {isBengali ? "গ্র্যান্ড ফাইনাল" : "GRAND FINALS"}
            </h4>
            {rounds.final.map((match) => (
              <div key={match.id} className="relative bg-gradient-to-b from-amber-950/20 to-[#070707] border-2 border-amber-500/20 rounded-2xl overflow-hidden shadow-lg shadow-amber-950/10">
                <div className="bg-amber-600/10 px-3 py-1.5 border-b border-amber-500/10 text-[9px] font-mono text-amber-400 flex justify-between uppercase font-black">
                  <span>BO7 MATCH</span>
                  <span>GOLD CUP</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span>{match.teamA}</span>
                    <span className="font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20 text-[10px] text-amber-400">{match.scoreA}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span>{match.teamB}</span>
                    <span className="font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20 text-[10px] text-amber-400">{match.scoreB}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// 3. Hall of Fame - Champion Leaderboard
export function LeaderboardView({ isBengali }: Omit<SubViewProps, "category">) {
  const [searchQuery, setSearchQuery] = useState("");

  const leaderboard = [
    { rank: 1, name: "Buriram Clan", played: 18, booyah: 9, kills: 142, points: 280, earnings: "৳ ২,৫০০", earningsEn: "৳ 2,500" },
    { rank: 2, name: "Viper Elite", played: 18, booyah: 6, kills: 120, points: 232, earnings: "৳ ১,৮০০", earningsEn: "৳ 1,800" },
    { rank: 3, name: "BD Warriors", played: 15, booyah: 5, kills: 98, points: 195, earnings: "৳ ১,২০০", earningsEn: "৳ 1,200" },
    { rank: 4, name: "Ravage Esports", played: 16, booyah: 4, kills: 104, points: 184, earnings: "৳ ৮০০", earningsEn: "৳ 800" },
    { rank: 5, name: "Sylhet Royals", played: 14, booyah: 3, kills: 88, points: 154, earnings: "৳ ৫০০", earningsEn: "৳ 500" },
    { rank: 6, name: "Ctg Thunders", played: 14, booyah: 2, kills: 72, points: 122, earnings: "৳ ৩০০", earningsEn: "৳ 300" }
  ];

  const filtered = leaderboard.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <Award className="w-5 h-5 text-amber-400" />
            {isBengali ? "চ্যাম্পিয়ন লিডারবোর্ড (হল অব ফেম)" : "Champion Leaderboard (Hall of Fame)"}
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-1 uppercase">
            {isBengali ? "চলতি মৌসুমের সেরা পারফর্মার গিল্ড ও দলসমূহ" : "Elite performers, guilds & top squads of the season"}
          </p>
        </div>

        {/* Search Input bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBengali ? "দল অনুসন্ধান করুন..." : "Search squad..."}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-600 transition-all font-mono"
          />
        </div>
      </div>

      {/* Leaderboard Table Grid */}
      <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/20">
        <table className="w-full text-left border-collapse font-sans">
          <thead>
            <tr className="bg-black/60 border-b border-white/10 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-widest">
              <th className="p-4 text-center w-16">{isBengali ? "র‍্যাংক" : "RANK"}</th>
              <th className="p-4">{isBengali ? "দলের নাম" : "SQUAD NAME"}</th>
              <th className="p-4 text-center">{isBengali ? "ম্যাচ" : "PLAYED"}</th>
              <th className="p-4 text-center">{isBengali ? "বুইয়াহ!" : "BOOYAH"}</th>
              <th className="p-4 text-center">{isBengali ? "কিলস" : "KILLS"}</th>
              <th className="p-4 text-center">{isBengali ? "পয়েন্টস" : "PTS"}</th>
              <th className="p-4 text-right pr-6">{isBengali ? "মোট জয়" : "TOTAL PRIZES"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-zinc-300 font-mono">
            {filtered.map((team) => {
              const playedDisplay = isBengali ? convertToBengaliNumbers(team.played) : team.played;
              const booyahDisplay = isBengali ? convertToBengaliNumbers(team.booyah) : team.booyah;
              const killsDisplay = isBengali ? convertToBengaliNumbers(team.kills) : team.kills;
              const pointsDisplay = isBengali ? convertToBengaliNumbers(team.points) : team.points;
              const rankDisplay = isBengali ? convertToBengaliNumbers(team.rank) : team.rank;

              return (
                <tr key={team.rank} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-center font-sans font-black">
                    {team.rank === 1 ? (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono uppercase tracking-tighter">1st</span>
                    ) : team.rank === 2 ? (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded bg-zinc-400/10 text-zinc-300 border border-zinc-400/30 text-[10px] font-mono uppercase tracking-tighter">2nd</span>
                    ) : team.rank === 3 ? (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded bg-amber-700/10 text-amber-600 border border-amber-700/30 text-[10px] font-mono uppercase tracking-tighter">3rd</span>
                    ) : (
                      <span className="text-zinc-500 font-mono text-[11px] font-bold">{rankDisplay}</span>
                    )}
                  </td>
                  <td className="p-4 font-sans font-black text-white text-xs sm:text-sm uppercase tracking-tight">{team.name}</td>
                  <td className="p-4 text-center text-zinc-400 font-bold">{playedDisplay}</td>
                  <td className="p-4 text-center text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {booyahDisplay}
                  </td>
                  <td className="p-4 text-center text-zinc-400 font-bold">{killsDisplay}</td>
                  <td className="p-4 text-center text-violet-400 font-bold text-xs sm:text-sm">{pointsDisplay}</td>
                  <td className="p-4 text-right pr-6 font-bold text-amber-400 text-xs sm:text-sm">
                    {isBengali ? team.earnings : team.earningsEn}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 4. Custom Category Rules View
export function CategoryRulesView({ isBengali, category, siteSettings }: SubViewProps) {
  // If we have custom rules from the database, split them into lines and render them!
  let dbRulesText = "";
  if (siteSettings) {
    if (category === "Champion Rush") {
      dbRulesText = siteSettings.championRushRules || "";
    } else if (category === "Scrims") {
      dbRulesText = siteSettings.scrimsRules || "";
    } else if (category === "Paid Tournaments") {
      dbRulesText = siteSettings.paidTournamentRules || "";
    }
  }

  const hasDbRules = !!dbRulesText.trim();

  const rules = {
    "Champion Rush": {
      titleEn: "Champion Rush Rules",
      titleBn: "চ্যাম্পিয়ন রাশ নিয়মাবলী",
      itemsEn: [
        "Fast-paced, high intensity rush matches with quick zone shrinks.",
        "Played in smaller, closed circle zones for continuous combat.",
        "Maximum 12 teams (Squad) or 48 players per lobby.",
        "Emulator players are strictly banned from this queue to maintain fair competition.",
        "Teaming or hacking results in an immediate account ban and hardware block."
      ],
      itemsBn: [
        "অত্যন্ত দ্রুত গতির এবং তীব্র উত্তেজনাকর রাশ ম্যাচ যেখানে দ্রুত জোন সংকুচিত হয়।",
        "ক্রমাগত যুদ্ধের জন্য ছোট এবং সংকুচিত সার্কেলে খেলা পরিচালিত হবে।",
        "প্রতি লবিতে সর্বোচ্চ ১২টি স্কোয়াড বা ৪৮ জন প্লেয়ার অংশ নিতে পারবে।",
        "ফেয়ার প্লে নিশ্চিত করতে এমুলেটর (পিসি) প্লেয়ারদের এই ম্যাচে অংশ নেওয়া কঠোরভাবে নিষিদ্ধ।",
        "টিম-আপ বা হ্যাকিংয়ের চেষ্টা করলে আইডি ও ডিভাইস আজীবনের জন্য ব্যান হবে।"
      ]
    },
    "Scrims": {
      titleEn: "Scrims Practice Rules",
      titleBn: "স্ক্রিমস প্র্যাকটিস নিয়মাবলী",
      itemsEn: [
        "Tier 1 & Tier 2 guild level practice matches designed for elite practice.",
        "Survival duration and final placement points are highly prioritized.",
        "Official points sheets will be updated on our servers within 1 hour after each game.",
        "Match screenshots of final score cards must be uploaded to the verified Support WhatsApp.",
        "Teams must check in at least 15 minutes prior to the designated slot time."
      ],
      itemsBn: [
        "টিয়ার ১ এবং টিয়ার ২ গিল্ড স্তরের প্র্যাকটিস ম্যাচ যা মূলত পেশাদার অনুশীলনের জন্য তৈরি।",
        "সারভাইভাল স্থায়িত্ব এবং চূড়ান্ত প্লেসমেন্ট পয়েন্ট সবচেয়ে বেশি গুরুত্ব পাবে।",
        "প্রতি ম্যাচের ১ ঘণ্টার মধ্যে অফিসিয়াল পয়েন্ট শিট আমাদের সার্ভারে আপডেট করা হবে।",
        "ফাইনাল স্কোর কার্ডের স্ক্রিনশট অবশ্যই ভেরিফাইড সাপোর্ট হোয়াটসঅ্যাপে পাঠাতে হবে।",
        "নির্ধারিত স্লট টাইমের অন্তত ১৫ মিনিট আগে টিম চেক-ইন সম্পন্ন করতে হবে।"
      ]
    },
    "Paid Tournaments": {
      titleEn: "Paid Tournament Rules & Guidelines",
      titleBn: "পেইড টুর্নামেন্ট নিয়মাবলী ও নির্দেশিকা",
      itemsEn: [
        "High stakes cash prize tournament. Registration fee is non-refundable once slot is locked.",
        "Full registration payment verification must be cleared through our integrated wallet system.",
        "Room ID & Password will be shared on this portal precisely 10 minutes before launch.",
        "Custom active anti-cheat moderators are spectating and auditing every single lobby.",
        "Winning prizes are automatically credited directly to your cash-out wallet within 2 hours."
      ],
      itemsBn: [
        "বড় অংকের ক্যাশ প্রাইজ টুর্নামেন্ট। স্লট বুক হওয়ার পর নিবন্ধন ফি অফেরতযোগ্য।",
        "আমাদের ওয়ালেট সিস্টেমের মাধ্যমে সম্পূর্ণ পেমেন্ট ভেরিফিকেশন সম্পন্ন করতে হবে।",
        "ম্যাচ শুরুর ঠিক ১০ মিনিট আগে এই পোর্টালে রুম আইডি এবং পাসওয়ার্ড প্রকাশ করা হবে।",
        "প্রতিটি ম্যাচ সরাসরি আমাদের সক্রিয় অ্যান্টি-চিট রেফারিদের দ্বারা পর্যবেক্ষণ করা হবে।",
        "বিজয়ী পুরষ্কারের টাকা সরাসরি ২ ঘণ্টার মধ্যে আপনার ক্যাশ-আউট ওয়ালেটে জমা হবে।"
      ]
    }
  };

  const currentRules = rules[category] || rules["Champion Rush"];
  const list = hasDbRules ? dbRulesText.split("\n").filter(line => line.trim().length > 0) : (isBengali ? currentRules.itemsBn : currentRules.itemsEn);
  const title = isBengali ? currentRules.titleBn : currentRules.titleEn;

  return (
    <div className="space-y-6 animate-fade-in font-sans bengali-rules-container" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
          <ShieldAlert className="w-5 h-5 text-violet-400" />
          {title}
        </h3>
        <p className="text-xs text-zinc-500 font-mono mt-1 uppercase" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
          {isBengali ? `${category} ক্যাটাগরির সুনির্দিষ্ট গাইডলাইন` : `Official guidelines & ruleset for ${category}`}
        </p>
      </div>

      <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl p-6 space-y-4 bengali-rules-container">
        {list.map((item, index) => (
          <div key={index} className="flex gap-4 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 text-xs font-bold flex items-center justify-center font-mono">
              {isBengali ? convertToBengaliNumbers(index + 1) : index + 1}
            </span>
            <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed pt-0.5 whitespace-pre-line" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Custom Timeline & Schedule Details View
export function TimelineDetailsView({ isBengali, category, siteSettings }: SubViewProps) {
  let dbTimelineText = "";
  if (siteSettings) {
    if (category === "Champion Rush") {
      dbTimelineText = siteSettings.championRushTimeline || "";
    } else if (category === "Scrims") {
      dbTimelineText = siteSettings.scrimsTimeline || "";
    } else if (category === "Paid Tournaments") {
      dbTimelineText = siteSettings.paidTournamentTimeline || "";
    }
  }

  const hasDbTimeline = !!dbTimelineText.trim();

  let parsedTimeline: { time: string; label: string }[] = [];
  if (hasDbTimeline) {
    const lines = dbTimelineText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    parsedTimeline = lines.map((line, idx) => {
      const match = line.match(/^([^–—\-:]+)[–—\-:](.+)$/);
      if (match) {
        return {
          time: match[1].trim(),
          label: match[2].trim()
        };
      }
      return {
        time: isBengali ? `ধাপ ${convertToBengaliNumbers(idx + 1)}` : `STEP ${idx + 1}`,
        label: line
      };
    });
  }

  const defaultTimelines = {
    "Champion Rush": [
      { time: "07:00 PM", label: isBengali ? "রুম আইডি এবং পাস প্রকাশ" : "Room ID & Pass Live" },
      { time: "07:10 PM", label: isBengali ? "লবি এন্ট্রি ও ভেরিফিকেশন" : "Lobby Entry Check" },
      { time: "07:15 PM", label: isBengali ? "প্রথম রাউন্ড ম্যাচ শুরু (বারমুডা)" : "Round 1 Match Launch (Bermuda Map)" },
      { time: "07:45 PM", label: isBengali ? "দ্বিতীয় রাউন্ড ম্যাচ শুরু (পারগেটরি)" : "Round 2 Match Launch (Purgatory Map)" },
      { time: "08:30 PM", label: isBengali ? "ফলাফল শীট প্রকাশ ও ওয়ালেট সেটেলমেন্ট" : "Result Sheets & Wallet Settlement" }
    ],
    "Scrims": [
      { time: "08:00 PM", label: isBengali ? "গিল্ড রোস্টার চেক-ইন সমাপ্তি" : "Guild Roster Check-ins Close" },
      { time: "08:15 PM", label: isBengali ? "এলিট লবি ভেরিফিকেশন" : "Elite Lobby Verification" },
      { time: "08:30 PM", label: isBengali ? "প্রথম ম্যাচ শুরু (বারমুডা ম্যাপ)" : "Match 1 Start (Bermuda Map)" },
      { time: "09:10 PM", label: isBengali ? "দ্বিতীয় ম্যাচ শুরু (পারগেটরি ম্যাপ)" : "Match 2 Start (Purgatory Map)" },
      { time: "09:50 PM", label: isBengali ? "তৃতীয় ম্যাচ শুরু (কালাহারি ম্যাপ)" : "Match 3 Start (Kalahari Map)" },
      { time: "10:30 PM", label: isBengali ? "পয়েন্ট ও স্কোরবোর্ড আপডেট" : "Points Board Updates" }
    ],
    "Paid Tournaments": [
      { time: "06:00 PM", label: isBengali ? "নিবন্ধন ও ক্যাশিয়ার ভেরিফিকেশন ডেডলাইন" : "Registration Verification Cutoff" },
      { time: "06:30 PM", label: isBengali ? "চূড়ান্ত ব্র্যাকেট ড্র ও সিডিংস" : "Final Bracket Draw Live" },
      { time: "07:00 PM", label: isBengali ? "লাইভ স্ট্রিম শুরু এবং রুম আইডি ও পাস" : "Live Broadcast Start & ID/Pass" },
      { time: "07:15 PM", label: isBengali ? "মূল ম্যাচ শুরু (রেফারি নিয়ন্ত্রিত)" : "Match Commences (Referee Inspected)" },
      { time: "09:30 PM", label: isBengali ? "পুরস্কার বিতরণ ও তাত্ক্ষণিক ক্যাশআউট" : "Prize Outflow & Wallet Credits" }
    ]
  };

  const displayList = hasDbTimeline ? parsedTimeline : (defaultTimelines[category] || defaultTimelines["Champion Rush"]);

  return (
    <div className="space-y-6 animate-fade-in font-sans bengali-rules-container" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
          <Clock className="w-5 h-5 text-violet-400" />
          {isBengali ? "সময়সূচী ও টাইমলাইন বিবরণ" : "Timeline & Schedule Details"}
        </h3>
        <p className="text-xs text-zinc-500 font-mono mt-1 uppercase" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
          {isBengali ? `${category} ক্যাটাগরির সুনির্দিষ্ট সময়সূচী` : `Detailed sequence of events for ${category}`}
        </p>
      </div>

      <div className="relative border-l border-violet-500/20 ml-4 pl-6 space-y-8 py-2">
        {displayList.map((item, index) => (
          <div key={index} className="relative group">
            {/* Timeline dot */}
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-black border-2 border-violet-500 flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>
            </div>

            <div className="bg-[#0b0b0d] border border-white/5 rounded-xl p-4 hover:border-violet-500/20 transition-all duration-300 shadow-md">
              <span className="inline-block bg-violet-600/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase mb-1">
                {item.time}
              </span>
              <h4 className="text-sm font-black text-zinc-100 font-sans leading-snug whitespace-pre-line" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {item.label}
              </h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

