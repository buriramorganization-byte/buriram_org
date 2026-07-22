import React, { useState, useEffect } from "react";
import { Tournament, Transaction, SiteSettings, UserProfile } from "../types";
import { 
  createTournament, 
  updateTournament, 
  deleteTournament, 
  resetDailyMatches, 
  resetTournamentMatch,
  updateSiteSettings, 
  verifyTransaction 
} from "../services/firebaseService";
import { convertToBengaliNumbers } from "../utils/dateFormatter";
import { encryptLink, decryptLink } from "../utils/crypto";
import ImageUploader from "./ImageUploader";

interface AdminPanelProps {
  tournaments: Tournament[];
  transactions: Transaction[];
  siteSettings: SiteSettings;
  isBengali: boolean;
}

export default function AdminPanel({ tournaments, transactions, siteSettings, isBengali }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"tournaments" | "transactions" | "settings">("tournaments");
  
  // Site Settings Form State
  const [logoUrl, setLogoUrl] = useState(siteSettings.logoUrl || "");
  const [championRushBanner, setChampionRushBanner] = useState(siteSettings.championRushBanner || "");
  const [scrimsBanner, setScrimsBanner] = useState(siteSettings.scrimsBanner || "");
  const [paidBanner, setPaidBanner] = useState(siteSettings.paidBanner || "");
  const [globalRules, setGlobalRules] = useState(siteSettings.globalRules || "");
  const [bKashNumber, setBKashNumber] = useState(siteSettings.bKashNumber || "");
  const [nagadNumber, setNagadNumber] = useState(siteSettings.nagadNumber || "");
  const [bKashInstructions, setBKashInstructions] = useState(siteSettings.bKashInstructions || "");
  const [nagadInstructions, setNagadInstructions] = useState(siteSettings.nagadInstructions || "");
  const [whatsAppNumber, setWhatsAppNumber] = useState(siteSettings.whatsAppNumber || "");
  const [customAnnouncement, setCustomAnnouncement] = useState(siteSettings.customAnnouncement || "");
  const [enableBannerTextOverlay, setEnableBannerTextOverlay] = useState(siteSettings.enableBannerTextOverlay ?? false);
  
  const [settingsMessage, setSettingsMessage] = useState("");

  // Sync settings state when prop changes
  useEffect(() => {
    setLogoUrl(siteSettings.logoUrl || "");
    setChampionRushBanner(siteSettings.championRushBanner || "");
    setScrimsBanner(siteSettings.scrimsBanner || "");
    setPaidBanner(siteSettings.paidBanner || "");
    setGlobalRules(siteSettings.globalRules || "");
    setBKashNumber(siteSettings.bKashNumber || "");
    setNagadNumber(siteSettings.nagadNumber || "");
    setBKashInstructions(siteSettings.bKashInstructions || "");
    setNagadInstructions(siteSettings.nagadInstructions || "");
    setWhatsAppNumber(siteSettings.whatsAppNumber || "");
    setCustomAnnouncement(siteSettings.customAnnouncement || "");
    setEnableBannerTextOverlay(siteSettings.enableBannerTextOverlay ?? false);
  }, [siteSettings]);

  // Tournament Create/Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Champion Rush" | "Scrims" | "Paid Tournaments">("Champion Rush");
  const [selectedMaps, setSelectedMaps] = useState<string[]>(["Bermuda"]);
  const [customMapInput, setCustomMapInput] = useState<string>("");
  const [matchDate, setMatchDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [matchTime, setMatchTime] = useState("18:30");
  const [entryFee, setEntryFee] = useState<number>(0);
  const [totalSlots, setTotalSlots] = useState<number>(48);
  const [prizePool, setPrizePool] = useState<number>(500);
  const [prizeType, setPrizeType] = useState<"Top 3" | "Top 4" | "Top 5">("Top 3");
  const [prizePrizes, setPrizePrizes] = useState<number[]>([250, 150, 100]);
  const [whatsAppLink, setWhatsAppLink] = useState("");
  const [description, setDescription] = useState("");
  
  const [formMessage, setFormMessage] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // In-app Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isProcessing?: boolean;
  } | null>(null);

  // Category-wise Rules Management state
  const [selectedRulesCategory, setSelectedRulesCategory] = useState<"Champion Rush" | "Scrims" | "Paid Tournaments">("Champion Rush");
  const [categoryRulesText, setCategoryRulesText] = useState("");
  const [rulesMessage, setRulesMessage] = useState("");

  // Auto-load rules on category selection change
  useEffect(() => {
    if (selectedRulesCategory === "Champion Rush") {
      setCategoryRulesText(siteSettings.championRushRules || "");
    } else if (selectedRulesCategory === "Scrims") {
      setCategoryRulesText(siteSettings.scrimsRules || "");
    } else if (selectedRulesCategory === "Paid Tournaments") {
      setCategoryRulesText(siteSettings.paidTournamentRules || "");
    }
  }, [selectedRulesCategory, siteSettings]);

  // Transaction action modal
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [txnActionType, setTxnActionType] = useState<"Approved" | "Rejected">("Approved");
  const [adminReference, setAdminReference] = useState("");
  const [isSubmittingTxn, setIsSubmittingTxn] = useState(false);
  const [txnMessage, setTxnMessage] = useState("");

  // Reset prizes list when type changes
  useEffect(() => {
    if (editingId) return; // Ignore on initial edits load
    if (prizeType === "Top 3") {
      setPrizePrizes([250, 150, 100]);
    } else if (prizeType === "Top 4") {
      setPrizePrizes([250, 150, 100, 50]);
    } else {
      setPrizePrizes([250, 150, 100, 50, 30]);
    }
  }, [prizeType, editingId]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage("");
    try {
      await updateSiteSettings({
        logoUrl: logoUrl.trim(),
        championRushBanner: championRushBanner.trim(),
        scrimsBanner: scrimsBanner.trim(),
        paidBanner: paidBanner.trim(),
        globalRules: globalRules.trim(),
        bKashNumber: bKashNumber.trim(),
        nagadNumber: nagadNumber.trim(),
        bKashInstructions: bKashInstructions.trim(),
        nagadInstructions: nagadInstructions.trim(),
        whatsAppNumber: whatsAppNumber.trim(),
        customAnnouncement: customAnnouncement.trim(),
        enableBannerTextOverlay: !!enableBannerTextOverlay
      });
      setSettingsMessage(isBengali ? "সেটিংস সফলভাবে আপডেট হয়েছে!" : "Global Settings saved successfully!");
    } catch (err: any) {
      setSettingsMessage(err.message || "Failed to update settings.");
    }
  };

  const handleTournamentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStartDateTime = `${matchDate}T${matchTime}`;
    if (!title.trim() || !matchDate || !matchTime) {
      setFormMessage(isBengali ? "সব ঘর সঠিক তথ্য দিয়ে পূরণ করুন।" : "Please fill out all required fields.");
      return;
    }

    const finalMapName = selectedMaps.length > 0 ? selectedMaps.join(", ") : "Bermuda";

    setFormMessage("");
    setIsSubmittingForm(true);
    try {
      const data = {
        title: title.trim(),
        category,
        mapName: finalMapName,
        startDateTime: finalStartDateTime,
        entryFee: Number(entryFee),
        totalSlots: Number(totalSlots),
        prizePool: Number(prizePool),
        prizeType,
        prizePrizes: prizePrizes.map(Number),
        whatsAppLink: encryptLink(whatsAppLink.trim()),
        description: description.trim(),
        status: "Upcoming" as const
      };

      if (editingId) {
        await updateTournament(editingId, data);
        setFormMessage(isBengali ? "টুর্নামেন্ট সফলভাবে আপডেট হয়েছে!" : "Tournament updated successfully!");
        setEditingId(null);
      } else {
        await createTournament(data);
        setFormMessage(isBengali ? "নতুন টুর্নামেন্ট তৈরি হয়েছে!" : "New tournament created successfully!");
      }

      // Reset form fields
      setTitle("");
      setSelectedMaps(["Bermuda"]);
      setCustomMapInput("");
      const now = new Date();
      setMatchDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
      setMatchTime("18:30");
      setEntryFee(0);
      setTotalSlots(48);
      setPrizePool(500);
      setWhatsAppLink("");
      setDescription("");
    } catch (err: any) {
      setFormMessage(err.message || "Failed to save tournament.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleRulesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRulesMessage("");
    try {
      const updates: Partial<SiteSettings> = {};
      if (selectedRulesCategory === "Champion Rush") {
        updates.championRushRules = categoryRulesText.trim();
      } else if (selectedRulesCategory === "Scrims") {
        updates.scrimsRules = categoryRulesText.trim();
      } else if (selectedRulesCategory === "Paid Tournaments") {
        updates.paidTournamentRules = categoryRulesText.trim();
      }
      await updateSiteSettings(updates);
      setRulesMessage(isBengali ? "নিয়মাবলী সফলভাবে আপডেট হয়েছে!" : "Category rules updated successfully!");
    } catch (err: any) {
      setRulesMessage(err.message || "Failed to save category rules.");
    }
  };

  const handleEditTournament = (t: Tournament) => {
    setEditingId(t.id);
    setTitle(t.title);
    setCategory(t.category);
    
    const existingMaps = t.mapName ? t.mapName.split(",").map(m => m.trim()).filter(Boolean) : ["Bermuda"];
    setSelectedMaps(existingMaps.length > 0 ? existingMaps : ["Bermuda"]);
    setCustomMapInput("");

    // Parse date and time
    let datePart = "";
    let timePart = "";
    if (t.startDateTime) {
      const parts = t.startDateTime.split("T");
      if (parts.length > 1) {
        datePart = parts[0];
        timePart = parts[1].substring(0, 5);
      } else {
        const spaceParts = t.startDateTime.split(" ");
        if (spaceParts.length > 1) {
          datePart = spaceParts[0];
          timePart = spaceParts[1].substring(0, 5);
        } else {
          const now = new Date();
          datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          timePart = "18:30";
        }
      }
    }
    setMatchDate(datePart);
    setMatchTime(timePart);

    setEntryFee(t.entryFee);
    setTotalSlots(t.totalSlots);
    setPrizePool(t.prizePool);
    setPrizeType(t.prizeType);
    setPrizePrizes(t.prizePrizes || []);
    setWhatsAppLink(decryptLink(t.whatsAppLink || ""));
    setDescription(t.description || "");
    setFormMessage("");
  };

  const handleDeleteTournament = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: isBengali ? "টুর্নামেন্ট মুছে ফেলার নিশ্চিতকরণ" : "Confirm Delete Tournament",
      message: isBengali 
        ? "আপনি কি সত্যিই এই টুর্নামেন্টটি মুছে ফেলতে চান? এটি মুছে ফেললে পুনরুদ্ধার করা সম্ভব নয়।" 
        : "Are you sure you want to delete this tournament? This action cannot be undone.",
      action: async () => {
        await deleteTournament(id);
        setFormMessage(isBengali ? "টুর্নামেন্টটি সফলভাবে মুছে ফেলা হয়েছে।" : "Tournament deleted successfully!");
      }
    });
  };

  const handleResetMatches = () => {
    setConfirmModal({
      isOpen: true,
      title: isBengali ? "দৈনিক ম্যাচ রিসেট করার নিশ্চিতকরণ" : "Confirm Reset Daily Matches",
      message: isBengali 
        ? "দৈনিক ম্যাচ রিসেট করবেন? এতে সব ম্যাচে বুক হওয়া স্লট শূন্য হবে এবং সব হোয়াটসঅ্যাপ গ্রুপ লিংক মুছে যাবে।" 
        : "Reset Daily Matches? This will clear all joined slots and WhatsApp links for all tournaments.",
      action: async () => {
        await resetDailyMatches();
        setFormMessage(isBengali ? "সব দৈনিক ম্যাচ সফলভাবে রিসেট করা হয়েছে!" : "Daily matches reset successfully!");
      }
    });
  };

  const handleResetSingleMatch = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: isBengali ? "ম্যাচ রিসেট করার নিশ্চিতকরণ" : "Confirm Reset Match",
      message: isBengali 
        ? "আপনি কি নিশ্চিত যে এই ম্যাচটি রিসেট করতে চান? এতে বুক হওয়া সব স্লট খালি হবে এবং লাইভ কাউন্টডাউন পুনারায় শুরু হবে।" 
        : "Are you sure you want to reset this match? This will clear all slots and restart the live countdown.",
      action: async () => {
        await resetTournamentMatch(id);
        setFormMessage(isBengali ? "ম্যাচটি সফলভাবে রিসেট করা হয়েছে!" : "Match reset successfully!");
      }
    });
  };

  const handleVerifyTxnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn) return;

    setIsSubmittingTxn(true);
    setTxnMessage("");
    try {
      const res = await verifyTransaction(selectedTxn.id, txnActionType, adminReference.trim());
      if (res.success) {
        setTxnMessage(isBengali ? "লেনদেন সফলভাবে প্রক্রিয়া সম্পন্ন হয়েছে।" : "Transaction verified successfully!");

        setTimeout(() => {
          setSelectedTxn(null);
          setAdminReference("");
          setTxnMessage("");
        }, 1500);
      } else {
        setTxnMessage(res.message);
      }
    } catch (err: any) {
      setTxnMessage(err.message || "An error occurred.");
    } finally {
      setIsSubmittingTxn(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-mono text-xs">
      
      {/* Top Controller Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div>
          <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest block mb-1">
            {isBengali ? "বুড়িরাম অ্যাডমিন কন্ট্রোল" : "BURIRAM ORG CENTRAL INTELLIGENCE"}
          </span>
          <h2 className="text-xl font-bold text-white uppercase font-sans">
            {isBengali ? "মাস্টার ড্যাশবোর্ড" : "ADMIN MASTER PANEL"}
          </h2>
        </div>

        {/* Global Reset Action */}
        <button
          onClick={handleResetMatches}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 hover:scale-105 active:scale-95 text-white font-bold rounded-lg transition-all shadow-md shadow-rose-950/40 cursor-pointer uppercase flex items-center gap-2"
        >
          {isBengali ? "দৈনিক ম্যাচ রিসেট করুন" : "Reset Daily Matches"}
        </button>
      </div>

      {/* Admin Subtabs Selector */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveSubTab("tournaments")}
          className={`px-4 py-2 font-bold uppercase transition-all tracking-wider ${
            activeSubTab === "tournaments" 
              ? "text-violet-400 border-b-2 border-violet-500 pb-1.5" 
              : "text-zinc-500 hover:text-zinc-300 pb-1.5"
          }`}
        >
          {isBengali ? "টুর্নামেন্ট ম্যানেজার" : "Tournaments Manager"}
        </button>
        <button
          onClick={() => setActiveSubTab("transactions")}
          className={`px-4 py-2 font-bold uppercase transition-all tracking-wider flex items-center gap-2 ${
            activeSubTab === "transactions" 
              ? "text-violet-400 border-b-2 border-violet-500 pb-1.5" 
              : "text-zinc-500 hover:text-zinc-300 pb-1.5"
          }`}
        >
          {isBengali ? "লেনদেন ভেরিফায়ার" : "Transactions Verifier"}{" "}
          {transactions.filter(t => t.status === "Pending").length > 0 && (
            <span className="bg-amber-500 text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black animate-pulse">
              {transactions.filter(t => t.status === "Pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("settings")}
          className={`px-4 py-2 font-bold uppercase transition-all tracking-wider ${
            activeSubTab === "settings" 
              ? "text-violet-400 border-b-2 border-violet-500 pb-1.5" 
              : "text-zinc-500 hover:text-zinc-300 pb-1.5"
          }`}
        >
          {isBengali ? "সাইট সেটিংস ও ব্যানার" : "Site Settings & Banners"}
        </button>
        <button
          onClick={() => setActiveSubTab("rules")}
          className={`px-4 py-2 font-bold uppercase transition-all tracking-wider ${
            activeSubTab === "rules" 
              ? "text-violet-400 border-b-2 border-violet-500 pb-1.5" 
              : "text-zinc-500 hover:text-zinc-300 pb-1.5"
          }`}
        >
          {isBengali ? "রুলস ও টাইমলাইন ম্যানেজমেন্ট" : "Rules & Timeline Management"}
        </button>
      </div>

      {/* ==================== SUBTAB: TOURNAMENTS MANAGER ==================== */}
      {activeSubTab === "tournaments" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Create/Edit Form (Left 5 Columns) */}
          <form onSubmit={handleTournamentSubmit} className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white uppercase font-sans border-b border-zinc-800 pb-2 mb-3">
              {editingId ? (isBengali ? "টুর্নামেন্ট সম্পাদনা" : "EDIT TOURNAMENT") : (isBengali ? "নতুন টুর্নামেন্ট তৈরি" : "CREATE NEW TOURNAMENT")}
            </h3>

            <div>
              <label className="block text-zinc-500 mb-1">{isBengali ? "টুর্নামেন্ট টাইটেল" : "TOURNAMENT TITLE"}</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scrims Match #14"
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white"
              />
            </div>

            {/* Dynamic Multi-Select Map Selection Tags System */}
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>{isBengali ? "ম্যাপ নির্বাচন করুন (Multi-Select Tags)" : "SELECT MAPS (MULTI-SELECT)"}</span>
                <span className="text-[10px] text-violet-400 font-mono font-normal">{isBengali ? "*একাধিক ম্যাপ সিলেক্ট করতে পারবেন" : "*Multiple maps allowed"}</span>
              </label>
              
              {/* Dropdown to pick standard maps */}
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !selectedMaps.includes(val)) {
                      setSelectedMaps([...selectedMaps, val]);
                    }
                    e.target.value = "";
                  }}
                  className="flex-1 p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-violet-500"
                >
                  <option value="">{isBengali ? "+ ম্যাপ সিলেক্ট করুন..." : "+ Select Map..."}</option>
                  <option value="Bermuda">Bermuda</option>
                  <option value="Purgatory">Purgatory</option>
                  <option value="Kalahari">Kalahari</option>
                  <option value="Alpine">Alpine</option>
                  <option value="NeXTera">NeXTera</option>
                </select>
              </div>

              {/* Custom map input field */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customMapInput}
                  onChange={(e) => setCustomMapInput(e.target.value)}
                  placeholder={isBengali ? "কাস্টম ম্যাপ লিখুন..." : "Type custom map name..."}
                  className="flex-1 p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs font-sans focus:outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customMapInput.trim() && !selectedMaps.includes(customMapInput.trim())) {
                      setSelectedMaps([...selectedMaps, customMapInput.trim()]);
                      setCustomMapInput("");
                    }
                  }}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  {isBengali ? "যোগ করুন" : "Add"}
                </button>
              </div>

              {/* Selected Map Tag Badges */}
              <div className="flex flex-wrap gap-2 mt-2.5 min-h-[36px] p-2 bg-zinc-950/80 border border-zinc-850 rounded-lg">
                {selectedMaps.length === 0 ? (
                  <span className="text-[11px] text-zinc-500 italic font-mono">{isBengali ? "কোনো ম্যাপ সিলেক্ট করা হয়নি" : "No maps selected"}</span>
                ) : (
                  selectedMaps.map((m) => (
                    <span key={m} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-600/20 border border-violet-500/40 text-violet-300 rounded-lg text-xs font-bold font-sans">
                      {m}
                      <button
                        type="button"
                        onClick={() => setSelectedMaps(selectedMaps.filter(item => item !== m))}
                        className="hover:text-rose-400 font-black cursor-pointer text-sm leading-none ml-1"
                        title="Remove map"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-500 text-xs mb-1">{isBengali ? "ক্যাটাগরি" : "CATEGORY"}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs"
                >
                  <option value="Champion Rush">Champion Rush</option>
                  <option value="Scrims">Scrims</option>
                  <option value="Paid Tournaments">Paid Tournaments</option>
                </select>
              </div>
              
              <div>
                <label className="block text-zinc-500 text-xs mb-1">{isBengali ? "তারিখ" : "DATE"}</label>
                <input
                  type="date"
                  required
                  readOnly={!editingId}
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className={`w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs ${!editingId ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>

              <div>
                <label className="block text-zinc-500 text-xs mb-1">{isBengali ? "সময়" : "TIME"}</label>
                <input
                  type="time"
                  required
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-500 mb-1">{isBengali ? "প্রবেশ ফি (BDT)" : "ENTRY FEE"}</label>
                <input
                  type="number"
                  required
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">{isBengali ? "সর্বমোট স্লট" : "TOTAL SLOTS"}</label>
                <input
                  type="number"
                  required
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(Number(e.target.value))}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">{isBengali ? "পুরস্কার পুল" : "PRIZE POOL"}</label>
                <input
                  type="number"
                  required
                  value={prizePool}
                  onChange={(e) => setPrizePool(Number(e.target.value))}
                  className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                />
              </div>
            </div>

            {/* LIVE PRIZE BREAKDOWN DYNAMIC FIELDS */}
            <div className="bg-zinc-950 border border-zinc-850 p-3 rounded space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-violet-400">{isBengali ? "পুরস্কার বিতরণী ধরণ" : "Prize Distribution Type"}</span>
                <select
                  value={prizeType}
                  onChange={(e) => setPrizeType(e.target.value as any)}
                  className="p-1 bg-zinc-900 border border-zinc-800 rounded text-white"
                >
                  <option value="Top 3">Top 3 Places</option>
                  <option value="Top 4">Top 4 Places</option>
                  <option value="Top 5">Top 5 Places</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: prizeType === "Top 3" ? 3 : prizeType === "Top 4" ? 4 : 5 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[10px] w-12 font-bold">{idx + 1}st BDT:</span>
                    <input
                      type="number"
                      value={prizePrizes[idx] || 0}
                      onChange={(e) => {
                        const updated = [...prizePrizes];
                        updated[idx] = Number(e.target.value);
                        setPrizePrizes(updated);
                      }}
                      className="p-1 w-full bg-zinc-900 border border-zinc-800 rounded text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 mb-1">{isBengali ? "ম্যাচ স্পেসিফিক বিবরণ" : "MATCH DESCRIPTION (e.g. Sniper Only)"}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sniper Only, Classic Kalahari, etc."
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white h-20"
              />
            </div>

            <div>
              <label className="block text-zinc-500 mb-1">{isBengali ? "হোয়াটসঅ্যাপ গ্রুপ লিংক" : "PRIVATE WHATSAPP GROUP LINK (For Buyers)"}</label>
              <input
                type="text"
                value={whatsAppLink}
                onChange={(e) => setWhatsAppLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white"
              />
            </div>

            {formMessage && (
              <p className="p-2.5 bg-violet-950/20 border border-violet-800 text-violet-300 rounded text-center">
                {formMessage}
              </p>
            )}

            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    const now = new Date();
                    setMatchDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
                    setMatchTime("18:30");
                    setEntryFee(0);
                    setTotalSlots(48);
                    setPrizePool(500);
                    setWhatsAppLink("");
                    setDescription("");
                    setFormMessage("");
                  }}
                  className="flex-1 py-2 bg-zinc-800 text-zinc-400 rounded uppercase font-bold"
                >
                  {isBengali ? "বাতিল" : "Cancel"}
                </button>
              )}
              
              <button
                type="submit"
                disabled={isSubmittingForm}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white rounded uppercase font-bold cursor-pointer"
              >
                {isSubmittingForm ? "..." : editingId ? (isBengali ? "সংরক্ষণ করুন" : "Update") : (isBengali ? "তৈরি করুন" : "Create")}
              </button>
            </div>
          </form>

          {/* Matches List (Right 7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-white uppercase font-sans border-b border-zinc-800 pb-2 mb-3">
              {isBengali ? "চলতি ও আসন্ন টুর্নামেন্টসমূহ" : "ACTIVE TOURNAMENTS"} ({tournaments.length})
            </h3>

            {tournaments.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {tournaments.map((t) => {
                  const dateDisplay = new Date(t.startDateTime).toLocaleString(isBengali ? "bn-BD" : "en-US");
                  const entryFeeDisplay = isBengali ? convertToBengaliNumbers(t.entryFee) : t.entryFee;
                  const takenSlotsDisplay = isBengali ? convertToBengaliNumbers(t.takenSlots) : t.takenSlots;
                  const totalSlotsDisplay = isBengali ? convertToBengaliNumbers(t.totalSlots) : t.totalSlots;

                  return (
                    <div 
                      key={t.id} 
                      className="p-4 bg-zinc-950 border border-zinc-800 hover:border-violet-600/30 rounded-xl transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-violet-400 uppercase">
                            {t.category}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1.5">{t.title}</h4>
                          <p className="text-zinc-500 text-[10px] mt-1">{dateDisplay}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] text-zinc-400">
                            <span>{isBengali ? "প্রবেশ ফি" : "Fee"}: <b className="text-white">৳ {entryFeeDisplay}</b></span>
                            <span>{isBengali ? "স্লট" : "Slots"}: <b className="text-white">{takenSlotsDisplay}/{totalSlotsDisplay}</b></span>
                            <span className={`px-1 rounded ${
                              t.status === "Upcoming" 
                                ? "bg-amber-500/10 text-amber-400" 
                                : "bg-emerald-500/10 text-emerald-400 animate-pulse"
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                          <button
                            onClick={() => setExpandedTournamentId(expandedTournamentId === t.id ? null : t.id)}
                            className="px-2.5 py-1 text-[10px] uppercase font-sans font-black bg-violet-950/60 border border-violet-800/60 hover:bg-violet-900 text-violet-300 rounded transition-all cursor-pointer"
                            title="Slots List"
                          >
                            {isBengali ? `টিম লিস্ট (${t.slots ? t.slots.length : 0})` : `Slots (${t.slots ? t.slots.length : 0})`}
                          </button>
                          <button
                            onClick={() => handleResetSingleMatch(t.id)}
                            className="px-2.5 py-1 text-[10px] uppercase font-sans font-black bg-zinc-900 border border-zinc-850 hover:border-emerald-500 hover:text-emerald-400 text-emerald-500 rounded transition-all cursor-pointer"
                            title="Reset"
                          >
                            {isBengali ? "রিসেট" : "RESET"}
                          </button>
                          <button
                            onClick={() => handleEditTournament(t)}
                            className="px-2.5 py-1 text-[10px] uppercase font-sans font-black bg-zinc-900 border border-zinc-850 hover:border-violet-500 hover:text-violet-400 text-zinc-300 rounded transition-all cursor-pointer"
                            title="Edit"
                          >
                            {isBengali ? "সম্পাদনা" : "EDIT"}
                          </button>
                          <button
                            onClick={() => handleDeleteTournament(t.id)}
                            className="px-2.5 py-1 text-[10px] uppercase font-sans font-black bg-zinc-900 border border-zinc-850 hover:border-rose-500 hover:text-rose-400 text-rose-500 rounded transition-all cursor-pointer"
                            title="Delete"
                          >
                            {isBengali ? "মুছে ফেলুন" : "DELETE"}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Registered Teams & IGN List */}
                      {expandedTournamentId === t.id && (
                        <div className="pt-3 border-t border-zinc-850 space-y-2 bg-black/40 p-3 rounded-lg font-mono text-[11px]">
                          <h5 className="font-bold text-violet-400 uppercase text-[10px]">
                            {isBengali ? "বুককৃত টিম ও ইন-গেম নাম (IGN) তালিকা" : "REGISTERED TEAMS & IGL / IGN DETAILS"} ({t.slots ? t.slots.length : 0})
                          </h5>
                          {t.slots && t.slots.length > 0 ? (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                              {t.slots.map((s, idx) => (
                                <div key={idx} className="flex flex-wrap items-center justify-between p-2 bg-zinc-900/80 border border-zinc-800 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold text-[10px]">#{idx + 1}</span>
                                    <div>
                                      <span className="font-bold text-white block">{s.teamName}</span>
                                      <span className="text-violet-400 text-[10px]">IGN / IGL: {s.ignName || "N/A"}</span>
                                    </div>
                                  </div>
                                  <div className="text-right text-[10px] text-zinc-500">
                                    <span className="block">{s.userEmail}</span>
                                    <span>{s.joinedAt ? new Date(s.joinedAt).toLocaleTimeString() : ""}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-zinc-500 text-[10px] italic">
                              {isBengali ? "এখনো কোনো টিম যুক্ত হয়নি।" : "No slots registered yet."}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-12">
                {isBengali ? "কোনো টুর্নামেন্ট পাওয়া যায়নি।" : "No matches created yet."}
              </p>
            )}
          </div>

        </div>
      )}

      {/* ==================== SUBTAB: TRANSACTIONS VERIFIER ==================== */}
      {activeSubTab === "transactions" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white uppercase font-sans border-b border-zinc-800 pb-2 mb-3">
            {isBengali ? "লেনদেন অনুমোদন পেন্ডিং তালিকা" : "PENDING TRANSACTION REQUESTS"}
          </h3>

          {transactions.filter(t => t.status === "Pending").length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transactions
                .filter((t) => t.status === "Pending")
                .map((t) => {
                  const amountDisplay = isBengali ? convertToBengaliNumbers(t.amount) : t.amount;
                  const feeDisplay = isBengali ? convertToBengaliNumbers(t.fee) : t.fee;
                  const dateDisplay = new Date(t.createdAt).toLocaleString(isBengali ? "bn-BD" : "en-US");

                  return (
                    <div 
                      key={t.id} 
                      className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            t.type === "Deposit" 
                              ? "bg-emerald-500/10 text-emerald-400" 
                              : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {t.type === "Deposit" ? (isBengali ? "ডিপোজিট" : "Deposit") : (isBengali ? "উত্তোলন" : "Withdrawal")}
                          </span>
                          <span className="text-[10px] text-zinc-500">{dateDisplay}</span>
                        </div>

                        <div className="text-sm font-bold text-white flex items-center justify-between">
                          <span>{t.userName}</span>
                          <span className="text-violet-400">৳ {amountDisplay} BDT</span>
                        </div>

                        <p className="text-zinc-400 text-[10px] truncate">{t.userEmail}</p>

                        <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded font-mono text-zinc-300 space-y-1 text-[11px]">
                          <div>{isBengali ? "মোবাইল নাম্বার" : "Mobile"}: <b className="text-white">{t.mobileNumber}</b></div>
                          <div>{isBengali ? "পদ্ধতি" : "Method"}: <b className="text-white">{t.method} Personal</b></div>
                          {t.type === "Deposit" ? (
                            <div>{isBengali ? "লেনদেন আইডি" : "TxnID"}: <b className="text-fuchsia-400">{t.transactionId}</b></div>
                          ) : (
                            <div className="text-rose-400">{isBengali ? "৫ টাকা ফ্ল্যাট চার্জ করা হবে" : "Flat 5 BDT fee applies"}</div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedTxn(t); setTxnActionType("Rejected"); }}
                          className="flex-1 py-2 bg-rose-950/20 border border-rose-800 hover:bg-rose-900 text-rose-400 rounded font-bold uppercase cursor-pointer text-center"
                        >
                          {isBengali ? "প্রত্যাখ্যান" : "Reject"}
                        </button>
                        
                        <button
                          onClick={() => { setSelectedTxn(t); setTxnActionType("Approved"); }}
                          className="flex-1 py-2 bg-emerald-950/20 border border-emerald-800 hover:bg-emerald-900 text-emerald-400 rounded font-bold uppercase cursor-pointer text-center"
                        >
                          {isBengali ? "অনুমোদন" : "Approve"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-12">
              {isBengali ? "কোনো পেন্ডিং লেনদেন অনুরোধ নেই।" : "No pending transaction requests found."}
            </p>
          )}

          {/* Verification Modal for Admin Reference Payout Input */}
          {selectedTxn && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <form onSubmit={handleVerifyTxnSubmit} className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
                <h4 className="text-sm font-bold text-white uppercase border-b border-zinc-800 pb-2 mb-2">
                  {isBengali ? "অনুমোদন নিশ্চিতকরণ" : "CONFIRM VERIFICATION ACTION"}
                </h4>

                <p className="text-zinc-400 leading-relaxed text-xs">
                  {isBengali 
                    ? `আপনি কি নিশ্চিত ${selectedTxn.userName} এর ৳ ${selectedTxn.amount} BDT অনুরোধটি "${txnActionType}" করতে চান?` 
                    : `Are you sure you want to change status to "${txnActionType}" for ${selectedTxn.userName}'s ৳ ${selectedTxn.amount} BDT request?`}
                </p>

                <div>
                  <label className="block text-zinc-500 mb-1">
                    {isBengali ? "পেমেন্ট রেফারেন্স / ট্রানজেকশন আইডি" : "PAYOUT / TRANSACTION REFERENCE (Optional for player history)"}
                  </label>
                  <input
                    type="text"
                    value={adminReference}
                    onChange={(e) => setAdminReference(e.target.value)}
                    placeholder="e.g. SENT-BY-BKASH-8822"
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-white text-xs focus:outline-none"
                  />
                </div>

                {txnMessage && (
                  <p className="p-2 bg-violet-950/20 border border-violet-800 text-violet-300 text-center rounded text-[11px]">
                    {txnMessage}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedTxn(null); setAdminReference(""); }}
                    className="flex-1 py-2 bg-zinc-800 text-zinc-400 rounded uppercase font-bold"
                  >
                    {isBengali ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTxn}
                    className={`flex-1 py-2 font-bold uppercase rounded cursor-pointer ${
                      txnActionType === "Approved" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}
                  >
                    {isSubmittingTxn ? "..." : (isBengali ? "নিশ্চিত করুন" : "Confirm")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Historic verified Transactions logs */}
          <div className="mt-8 space-y-4">
            <h3 className="text-base font-bold text-white uppercase font-sans border-b border-zinc-800 pb-2 mb-3">
              {isBengali ? "লেনদেন ইতিহাস" : "RECENT TRANSACTION LOGS"}
            </h3>

            {transactions.filter(t => t.status !== "Pending").length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar border border-zinc-800/40 rounded-xl">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
                      <th className="p-3">{isBengali ? "ব্যবহারকারী" : "USER"}</th>
                      <th className="p-3">{isBengali ? "ধরণ" : "TYPE"}</th>
                      <th className="p-3">{isBengali ? "পদ্ধতি" : "METHOD"}</th>
                      <th className="p-3">{isBengali ? "পরিমাণ" : "AMOUNT"}</th>
                      <th className="p-3">{isBengali ? "মোবাইল" : "MOBILE"}</th>
                      <th className="p-3">{isBengali ? "অবস্থা" : "STATUS"}</th>
                      <th className="p-3">{isBengali ? "রেফারেন্স" : "REFERENCE"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/20 text-zinc-300 bg-zinc-900/10">
                    {transactions.filter(t => t.status !== "Pending").slice(0, 15).map((t) => {
                      const amountVal = isBengali ? convertToBengaliNumbers(t.amount) : t.amount;
                      return (
                        <tr key={t.id} className="hover:bg-zinc-900/20">
                          <td className="p-3">
                            <span className="block font-bold text-white">{t.userName}</span>
                            <span className="block text-[10px] text-zinc-500">{t.userEmail}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              t.type === "Deposit" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="p-3">{t.method}</td>
                          <td className="p-3 font-bold">৳ {amountVal} BDT</td>
                          <td className="p-3 text-zinc-400">{t.mobileNumber}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              t.status === "Approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-400 font-mono text-[10px] truncate max-w-[150px]">
                            {t.adminReference || t.transactionId}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-6">
                {isBengali ? "কোনো ইতিহাস নেই।" : "No processed transactions found."}
              </p>
            )}
          </div>

        </div>
      )}

      {/* ==================== SUBTAB: SITE SETTINGS ==================== */}
      {activeSubTab === "settings" && (
        <form onSubmit={handleSettingsSubmit} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white uppercase font-sans border-b border-zinc-800 pb-2 mb-3">
            {isBengali ? "সাইট কনফিগারেশন সেটিংস" : "GLOBAL SITE SETTINGS"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <ImageUploader
                label={isBengali ? "অফিসিয়াল লোগো (Cloudinary)" : "OFFICIAL LOGO (Cloudinary)"}
                isBengali={isBengali}
                currentImageUrl={logoUrl}
                onUploadSuccess={(url) => setLogoUrl(url)}
              />
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste direct image URL..."
                className="w-full p-2 bg-zinc-950/60 border border-zinc-800 rounded text-white text-[10px] font-mono mt-1"
              />
            </div>
            
            <div className="flex flex-col justify-end">
              <label className="block text-zinc-400 font-sans font-semibold text-xs tracking-wide uppercase mb-2">
                {isBengali ? "কাস্টম জেনারেল ঘোষণা (ঐচ্ছিক)" : "CUSTOM SCROLLING ANNOUNCEMENT OVERRIDE"}
              </label>
              <input
                type="text"
                value={customAnnouncement}
                onChange={(e) => setCustomAnnouncement(e.target.value)}
                placeholder={isBengali ? "আজকের বিশেষ টুর্নামেন্ট..." : "Today's champion scrim start delay..."}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-4">
            <span className="font-bold text-violet-400 text-xs block border-b border-zinc-800 pb-1.5 uppercase">
              {isBengali ? "ক্যাটাগরি ব্যানার ইমেজ সেটিং" : "CATEGORY HERO BANNERS"}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <ImageUploader
                  label="Champion Rush"
                  isBengali={isBengali}
                  currentImageUrl={championRushBanner}
                  onUploadSuccess={(url) => setChampionRushBanner(url)}
                />
                <input
                  type="text"
                  value={championRushBanner}
                  onChange={(e) => setChampionRushBanner(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-white text-[9px] font-mono"
                />
              </div>
              <div className="space-y-1">
                <ImageUploader
                  label="Scrims"
                  isBengali={isBengali}
                  currentImageUrl={scrimsBanner}
                  onUploadSuccess={(url) => setScrimsBanner(url)}
                />
                <input
                  type="text"
                  value={scrimsBanner}
                  onChange={(e) => setScrimsBanner(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-white text-[9px] font-mono"
                />
              </div>
              <div className="space-y-1">
                <ImageUploader
                  label="Paid Tournaments"
                  isBengali={isBengali}
                  currentImageUrl={paidBanner}
                  onUploadSuccess={(url) => setPaidBanner(url)}
                />
                <input
                  type="text"
                  value={paidBanner}
                  onChange={(e) => setPaidBanner(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-white text-[9px] font-mono"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
              <input
                type="checkbox"
                id="enableBannerTextOverlay"
                checked={enableBannerTextOverlay}
                onChange={(e) => setEnableBannerTextOverlay(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <label htmlFor="enableBannerTextOverlay" className="text-xs text-zinc-400 font-bold select-none cursor-pointer uppercase">
                {isBengali ? "হিরো ব্যানারে টেক্সট ওভারলে এবং ব্যাজ সক্রিয় করুন" : "Enable Text Overlay & Badges on Category Banners"}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-500 mb-1">{isBengali ? "bKash সেন্ড মানি পার্সোনাল নাম্বার" : "ADMIN BKASH PERSONAL NUMBER"}</label>
              <input
                type="text"
                value={bKashNumber}
                onChange={(e) => setBKashNumber(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">{isBengali ? "Nagad সেন্ড মানি পার্সোনাল নাম্বার" : "ADMIN NAGAD PERSONAL NUMBER"}</label>
              <input
                type="text"
                value={nagadNumber}
                onChange={(e) => setNagadNumber(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-emerald-400 font-bold mb-1">{isBengali ? "WhatsApp সাপোর্ট ফোন নম্বর" : "WHATSAPP SUPPORT PHONE NUMBER"}</label>
              <input
                type="text"
                value={whatsAppNumber}
                onChange={(e) => setWhatsAppNumber(e.target.value)}
                placeholder="+88017XXXXXXXX"
                className="w-full p-2 bg-zinc-950 border border-emerald-500/40 focus:border-emerald-500 rounded text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-pink-400 font-bold mb-1 text-xs uppercase">
                {isBengali ? "bKash টাকা পাঠানোর নিয়মাবলী (Instructions)" : "BKASH PAYMENT INSTRUCTIONS"}
              </label>
              <textarea
                value={bKashInstructions}
                onChange={(e) => setBKashInstructions(e.target.value)}
                placeholder={isBengali ? "যেমন:\n১. পার্সোনাল একাউন্ট থেকে সেন্ড মানি করুন।\n২. নিচে TxnID সাবমিট করুন।" : "e.g.:\n1. Send money from personal account.\n2. Enter TxnID below."}
                className="w-full p-2.5 bg-zinc-950 border border-pink-500/30 focus:border-pink-500 rounded text-white h-28 font-sans text-xs leading-relaxed"
                style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}
              />
            </div>
            <div>
              <label className="block text-orange-400 font-bold mb-1 text-xs uppercase">
                {isBengali ? "Nagad টাকা পাঠানোর নিয়মাবলী (Instructions)" : "NAGAD PAYMENT INSTRUCTIONS"}
              </label>
              <textarea
                value={nagadInstructions}
                onChange={(e) => setNagadInstructions(e.target.value)}
                placeholder={isBengali ? "যেমন:\n১. পার্সোনাল একাউন্ট থেকে সেন্ড মানি করুন।\n২. নিচে TxnID সাবমিট করুন।" : "e.g.:\n1. Send money from personal account.\n2. Enter TxnID below."}
                className="w-full p-2.5 bg-zinc-950 border border-orange-500/30 focus:border-orange-500 rounded text-white h-28 font-sans text-xs leading-relaxed"
                style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">{isBengali ? "গ্লোবাল টুর্নামেন্ট নিয়মাবলী" : "GLOBAL RULES & REGULATIONS"}</label>
            <textarea
              value={globalRules}
              onChange={(e) => setGlobalRules(e.target.value)}
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-white h-28 font-sans text-xs"
              style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}
            />
          </div>

          {settingsMessage && (
            <p className="p-2 bg-violet-950/20 border border-violet-800 text-violet-300 text-center rounded">
              {settingsMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded font-bold uppercase cursor-pointer"
          >
            {isBengali ? "সেটিংস সংরক্ষণ করুন" : "Save All Site Settings"}
          </button>
        </form>
      )}

      {/* ==================== SUBTAB: CATEGORY RULES & TIMELINE ==================== */}
      {activeSubTab === "rules" && (
        <form onSubmit={handleRulesSubmit} className="max-w-2xl bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white uppercase font-sans border-b border-zinc-800 pb-2 mb-2" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
              {isBengali ? "ক্যাটাগরি ভিত্তিক নিয়মাবলী ও সময়সূচী (টাইমলাইন) নিয়ন্ত্রণ" : "Category Rules & Timeline Schedule Management"}
            </h3>
            <p className="text-xs text-zinc-500 font-mono mb-4" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
              {isBengali ? "চ্যাম্পিয়ন রাশ, স্ক্রিম এবং পেইড ক্যাটাগরির জন্য কাস্টম নিয়ম এডিট করুন" : "Set specific rules for each of the game categories"}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {isBengali ? "১. ক্যাটাগরি নির্বাচন করুন" : "1. Select Category"}
              </label>
              <select
                value={selectedRulesCategory}
                onChange={(e) => setSelectedRulesCategory(e.target.value as any)}
                className="w-full p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="Champion Rush">Champion Rush</option>
                <option value="Scrims">Scrims</option>
                <option value="Paid Tournaments">Paid Tournaments</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {isBengali ? "২. নিয়মাবলী (Category Rules)" : "2. Category Rules"}
              </label>
              <textarea
                value={categoryRulesText}
                onChange={(e) => setCategoryRulesText(e.target.value)}
                placeholder={isBengali ? "এখানে নিয়মাবলী লিখুন..." : "Enter your custom rules guidelines here..."}
                rows={8}
                className="w-full p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-violet-500 leading-relaxed"
                style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}
                required
              />
            </div>

            {rulesMessage && (
              <div className="p-3 bg-violet-950/20 border border-violet-800/40 text-violet-300 rounded-lg text-xs font-mono text-center animate-pulse" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                {rulesMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 active:scale-98 text-white font-bold rounded-xl transition-all uppercase tracking-wider font-sans text-xs cursor-pointer shadow-lg shadow-violet-950/50"
              style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}
            >
              {isBengali ? "নিয়মাবলী সংরক্ষণ করুন" : "Save / Update Rules"}
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Modal Overlay */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-violet-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
              {confirmModal.title}
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={confirmModal.isProcessing}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl uppercase transition-all cursor-pointer"
              >
                {isBengali ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={confirmModal.isProcessing}
                onClick={async () => {
                  setConfirmModal(prev => prev ? { ...prev, isProcessing: true } : null);
                  try {
                    await confirmModal.action();
                  } catch (err: any) {
                    setFormMessage(err.message || "Operation failed.");
                  } finally {
                    setConfirmModal(null);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-white text-xs font-bold rounded-xl uppercase transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-950/50"
              >
                {confirmModal.isProcessing ? (
                  <span>{isBengali ? "প্রসেস হচ্ছে..." : "Processing..."}</span>
                ) : (
                  <span>{isBengali ? "হ্যাঁ, কনফার্ম করুন" : "Yes, Confirm"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
