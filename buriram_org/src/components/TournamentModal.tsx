import React, { useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import { Tournament, UserProfile } from "../types";
import CountdownTimer from "./CountdownTimer";
import { convertToBengaliNumbers } from "../utils/dateFormatter";
import { processMatch } from "../utils/tournamentSorter";
import { decryptLink } from "../utils/crypto";

interface TournamentModalProps {
  tournament: Tournament;
  globalRules: string;
  currentUser: UserProfile | null;
  isBengali: boolean;
  onClose: () => void;
  onJoin: (teamName: string, ignName: string, slotCount: number) => Promise<void>;
  supportWhatsAppNumber: string;
  onOpenDeposit?: () => void;
}

export default function TournamentModal({
  tournament,
  globalRules,
  currentUser,
  isBengali,
  onClose,
  onJoin,
  supportWhatsAppNumber,
  onOpenDeposit,
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
  const [activeTab, setActiveTab] = useState<"checkout" | "prizes" | "rules" | "teams">("checkout");

  const pm = processMatch(tournament);
  const activeTournament = pm.tournament;
  const slotsLeft = pm.slotsLeft;
  const isFull = slotsLeft <= 0;
  const isLive = pm.isLive;
  const isLocked = pm.isBookingClosed || isFull;

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
    if (pm.isBookingClosed) {
      setErrorMessage(isBengali ? "ম্যাচের সময় শেষ অথবা লাইভ চলছে! বুকিং বন্ধ।" : "Booking is closed for this match!");
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
        <div className="relative p-5 border-b border-white/10 bg-gradient-to-r from-violet-950/30 via-black to-zinc-950 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="bg-violet-600/20 text-violet-400 font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-violet-800/30">
                {tournament.category}
              </span>
              <h2 className="mt-2 text-xl md:text-2xl font-black font-sans text-white tracking-tight">
                {tournament.title}
              </h2>
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <CountdownTimer tournament={tournament} isBengali={isBengali} />
            <div className="text-right font-mono">
              <span className="text-[10px] text-zinc-400 uppercase block">{isBengali ? "এন্ট্রি ফি" : "Entry Fee"}</span>
              <span className="text-sm font-black text-amber-400">৳ {entryFeeDisplay} BDT</span>
            </div>
          </div>

          {/* TAB BUTTONS FOR CLEAN NAVIGATION */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-white/10 overflow-x-auto custom-scrollbar font-mono text-xs">
            <button
              onClick={() => setActiveTab("checkout")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "checkout"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/50"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400"
              }`}
            >
              <span>🛒</span>
              <span>{isBengali ? "চেকআউট প্যানেল" : "Checkout Panel"}</span>
            </button>

            <button
              onClick={() => setActiveTab("prizes")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "prizes"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/50"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400"
              }`}
            >
              <span>🏆</span>
              <span>{isBengali ? "প্রাইজ পুল ডিস্ট্রিবিউশন" : "Prize Distribution"}</span>
            </button>

            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "rules"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/50"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400"
              }`}
            >
              <span>📜</span>
              <span>{isBengali ? "রুলস এন্ড রেগুলেশন" : "Rules & Regulations"}</span>
            </button>

            <button
              onClick={() => setActiveTab("teams")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "teams"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/50"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400"
              }`}
            >
              <span>👥</span>
              <span>{isBengali ? "রেজিস্টার্ড টিমস" : "Registered Teams"} ({tournament.takenSlots}/{tournament.totalSlots})</span>
            </button>
          </div>
        </div>

        {/* Modal Content Container */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">

          {/* ==================== TAB 1: MAIN CHECKOUT PANEL ==================== */}
          {activeTab === "checkout" && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                    {isBengali ? "চেকআউট প্যানেল" : "CHECKOUT PANEL"}
                  </span>
                  {currentUser && (
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block">{isBengali ? "আপনার ব্যালেন্স" : "Your Balance"}</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">৳ {balanceDisplay} BDT</span>
                    </div>
                  )}
                </div>

                {currentUser ? (
                  <div>
                    {isRegistered && !showBuyMoreForm ? (
                      /* ALREADY REGISTERED VIEW */
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <svg className="w-7 h-7 text-emerald-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h5 className="text-sm font-bold text-white uppercase font-mono">
                            {isBengali ? "আপনি ইতিমধ্যে নিবন্ধিত আছেন!" : "You're Registered!"}
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

                        {!isFull && !pm.isBookingClosed && (
                          <button
                            onClick={() => setShowBuyMoreForm(true)}
                            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer border border-violet-400/30"
                          >
                            {isBengali ? "+ আরও স্লট বুক করুন" : "+ Buy Additional Slots"}
                          </button>
                        )}

                        {/* WHATSAPP LINK ACCESS */}
                        <div className="bg-violet-950/20 border border-violet-500/30 rounded-xl p-4 space-y-3">
                          <p className="text-xs text-emerald-300 font-sans leading-relaxed">
                            {isBengali 
                              ? "আপনার নিবন্ধন সফল হয়েছে! গেমের রুম আইডি এবং পাসওয়ার্ড এই অফিসিয়াল গ্রুপে দেওয়া হবে।" 
                              : "Registration confirmed! Game Room ID & Password will be distributed inside this group."}
                          </p>

                          {tournament.whatsAppLink ? (
                            <a
                              href={decryptLink(tournament.whatsAppLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all font-mono uppercase cursor-pointer text-center"
                            >
                              <span>{isBengali ? "গ্রুপে যুক্ত হোন (হোয়াটসঅ্যাপ)" : "Join Group (WhatsApp)"}</span>
                            </a>
                          ) : (
                            <p className="text-[11px] font-mono font-bold text-amber-400/90 text-center bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                              {isBengali ? "গ্রুপ লিংক খুব শীঘ্রই যুক্ত করা হবে" : "Group link will be assigned soon"}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : pm.isBookingClosed ? (
                      /* BOOKING CLOSED VIEW */
                      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-center font-mono space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-black uppercase tracking-wider animate-pulse">
                          <span>{tournament.status === "Completed" ? (isBengali ? "ম্যাচ সমাপ্ত" : "MATCH ENDED") : (isBengali ? "ম্যাচ লাইভ" : "MATCH LIVE")}</span>
                        </div>
                        <h5 className="text-sm font-black text-rose-400 uppercase">
                          {isBengali ? "বুকিং বন্ধ (BOOKING CLOSED)" : "BOOKING CLOSED"}
                        </h5>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          {isBengali
                            ? "এই ম্যাচের নির্ধারিত কাউন্টডাউন টাইমার শেষ হয়ে গেছে। নতুন স্লট বুকিং এখন বন্ধ।"
                            : "The countdown timer for this match has expired. Slot booking is locked."}
                        </p>
                      </div>
                    ) : isFull ? (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center font-mono">
                        <span className="text-xs font-bold text-rose-500 uppercase">
                          {isBengali ? "স্লট সম্পূর্ণ ভর্তি!" : "Match is Fully Booked!"}
                        </span>
                      </div>
                    ) : (
                      /* FORM INPUTS & CHECKOUT */
                      <form onSubmit={handleRegister} className="space-y-4">
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

                        {/* 1. SELECT SLOT QUANTITY */}
                        <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl space-y-2">
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
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
                                {isBengali ? "মোট এন্ট্রি ফি" : "Total Fee"}
                              </span>
                              <span className="text-sm font-black text-amber-400 font-mono">
                                ৳ {isBengali ? convertToBengaliNumbers(totalCalculatedFee) : totalCalculatedFee} BDT
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. TEAM NAME INPUT */}
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
                            className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-violet-600 transition-colors"
                          />
                        </div>

                        {/* 3. IN-GAME NAME INPUT */}
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
                            className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-violet-600 transition-colors"
                          />
                        </div>

                        {errorMessage && (
                          <p className="text-xs font-mono text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                            {errorMessage}
                          </p>
                        )}

                        {/* 4. SUBMIT / REGISTER BUTTON & INSUFFICIENT BALANCE WARNING */}
                        <div className="pt-2 space-y-3">
                          {hasBalance ? (
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-lg shadow-violet-950/50"
                            >
                              {isSubmitting
                                ? (isBengali ? "প্রক্রিয়াধীন..." : "Processing...")
                                : (isBengali ? `নিবন্ধন করুন (৳${totalCalculatedFee} BDT কাটুন)` : `Register Now (Pay ৳${totalCalculatedFee} BDT)`)}
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-1">
                                <span className="text-xs font-black text-rose-400 font-sans block uppercase">
                                  ⚠️ {isBengali ? "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নাই!" : "Insufficient Balance in your Wallet!"}
                                </span>
                                <p className="text-[10px] text-zinc-400 font-mono">
                                  {isBengali 
                                    ? `প্রয়োজনীয় ফি: ৳${totalCalculatedFee} BDT | বর্তমান ব্যালেন্স: ৳${currentUser.balance} BDT` 
                                    : `Required Fee: ৳${totalCalculatedFee} BDT | Current Balance: ৳${currentUser.balance} BDT`}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {/* DEPOSIT BUTTON */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    if (onOpenDeposit) onOpenDeposit();
                                  }}
                                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5 border border-emerald-400/30"
                                >
                                  <span>🟢 {isBengali ? "ডিপোজিট করুন" : "Deposit"}</span>
                                </button>

                                {/* BUY VIA WHATSAPP BUTTON */}
                                <a
                                  href={buyWhatsAppUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setShowSuccessModal(true)}
                                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-violet-600/90 hover:bg-violet-500 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md border border-violet-400/30 text-center"
                                >
                                  <span>🟣 {isBengali ? "গ্রুপ হোয়াটসঅ্যাপের মাধ্যমে কিনুন" : "Buy via WhatsApp"}</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  /* LOGIN REQUIRED PROMPT */
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
                          clerk.openSignIn();
                        }}
                        className="py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase rounded-xl transition-colors font-mono cursor-pointer"
                      >
                        {isBengali ? "লগইন করুন" : "Log In"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          clerk.openSignUp();
                        }}
                        className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase rounded-xl transition-colors font-mono cursor-pointer border border-white/10"
                      >
                        {isBengali ? "একাউন্ট তৈরি করুন" : "Sign Up"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 2: PRIZE POOL DISTRIBUTION ==================== */}
          {activeTab === "prizes" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-2">
                {isBengali ? "পুরস্কার বিতরণী তালিকা" : "PRIZE POOL DISTRIBUTION"} ({tournament.prizeType})
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono">
                {tournament.prizePrizes?.map((prize, idx) => {
                  const placeDisplay = isBengali ? convertToBengaliNumbers(idx + 1) : idx + 1;
                  const prizeDisplay = isBengali ? convertToBengaliNumbers(prize) : prize;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5"
                    >
                      <span className="text-xs text-zinc-400 font-bold uppercase font-sans">
                        {placeDisplay}
                        {idx === 0 ? "st" : idx === 1 ? "nd" : idx === 2 ? "rd" : "th"}{" "}
                        {isBengali ? "স্থান" : "Place"}
                      </span>
                      <span className="text-sm font-black text-amber-400">৳ {prizeDisplay} BDT</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: RULES & REGULATIONS ==================== */}
          {activeTab === "rules" && (
            <div className="space-y-4 font-sans text-xs" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-2">
                  {isBengali ? "ম্যাচ বিবরণ" : "MATCH DESCRIPTION"}
                </h4>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                  {tournament.description || (isBengali ? "রুলস অনুযায়ী খেলা হবে।" : "Will be played according to standard platform rules.")}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-2 mb-2">
                  {isBengali ? "প্ল্যাটফর্ম নিয়মাবলী ও শর্তাবলী" : "PLATFORM RULES & REGULATIONS"}
                </h4>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                  {globalRules}
                </p>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: REGISTERED TEAMS ==================== */}
          {activeTab === "teams" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-2">
                {isBengali ? "নিবন্ধিত দলসমূহ" : "REGISTERED TEAMS"} ({tournament.takenSlots}/{tournament.totalSlots})
              </h4>
              
              {tournament.slots && tournament.slots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar font-mono">
                  {tournament.slots.map((slot, index) => {
                    const slotIdxDisplay = isBengali ? convertToBengaliNumbers(index + 1) : index + 1;
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 p-2.5 bg-black/40 border border-white/5 rounded-xl text-xs"
                      >
                        <span className="bg-black/80 border border-white/10 text-violet-400 font-bold px-2 py-0.5 rounded-md">
                          #{slotIdxDisplay}
                        </span>
                        <span className="font-semibold text-zinc-200 truncate">{slot.teamName}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-mono text-center py-6">
                  {isBengali ? "এখনো কোনো দল যুক্ত হয়নি। প্রথম স্লটটি বুক করুন!" : "No teams registered yet. Book your slot now!"}
                </p>
              )}
            </div>
          )}

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
