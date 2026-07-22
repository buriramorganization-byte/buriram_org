import React, { useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import { Tournament, UserProfile } from "../types";
import CountdownTimer from "./CountdownTimer";
import { convertToBengaliNumbers } from "../utils/dateFormatter";
import { decryptLink } from "../utils/crypto";

interface TournamentModalProps {
  tournament: Tournament;
  globalRules: string;
  currentUser: UserProfile | null;
  isBengali: boolean;
  onClose: () => void;
  onJoin: (teamName: string, ignName: string, slotCount: number) => Promise<void>;
  supportWhatsAppNumber: string;
}

export default function TournamentModal({
  tournament,
  globalRules,
  currentUser,
  isBengali,
  onClose,
  onJoin,
  supportWhatsAppNumber,
}: TournamentModalProps) {
  const clerk = useClerk();
  const [teamName, setTeamName] = useState(currentUser?.teamName || "");
  const [ignName, setIgnName] = useState(currentUser?.ignName || "");
  const [slotCount, setSlotCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [showBuyMoreForm, setShowBuyMoreForm] = useState(false);

  const slotsLeft = tournament.totalSlots - tournament.takenSlots;
  const isFull = slotsLeft <= 0;
  const isExpired = tournament.status !== "Upcoming" || new Date(tournament.startDateTime).getTime() <= Date.now();
  const isLocked = isFull || isExpired;

  // Auto-redirect timer when registration completes
  React.useEffect(() => {
    if (!showSuccessModal) return;

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose(); // Automatically redirect back to tournament list
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showSuccessModal, onClose]);

  // Check if current user is already registered in this tournament
  const userSlotsList = currentUser
    ? tournament.slots?.filter((slot) => slot.userId === currentUser.uid) || []
    : [];
  const isRegistered = userSlotsList.length > 0;

  const totalCalculatedFee = tournament.entryFee * slotCount;
  const hasBalance = currentUser ? currentUser.balance >= totalCalculatedFee : false;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isExpired) {
      setErrorMessage(isBengali ? "ম্যাচের সময় শেষ হয়ে গেছে! বুকিং বন্ধ।" : "Match timer expired! Slot booking is closed.");
      return;
    }
    if (!teamName.trim()) {
      setErrorMessage(isBengali ? "অনুগ্রহ করে দলের নাম লিখুন!" : "Please enter a team name!");
      return;
    }
    if (!ignName.trim()) {
      setErrorMessage(isBengali ? "অনুগ্রহ করে টিম লিডারের ইন-গেম নাম/আইডি (IGN/IGL Name) লিখুন!" : "Please enter IGL / IGN Name!");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await onJoin(teamName.trim(), ignName.trim(), slotCount);
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || (isBengali ? "যুক্ত হতে ব্যর্থ হয়েছে।" : "Failed to join."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build automatic WhatsApp pre-filled link
  const cleanPhone = supportWhatsAppNumber.replace(/\D/g, "");
  const whatsAppText = encodeURIComponent(
    `Hello Buriram Org, I want to book a slot directly via WhatsApp for "${tournament.title}".\n\n` +
    `Match Category: ${tournament.category}\n` +
    `Entry Fee: ${tournament.entryFee} BDT\n` +
    `My Email: ${currentUser?.email || "Not Logged In"}\n` +
    `My Team Name: ${teamName || "Not specified"}\n\n` +
    `Please assist me with manual payment and slot booking.`
  );
  const buyWhatsAppUrl = `https://wa.me/${cleanPhone || "8801700000000"}?text=${whatsAppText}`;

  // Bengali translation conversion helpers
  const slotsLeftDisplay = isBengali ? convertToBengaliNumbers(slotsLeft) : slotsLeft;
  const totalSlotsDisplay = isBengali ? convertToBengaliNumbers(tournament.totalSlots) : tournament.totalSlots;
  const entryFeeDisplay = isBengali ? convertToBengaliNumbers(tournament.entryFee) : tournament.entryFee;
  const prizePoolDisplay = isBengali ? convertToBengaliNumbers(tournament.prizePool) : tournament.prizePool;
  const balanceDisplay = currentUser ? (isBengali ? convertToBengaliNumbers(currentUser.balance) : currentUser.balance) : "0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl lg:max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl animate-fade-in my-auto">
        {/* Header Banner */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-violet-950/20 to-black/40 flex items-start justify-between">
          <div>
            <span className="bg-violet-600/20 text-violet-400 font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-violet-800/30">
              {tournament.category}
            </span>
            <h2 className="mt-3 text-2xl font-black font-sans text-white tracking-tight">
              {tournament.title}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <CountdownTimer tournament={tournament} isBengali={isBengali} />
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Main Content Container with Dual Section Scroll (left info, right checkout) */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Match Details & Rules */}
          <div className="md:col-span-7 space-y-6 bengali-rules-container" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
            
            {/* Description Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 bengali-rules-container">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-3" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {isBengali ? "ম্যাচ বিবরণ" : "MATCH DESCRIPTION"}
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed font-sans whitespace-pre-line" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {tournament.description || (isBengali ? "রুলস অনুযায়ী খেলা হবে।" : "Will be played according to rules.")}
              </p>
            </div>

            {/* Dynamic Prize Pool Distribution */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-3" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {isBengali ? "পুরস্কার বিতরণী তালিকা" : "PRIZE POOL DISTRIBUTION"} ({tournament.prizeType})
              </h4>
              <div className="grid grid-cols-2 gap-3 font-mono">
                {tournament.prizePrizes?.map((prize, idx) => {
                  const placeDisplay = isBengali ? convertToBengaliNumbers(idx + 1) : idx + 1;
                  const prizeDisplay = isBengali ? convertToBengaliNumbers(prize) : prize;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5"
                    >
                      <span className="text-xs text-zinc-400 font-bold uppercase" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                        {placeDisplay}
                        {idx === 0 ? "st" : idx === 1 ? "nd" : idx === 2 ? "rd" : "th"}{" "}
                        {isBengali ? "স্থান" : "Place"}
                      </span>
                      <span className="text-sm font-black text-fuchsia-400">৳ {prizeDisplay} BDT</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rules & Regulations Panel */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 bengali-rules-container">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-3" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {isBengali ? "প্ল্যাটফর্ম নিয়মাবলী ও শর্তাবলী" : "PLATFORM RULES & REGULATIONS"}
              </h4>
              <p className="text-xs text-zinc-400 whitespace-pre-line leading-relaxed font-sans" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {globalRules}
              </p>
            </div>

            {/* Slots Registrations Lists */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-3">
                {isBengali ? "নিবন্ধিত দলসমূহ" : "REGISTERED TEAMS"} ({tournament.takenSlots}/{tournament.totalSlots})
              </h4>
              
              {tournament.slots && tournament.slots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar font-mono">
                  {tournament.slots.map((slot, index) => {
                    const slotIdxDisplay = isBengali ? convertToBengaliNumbers(index + 1) : index + 1;
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 p-2 bg-black/30 border border-white/5 rounded-lg text-xs"
                      >
                        <span className="bg-black/60 border border-white/5 text-zinc-500 font-bold px-1.5 py-0.5 rounded">
                          #{slotIdxDisplay}
                        </span>
                        <span className="font-semibold text-zinc-300 truncate">{slot.teamName}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-mono">
                  {isBengali ? "এখনো কোনো দল যুক্ত হয়নি। দ্রুত বুক করুন!" : "No teams registered yet. Book your slot now!"}
                </p>
              )}
            </div>

          </div>

          {/* Right Column: Checkout & Direct Booking Card */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Wallet Info & Balance Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h4 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider mb-4">
                {isBengali ? "চেকআউট প্যানেল" : "CHECKOUT PANEL"}
              </h4>
              
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <span className="text-xs text-zinc-400">{isBengali ? "একক প্রবেশ ফি" : "Per Slot Fee"}</span>
                <span className="text-base font-black text-white">৳ {entryFeeDisplay} BDT</span>
              </div>

              {currentUser ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 text-xs">
                    <span className="text-zinc-500 font-mono">{isBengali ? "আপনার ব্যালেন্স" : "Your Balance"}:</span>
                    <span className="font-bold text-emerald-400">৳ {balanceDisplay} BDT</span>
                  </div>

                  {isRegistered && !showBuyMoreForm ? (
                    /* ALREADY JOINED VIEW - UNLOCKS WHATSAPP ACCESS + OPTION TO BUY MORE */
                    <div className="space-y-4 pt-2">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <svg className="w-8 h-8 text-emerald-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h5 className="text-sm font-bold text-white uppercase font-mono">
                          {isBengali ? "আপনি ইতিমধ্যে যুক্ত আছেন!" : "You're Registered!"}
                        </h5>
                        <div className="text-xs text-zinc-300 font-mono mt-2 space-y-1">
                          <p className="text-violet-400 font-bold">
                            {isBengali ? `বুক করা মোট স্লট: ${userSlotsList.length}টি` : `Total Slots Booked: ${userSlotsList.length}`}
                          </p>
                          {userSlotsList.map((s, idx) => (
                            <p key={idx} className="text-[11px] text-zinc-400">
                              #{idx + 1}: {s.teamName}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* BUTTON TO BUY ADDITIONAL SLOTS */}
                      {!isFull && !isExpired && (
                        <button
                          onClick={() => setShowBuyMoreForm(true)}
                          className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer border border-violet-400/30 flex items-center justify-center gap-2"
                        >
                          <span>{isBengali ? "+ আরও স্লট বুক করুন" : "+ Buy Additional Slots"}</span>
                        </button>
                      )}

                      {/* PRIVATE WHATSAPP MATCH GROUP ACCESS */}
                      <div className="bg-violet-950/20 border border-violet-500/30 rounded-xl p-4 space-y-3 shadow-lg">
                        <h6 className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>{isBengali ? "অফিসিয়াল ম্যাচ যোগাযোগ ফোরাম" : "OFFICIAL LOBBY COMMUNICATIONS"}</span>
                        </h6>
                        
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <p className="text-xs text-emerald-300 font-sans leading-relaxed">
                            {isBengali 
                              ? "আপনার নিবন্ধন সফল হয়েছে! গেমের রুম আইডি এবং পাসওয়ার্ড এই অফিসিয়াল গ্রুপে দেওয়া হবে। অবিলম্বে গ্রুপে যুক্ত হোন।" 
                              : "Registration confirmed! Game Room ID & Password will be distributed inside this group. Join immediately to avoid disqualification."}
                          </p>
                        </div>

                        {tournament.whatsAppLink ? (
                          <div className="space-y-2">
                            <a
                              href={decryptLink(tournament.whatsAppLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all font-mono uppercase cursor-pointer text-center hover:scale-[1.02] active:scale-95"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.019-5.101-2.875-6.958C16.543 1.924 14.07 1.9 11.442 1.9c-5.439 0-9.859 4.42-9.863 9.865-.001 1.73.473 3.424 1.373 4.953l-.995 3.635 3.73-.978z" />
                              </svg>
                              {isBengali ? "গ্রুপে যুক্ত হোন (হোয়াটসঅ্যাপ)" : "Join Group (WhatsApp)"}
                            </a>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(decryptLink(tournament.whatsAppLink));
                                alert(isBengali ? "লিংকটি কপি করা হয়েছে!" : "Group Link copied to clipboard!");
                              }}
                              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-mono rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {isBengali ? "লিংক কপি করুন" : "Copy Group Link"}
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-center">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                              {isBengali ? "গ্রুপ লিংক এখনো দেওয়া হয়নি" : "Link will be assigned soon"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isExpired ? (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-center font-mono space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-black uppercase tracking-wider animate-pulse shadow-lg shadow-rose-600/40">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        {tournament.status === "Completed"
                          ? (isBengali ? "ম্যাচ সমাপ্ত" : "MATCH ENDED")
                          : (isBengali ? "ম্যাচ লাইভ" : "MATCH LIVE")}
                      </div>
                      <h5 className="text-sm font-black text-rose-400 uppercase tracking-tight">
                        {isBengali ? "বুকিং বন্ধ (BOOKING CLOSED)" : "BOOKING CLOSED"}
                      </h5>
                      <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                        {isBengali
                          ? "এই ম্যাচের নির্ধারিত কাউন্টডাউন টাইমার শেষ হয়ে গেছে। এখন নতুন কোনো স্লট বুকিং নেওয়া হচ্ছে না।"
                          : "The countdown timer for this match has expired. Slot booking is now locked."}
                      </p>
                      <button
                        disabled
                        className="w-full py-3 bg-[#1e1017] text-rose-500 font-mono text-xs font-black uppercase tracking-wider rounded-lg border border-rose-500/30 cursor-not-allowed opacity-80"
                      >
                        {isBengali ? "বুকিং বন্ধ (BOOKING CLOSED)" : "BOOKING CLOSED"}
                      </button>
                    </div>
                  ) : isFull ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center font-mono">
                      <span className="text-xs font-bold text-rose-500 uppercase">
                        {isBengali ? "স্লট সম্পূর্ণ ভর্তি!" : "Match is Fully Booked!"}
                      </span>
                    </div>
                  ) : (
                    /* JOIN FORM - WALLET BOOKING OR DIRECT WHATSAPP BUY */
                    <form onSubmit={handleRegister} className="space-y-4 pt-2">
                      {showBuyMoreForm && (
                        <div className="flex items-center justify-between bg-violet-950/40 p-2.5 rounded-lg border border-violet-500/30">
                          <span className="text-xs font-bold text-violet-300 font-mono">
                            {isBengali ? "অতিরিক্ত স্লট ক্রয় করছেন" : "Buying Additional Slots"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowBuyMoreForm(false)}
                            className="text-[10px] text-zinc-400 hover:text-white underline font-mono"
                          >
                            {isBengali ? "বাতিল করুন" : "Cancel"}
                          </button>
                        </div>
                      )}

                      {/* MULTIPLE SLOTS SELECTION COUNTER */}
                      <div className="bg-black/40 border border-white/10 p-3 rounded-lg space-y-2">
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                          {isBengali ? "স্লট সংখ্যা নির্বাচন করুন (Select Slot Quantity)" : "SELECT SLOT QUANTITY"}
                        </label>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSlotCount(prev => Math.max(1, prev - 1))}
                              disabled={slotCount <= 1}
                              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer text-sm"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-mono font-extrabold text-white text-base">
                              {isBengali ? convertToBengaliNumbers(slotCount) : slotCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSlotCount(prev => Math.min(slotsLeft, prev + 1))}
                              disabled={slotCount >= slotsLeft}
                              className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer text-sm"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 block font-mono uppercase">
                              {isBengali ? "মোট এন্ট্রি ফি" : "Total Entry Fee"}
                            </span>
                            <span className="text-sm font-black text-amber-400 font-mono">
                              ৳ {isBengali ? convertToBengaliNumbers(totalCalculatedFee) : totalCalculatedFee} BDT
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                          {isBengali ? "১. টিমের নাম (Team Name) *" : "1. Team Name *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder={isBengali ? "উদাহরণ: Buriram Esports" : "e.g. Buriram Esports"}
                          className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-violet-600 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1 font-bold">
                          {isBengali ? "২. টিম লিডারের IGN / IGL Name *" : "2. Team Leader IGN / IGL Name *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={ignName}
                          onChange={(e) => setIgnName(e.target.value)}
                          placeholder={isBengali ? "উদাহরণ: BRM_RAIHAN / In-Game Name" : "e.g. BRM_RAIHAN / In-Game ID"}
                          className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-violet-600 transition-colors"
                        />
                      </div>

                      {errorMessage && (
                        <p className="text-xs font-mono text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                          {errorMessage}
                        </p>
                      )}

                      <div className="pt-2 space-y-2">
                        {hasBalance ? (
                          /* INSTANT WALLET BOOKING ALLOWED */
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-violet-950/50"
                          >
                            {isSubmitting
                              ? (isBengali ? "প্রক্রিয়াধীন..." : "Processing...")
                              : (isBengali ? `ব্যালেন্স থেকে ৳${totalCalculatedFee} কাটুন` : `Pay ৳${totalCalculatedFee} BDT via Wallet`)}
                          </button>
                        ) : (
                          /* INSUFFICIENT BALANCE -> WHATSAPP BUY ONLY */
                          <div className="space-y-2">
                            <button
                              type="button"
                              disabled
                              className="w-full py-3 bg-zinc-800 text-zinc-500 font-mono text-xs font-bold uppercase tracking-wider rounded-lg cursor-not-allowed border border-zinc-700/30"
                            >
                              {isBengali ? `অপর্যাপ্ত ব্যালেন্স (দরকার ৳${totalCalculatedFee})` : `Insufficient Balance (Need ৳${totalCalculatedFee})`}
                            </button>
                            
                            <p className="text-[10px] text-zinc-500 font-mono text-center">
                              {isBengali
                                ? "ব্যালেন্স নেই? সরাসরি হোয়াটসঅ্যাপে আমাদের পেমেন্ট করে স্লট কিনুন!"
                                : "Zero Balance? Direct checkout and pay manually via WhatsApp!"}
                            </p>

                            <a
                              href={buyWhatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setShowSuccessModal(true)}
                              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.019-5.101-2.875-6.958C16.543 1.924 14.07 1.9 11.442 1.9c-5.439 0-9.859 4.42-9.863 9.865-.001 1.73.473 3.424 1.373 4.953l-.995 3.635 3.73-.978z" />
                              </svg>
                              {isBengali ? "হোয়াটসঅ্যাপ দিয়ে কিনুন" : "Buy via WhatsApp"}
                            </a>
                          </div>
                        )}
                      </div>
                    </form>
                  )}

                  {/* Private group notice */}
                  <div className="bg-black/40 border border-white/5 p-3 rounded-lg text-[10px] text-zinc-500 leading-relaxed font-mono">
                    {isBengali 
                      ? "পেমেন্ট সম্পন্ন হওয়ার পর সাথে সাথে আপনার হোয়াটসঅ্যাপ গ্রুপ লিংকটি আনলক হয়ে যাবে এবং আপনি সরাসরি ম্যাচ গ্রুপে যোগ দিতে পারবেন।" 
                      : "The private match group WhatsApp link unlocks immediately after successfully joining a slot."}
                  </div>
                </div>
              ) : (
                /* USER NOT LOGGED IN PROMPT */
                <div className="p-5 bg-black/40 border border-white/10 rounded-xl text-center space-y-3">
                  <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                    {isBengali 
                      ? "টুর্নামেন্টে অংশগ্রহণ করার জন্য একাউন্টে লগইন বা সাইন আপ করুন।" 
                      : "Please login or create an account to reserve a slot."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (clerk && clerk.openSignIn) {
                          clerk.openSignIn();
                        } else {
                          window.location.href = "/sign-in";
                        }
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-violet-950/50 flex items-center justify-center gap-2 cursor-pointer border border-violet-500/30"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      {isBengali ? "লগইন করুন" : "Sign In"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (clerk && clerk.openSignUp) {
                          clerk.openSignUp();
                        } else if (clerk && clerk.openSignIn) {
                          clerk.openSignIn();
                        } else {
                          window.location.href = "/sign-in";
                        }
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/30"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      {isBengali ? "একাউন্ট খুলুন" : "Create Account"}
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* REGISTRATION CONFIRMATION SUCCESS MODAL WITH 3-SECOND AUTO-REDIRECT */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div 
            className="w-full max-w-sm bg-gradient-to-b from-zinc-900 to-black border border-emerald-500/30 rounded-2xl p-6 text-center shadow-2xl space-y-4"
            style={{ fontFamily: isBengali ? "'Hind Siliguri', 'Comfortaa', sans-serif" : "'Comfortaa', sans-serif" }}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-bounce">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-black text-white">
              {isBengali ? "রেজিস্ট্রেশন সফল হয়েছে!" : "Registration Completed!"}
            </h3>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {isBengali
                ? `আপনি সফলভাবে "${tournament.title}" টুর্নামেন্টে যোগ দিয়েছেন।`
                : `You have successfully joined "${tournament.title}".`}
            </p>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
              <span className="text-xs font-bold text-emerald-400 block mb-1">
                {isBengali ? "অটো-রিডাইরেক্ট করা হচ্ছে..." : "Redirecting automatically..."}
              </span>
              <p className="text-[10px] text-zinc-400 font-mono">
                {isBengali
                  ? `${redirectCountdown} সেকেন্ডের মধ্যে টুর্নামেন্ট পেজে ফিরে যাচ্ছেন`
                  : `Redirecting to tournament page in ${redirectCountdown}s`}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg transition-all cursor-pointer"
            >
              {isBengali ? "এখনই ফিরে যান" : "Go Back Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
