import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk, UserButton } from "@clerk/clerk-react";
import { 
  initializeSiteSettings, 
  subscribeSiteSettings, 
  subscribeUserProfile, 
  subscribeTournaments, 
  subscribeTransactions,
  registerForTournament,
  checkOrCreateUserProfile,
  resetDailyMatches
} from "./services/firebaseService";
import { Tournament, Transaction, SiteSettings, UserProfile } from "./types";


// Components imports
import Loader from "./components/Loader";
import AnnouncementBar from "./components/AnnouncementBar";
import TournamentCard from "./components/TournamentCard";
import TournamentModal from "./components/TournamentModal";
import CashierView from "./components/CashierView";
import AdminPanel from "./components/AdminPanel";
import LoginView from "./components/LoginView";
import SupportButton from "./components/SupportButton";
import { convertToBengaliNumbers } from "./utils/dateFormatter";
import { sortTournamentsByPriority, ProcessedMatch } from "./utils/tournamentSorter";
import { CategoryRulesView } from "./components/GameSubViews";
import NextMatchHero from "./components/NextMatchHero";
import MultiTimeSlotBooking from "./components/MultiTimeSlotBooking";
import { fetchGoogleSheetSlotData } from "./services/googleSheetService";
import GamingProfileModal from "./components/GamingProfileModal";

type Tab = "Champion Rush" | "Scrims" | "Paid Tournaments" | "Cashier" | "Rules" | "Admin" | "Login";

export default function App() {
  const [isBengali, setIsBengali] = useState(true);
  const [isGamingProfileModalOpen, setIsGamingProfileModalOpen] = useState(false);
  
  // Clerk Auth Hook
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Site Loader Control State
  const [showLoader, setShowLoader] = useState(true);

  // Mobile Left Sidebar Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Firestore Subscriptions States
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  // App Layout Navigation State
  const [activeTab, setActiveTab] = useState<Tab>("Champion Rush");
  const [gamingSubTab, setGamingSubTab] = useState<"matches" | "multi_slots" | "rules">("matches");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [autoOpenDepositModal, setAutoOpenDepositModal] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  // Real-time tick every 1 second for live match transitions, countdown updates & 1:00 AM reset
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNowMs(now.getTime());

      // 1:00 AM Daily Automatic Reset System
      if (now.getHours() === 1 && now.getMinutes() === 0) {
        const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const lastReset = localStorage.getItem("brm_last_auto_reset_date");
        if (lastReset !== todayDateStr) {
          localStorage.setItem("brm_last_auto_reset_date", todayDateStr);
          resetDailyMatches().catch((err) => console.warn("Auto 1:00 AM reset failed:", err));
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenDepositModal = () => {
    setSelectedTournament(null);
    setActiveTab("Cashier");
    setAutoOpenDepositModal(true);
  };

  // Dual Scroll Architecture: Lock Body Scroll when Mobile Sidebar is Open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // Custom helper to change tab and reset gaming sub-tab
  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    setGamingSubTab("matches");
  };

  // 1. Initialize Site Settings (Read-Before-Write Safeguard) & Subscribe
  useEffect(() => {
    let settingsUnsubscribe: () => void;

    const init = async () => {
      try {
        const initialSettings = await initializeSiteSettings();
        setSiteSettings(initialSettings);
        
        // Subscribe to real-time siteSettings updates
        settingsUnsubscribe = subscribeSiteSettings((settings) => {
          setSiteSettings(settings);
        });
      } catch (err) {
        console.error("Failed to initialize site settings:", err);
      }
    };

    init();
    
    // Fetch real-time slot availability from Google Sheet WebApp on load
    fetchGoogleSheetSlotData().then((sheetData) => {
      if (sheetData && sheetData.bookedSlots !== undefined) {
        console.log(`Google Sheet synced booked slots count: ${sheetData.bookedSlots}`);
      }
    }).catch(err => console.warn("Google Sheet initial fetch warning:", err));

    // Initial site load loader timer
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1800);

    return () => {
      if (settingsUnsubscribe) settingsUnsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // 2. Clerk Auth State Sync with Firestore Profile & Hash Cleanup / Auto Redirect
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const primaryEmail = user.primaryEmailAddress?.emailAddress || "";
      const fullName = user.fullName || user.firstName || primaryEmail.split("@")[0] || "User";
      const uid = user.id;

      let profileUnsubscribe: (() => void) | undefined;

      checkOrCreateUserProfile(uid, primaryEmail, fullName, user.publicMetadata, user.unsafeMetadata).then((profile) => {
        setCurrentUserProfile(profile);

        // Auto prompt Gaming Profile modal if missing Team Name or IGN
        if (!profile.teamName || !profile.ignName) {
          setIsGamingProfileModalOpen(true);
        }

        profileUnsubscribe = subscribeUserProfile(uid, (p) => {
          setCurrentUserProfile(p);
        });

        // Clean up hash if coming from email verification or clerk auth callback
        if (window.location.hash.includes("verify") || window.location.hash.includes("sso-callback")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }

        // Smooth redirect from Login tab to main app once signed in
        if (activeTab === "Login") {
          if (primaryEmail === "buriramorganization@gmail.com" || profile.role === "admin") {
            setActiveTab("Admin");
          } else {
            setActiveTab("Champion Rush");
          }
        }
      });

      return () => {
        if (profileUnsubscribe) profileUnsubscribe();
      };
    } else {
      setCurrentUserProfile(null);
    }
  }, [isLoaded, user, activeTab]);


  // 3. Tournaments & Transactions Subscriptions
  useEffect(() => {
    // Tournaments listener
    const tournamentsUnsubscribe = subscribeTournaments((list) => {
      setTournaments(list);
    });

    // Transactions listener (Conditional based on user login and role)
    let transactionsUnsubscribe: (() => void) | undefined;
    
    if (currentUserProfile) {
      const isAdmin = currentUserProfile.role === "admin";
      transactionsUnsubscribe = subscribeTransactions(
        currentUserProfile.uid,
        isAdmin,
        (txnList) => {
          setTransactions(txnList);
        }
      );
    } else {
      setTransactions([]);
    }

    return () => {
      tournamentsUnsubscribe();
      if (transactionsUnsubscribe) transactionsUnsubscribe();
    };
  }, [currentUserProfile]);

  // Handle selected tournament updates
  useEffect(() => {
    if (selectedTournament) {
      const updated = tournaments.find((t) => t.id === selectedTournament.id);
      if (updated) {
        setSelectedTournament(updated);
      }
    }
  }, [tournaments]);

  // Auth Action Callback
  const handleAuthSuccess = async (uid: string, email: string, name: string) => {
    if (email === "buriramorganization@gmail.com") {
      setActiveTab("Admin");
    } else {
      setActiveTab("Champion Rush");
    }
  };

  // Header Logo click triggers Loader
  const handleBrandClick = () => {
    setShowLoader(true);
    setTimeout(() => {
      setShowLoader(false);
      if (currentUserProfile?.role === "admin") {
        setActiveTab("Admin");
      } else {
        setActiveTab("Champion Rush");
      }
    }, 1500);
  };

  // Trigger login page loader
  const handleLoginClick = () => {
    setShowLoader(true);
    setTimeout(() => {
      setShowLoader(false);
      setActiveTab("Login");
    }, 1500);
  };

  // Trigger logout loaders
  const handleLogout = async () => {
    setShowLoader(true);
    try {
      await signOut();
      setTimeout(() => {
        setShowLoader(false);
        setActiveTab("Champion Rush");
      }, 1500);
    } catch (err) {
      console.error("Logout failed:", err);
      setShowLoader(false);
    }
  };

  // Register slot in tournament callback
  const handleJoinTournament = async (teamName: string, ignName: string, slotCount: number = 1) => {
    if (!currentUserProfile || !selectedTournament) return;
    
    const res = await registerForTournament(
      selectedTournament.id,
      currentUserProfile.uid,
      currentUserProfile.email,
      teamName,
      ignName,
      slotCount
    );

    if (res.success) {
      alert(isBengali ? `সফলভাবে ${slotCount}টি স্লটে যোগ দিয়েছেন!` : `Successfully booked ${slotCount} slot(s)!`);
    } else {
      throw new Error(res.message);
    }
  };

  // Filter tournaments by active category tab
  const activeTournaments = tournaments.filter((t) => t.category === activeTab);

  // Get corresponding banner from Firestore
  const getActiveBanner = () => {
    if (!siteSettings) return "";
    switch (activeTab) {
      case "Champion Rush":
        return siteSettings.championRushBanner;
      case "Scrims":
        return siteSettings.scrimsBanner;
      case "Paid Tournaments":
        return siteSettings.paidBanner;
      default:
        return "";
    }
  };

  const activeCategoryBanner = getActiveBanner();
  const supportPhone = siteSettings?.whatsAppNumber || siteSettings?.bKashNumber || "+8801700000000";

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-game-dark flex flex-col text-zinc-100 select-none antialiased selection:bg-violet-600 selection:text-white">
      
      {/* 1. Strict Brand loading screen */}
      <Loader logoUrl={siteSettings?.logoUrl} isVisible={showLoader} />

      {/* 2. Global Ticker Announcement Bar at top of header */}
      <AnnouncementBar 
        tournaments={tournaments} 
        customOverride={siteSettings?.customAnnouncement} 
        isBengali={isBengali} 
      />

      {/* 3. Header section */}
      <header className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-2.5 sm:px-6 z-30 sticky top-0 w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Mobile Hamburger / Close Left Sidebar Toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="sm:hidden p-1.5 sm:p-2 text-zinc-300 hover:text-white bg-white/5 border border-white/10 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center shrink-0"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {isMobileSidebarOpen ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Brand Logo & Name */}
          <div 
            onClick={handleBrandClick}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-90 active:scale-95 transition-all group shrink-0"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:scale-105 group-active:scale-95 transition-all overflow-hidden shrink-0">
              {siteSettings?.logoUrl ? (
                <img 
                  src={siteSettings.logoUrl} 
                  alt="BURIRAM ORG" 
                  className="h-7 w-7 sm:h-8 sm:w-8 object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xs sm:text-base font-black tracking-tighter text-white uppercase group-hover:text-violet-400 transition-colors truncate">
                BURIRAM <span className="text-violet-500">ORG</span>
              </h1>
              <span className="font-mono text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase tracking-widest -mt-0.5 hidden xs:inline block truncate">
                Buriram Official
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Terminal Controls */}
        <div className="flex items-center gap-1 sm:gap-3.5 shrink-0">
          
          {/* Language Switcher (Desktop Only - Hidden on Mobile) */}
          <div className="hidden sm:flex bg-white/5 border border-white/10 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setIsBengali(true)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                isBengali 
                  ? "bg-violet-600 text-white shadow-md shadow-violet-950/40" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              BN
            </button>
            <button
              onClick={() => setIsBengali(false)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                !isBengali 
                  ? "bg-violet-600 text-white shadow-md shadow-violet-950/40" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          {/* Logged in User state with Balance */}
          {currentUserProfile ? (
            <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 p-1 sm:p-1.5 pr-2 sm:pr-3 pl-1.5 sm:pl-3 rounded-full text-xs font-mono shrink-0">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{currentUserProfile.name}</span>
                {currentUserProfile.role === "admin" && (
                  <span 
                    onClick={() => changeTab("Admin")}
                    className="text-[8px] font-bold text-fuchsia-400 uppercase tracking-widest leading-none cursor-pointer hover:underline hover:text-fuchsia-300 transition-all"
                    title="Open Admin Dashboard"
                  >
                    Admin
                  </span>
                )}
              </div>
              <div className="h-7 w-px bg-white/10 hidden sm:block"></div>
              {/* Gaming Profile Button */}
              <button
                onClick={() => setIsGamingProfileModalOpen(true)}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-lg transition-all text-[9px] sm:text-[10px] font-sans font-bold cursor-pointer shrink-0"
                title="Gaming Profile (Team & IGN)"
              >
                <span>🎮</span>
                <span className="hidden md:inline">
                  {currentUserProfile.teamName ? currentUserProfile.teamName : (isBengali ? "প্রোফাইল সেট" : "Set IGN")}
                </span>
              </button>
              <div className="h-5 sm:h-7 w-px bg-white/10"></div>
              <div className="flex flex-col justify-center">
                <span className="text-[7px] sm:text-[8px] text-zinc-400 uppercase tracking-widest leading-none mb-0.5">
                  {isBengali ? "ব্যালেন্স" : "Wallet"}
                </span>
                <span className="font-bold text-emerald-400 font-sans leading-none text-[10px] sm:text-xs">
                  ৳ {isBengali ? convertToBengaliNumbers(currentUserProfile.balance) : currentUserProfile.balance}
                </span>
              </div>
              <div className="h-5 sm:h-7 w-px bg-white/10"></div>
              <button 
                onClick={handleLogout}
                className="text-rose-400 hover:text-rose-300 font-bold ml-0.5 cursor-pointer uppercase text-[9px] sm:text-[10px] shrink-0"
              >
                {isBengali ? "লগআউট" : "Logout"}
              </button>
            </div>
          ) : (
            /* Guest Login Button */
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleLoginClick}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-95 text-white font-mono text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md uppercase shrink-0"
              >
                {isBengali ? "লগইন" : "Login"}
              </button>
              <button
                onClick={handleLoginClick}
                className="hidden sm:inline-block px-3.5 py-2 text-zinc-400 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer uppercase border border-white/5 hover:border-white/20 rounded-lg bg-white/5 shrink-0"
              >
                {isBengali ? "ফ্রি সাইন আপ" : "Sign Up Free"}
              </button>
            </div>
          )}

        </div>
      </header>

      {/* 4. Mobile Slide-Out Left Sidebar (Independent Drawer Scroll) */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 sm:hidden transition-opacity duration-300"
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#080808] border-r border-white/10 flex flex-col justify-between py-6 px-4 transform transition-transform duration-300 ease-in-out sm:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto custom-scrollbar`}
      >
        <div className="space-y-6">
          {/* Mobile Sidebar Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center overflow-hidden">
                {siteSettings?.logoUrl ? (
                  <img 
                    src={siteSettings.logoUrl} 
                    alt="BURIRAM ORG" 
                    className="h-6 w-6 object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wider text-white uppercase">
                  BURIRAM <span className="text-violet-500">ORG</span>
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  {isBengali ? "নেভিগেশন মেনু" : "NAVIGATION MENU"}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Close Mobile Navigation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Tabs - Comfortaa (EN) / Hind Siliguri (BN) without icons/emojis */}
          <nav className="space-y-2 font-sans font-bold" lang={isBengali ? "bn" : "en"}>
            <button
              onClick={() => {
                changeTab("Champion Rush");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3.5 rounded-xl transition-all cursor-pointer border-l-2 text-xs uppercase tracking-wider ${
                activeTab === "Champion Rush"
                  ? "bg-violet-600/20 text-violet-400 border-l-violet-600 font-black shadow-lg shadow-violet-950/20"
                  : "text-zinc-300 hover:bg-white/5 border-l-transparent hover:text-white"
              }`}
              style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
            >
              {isBengali ? "চ্যাম্পিয়ন রাশ" : "Champion Rush"}
            </button>

            <button
              onClick={() => {
                changeTab("Scrims");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3.5 rounded-xl transition-all cursor-pointer border-l-2 text-xs uppercase tracking-wider ${
                activeTab === "Scrims"
                  ? "bg-violet-600/20 text-violet-400 border-l-violet-600 font-black shadow-lg shadow-violet-950/20"
                  : "text-zinc-300 hover:bg-white/5 border-l-transparent hover:text-white"
              }`}
              style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
            >
              {isBengali ? "স্ক্রিমস" : "Scrims"}
            </button>

            <button
              onClick={() => {
                changeTab("Paid Tournaments");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3.5 rounded-xl transition-all cursor-pointer border-l-2 text-xs uppercase tracking-wider ${
                activeTab === "Paid Tournaments"
                  ? "bg-violet-600/20 text-violet-400 border-l-violet-600 font-black shadow-lg shadow-violet-950/20"
                  : "text-zinc-300 hover:bg-white/5 border-l-transparent hover:text-white"
              }`}
              style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
            >
              {isBengali ? "পেইড টুর্নামেন্ট" : "Paid Tournaments"}
            </button>

            <div className="h-px bg-white/10 my-3"></div>

            <button
              onClick={() => {
                if (!currentUserProfile) {
                  changeTab("Login");
                } else {
                  changeTab("Cashier");
                }
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3.5 rounded-xl transition-all cursor-pointer border-l-2 text-xs uppercase tracking-wider ${
                activeTab === "Cashier"
                  ? "bg-violet-600/20 text-violet-400 border-l-violet-600 font-black shadow-lg shadow-violet-950/20"
                  : "text-zinc-300 hover:bg-white/5 border-l-transparent hover:text-white"
              }`}
              style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
            >
              {isBengali ? "ক্যাশিয়ার" : "Cashier"}
            </button>

            <button
              onClick={() => {
                changeTab("Rules");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3.5 rounded-xl transition-all cursor-pointer border-l-2 text-xs uppercase tracking-wider ${
                activeTab === "Rules"
                  ? "bg-violet-600/20 text-violet-400 border-l-violet-600 font-black shadow-lg shadow-violet-950/20"
                  : "text-zinc-300 hover:bg-white/5 border-l-transparent hover:text-white"
              }`}
              style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
            >
              {isBengali ? "নিয়মাবলী" : "Rules & Info"}
            </button>

            {currentUserProfile?.role === "admin" && (
              <button
                onClick={() => {
                  changeTab("Admin");
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl transition-all cursor-pointer border-l-2 text-xs uppercase tracking-wider ${
                  activeTab === "Admin"
                    ? "bg-fuchsia-600/20 text-fuchsia-400 border-l-fuchsia-600 font-black shadow-lg shadow-fuchsia-950/20"
                    : "text-zinc-400 hover:bg-white/5 border-l-transparent hover:text-fuchsia-300"
                }`}
                style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
              >
                {isBengali ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
              </button>
            )}
          </nav>
        </div>

        {/* Support Helpline & Language Switcher in mobile sidebar footer */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="bg-violet-950/30 border border-violet-500/20 rounded-xl p-3">
            <p className="text-[10px] text-violet-300 font-bold uppercase mb-1" style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}>
              {isBengali ? "সহায়তা কেন্দ্র" : "Support Helpline"}
            </p>
            <a 
              href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all uppercase cursor-pointer"
            >
              WhatsApp Support
            </a>
          </div>

          {/* Mobile Navigation Footer Language Switcher */}
          <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 flex flex-col gap-2">
            <span 
              className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider text-center"
              style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
            >
              {isBengali ? "ভাষা নির্বাচন করুন" : "SELECT LANGUAGE"}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsBengali(true)}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 border active:scale-95 ${
                  isBengali 
                    ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-950/50" 
                    : "bg-black/40 text-zinc-400 border-white/5 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>🇧🇩</span>
                <span>বাংলা</span>
              </button>
              <button
                onClick={() => setIsBengali(false)}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 border active:scale-95 ${
                  !isBengali 
                    ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-950/50" 
                    : "bg-black/40 text-zinc-400 border-white/5 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 5. Main Platform Dual-Scroll Container Layout */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-theme(spacing.24))] md:h-[calc(100vh-theme(spacing.20))]">
        
        {/* Desktop Left Sidebar Menu (Independent Scroll) */}
        <aside className="hidden sm:flex sm:w-64 bg-[#080808] border-r border-white/5 flex-col justify-between py-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            
            {/* Sidebar Title for Desktop */}
            <div className="px-4">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
                {isBengali ? "টুর্নামেন্ট ক্যাটাগরি" : "MATCH CENTER"}
              </span>
            </div>

            {/* Sidebar Tabs list */}
            <nav className="space-y-1 px-2 font-sans font-bold">
              {/* Tab 1: Champion Rush */}
              <button
                onClick={() => changeTab("Champion Rush")}
                className={`w-full flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer border-l-2 ${
                  activeTab === "Champion Rush" 
                    ? "bg-violet-600/10 text-violet-400 border-l-violet-600 border-t-transparent border-r-transparent border-b-transparent font-extrabold shadow-lg shadow-violet-950/10" 
                    : "text-zinc-400 hover:bg-white/5 border-l-transparent border-t-transparent border-r-transparent border-b-transparent hover:text-zinc-200 hover:border-l-violet-500/30"
                }`}
                style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
              >
                <span className="text-xs uppercase tracking-wider font-bold">
                  {isBengali ? "চ্যাম্পিয়ন রাশ" : "Champion Rush"}
                </span>
              </button>

              {/* Tab 2: Scrims */}
              <button
                onClick={() => changeTab("Scrims")}
                className={`w-full flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer border-l-2 ${
                  activeTab === "Scrims" 
                    ? "bg-violet-600/10 text-violet-400 border-l-violet-600 border-t-transparent border-r-transparent border-b-transparent font-extrabold shadow-lg shadow-violet-950/10" 
                    : "text-zinc-400 hover:bg-white/5 border-l-transparent border-t-transparent border-r-transparent border-b-transparent hover:text-zinc-200 hover:border-l-violet-500/30"
                }`}
                style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
              >
                <span className="text-xs uppercase tracking-wider font-bold">
                  {isBengali ? "স্ক্রিমস" : "Scrims"}
                </span>
              </button>

              {/* Tab 3: Paid Tournaments */}
              <button
                onClick={() => changeTab("Paid Tournaments")}
                className={`w-full flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer border-l-2 ${
                  activeTab === "Paid Tournaments" 
                    ? "bg-violet-600/10 text-violet-400 border-l-violet-600 border-t-transparent border-r-transparent border-b-transparent font-extrabold shadow-lg shadow-violet-950/10" 
                    : "text-zinc-400 hover:bg-white/5 border-l-transparent border-t-transparent border-r-transparent border-b-transparent hover:text-zinc-200 hover:border-l-violet-500/30"
                }`}
                style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
              >
                <span className="text-xs uppercase tracking-wider font-bold">
                  {isBengali ? "পেইড টুর্নামেন্ট" : "Paid Tournaments"}
                </span>
              </button>

              <div className="h-px bg-white/5 my-4 mx-2"></div>

              {/* Tab 4: Cashier */}
              <button
                onClick={() => {
                  if (!currentUserProfile) {
                    changeTab("Login");
                  } else {
                    changeTab("Cashier");
                  }
                }}
                className={`w-full flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer border-l-2 ${
                  activeTab === "Cashier" 
                    ? "bg-violet-600/10 text-violet-400 border-l-violet-600 border-t-transparent border-r-transparent border-b-transparent font-extrabold shadow-lg shadow-violet-950/10" 
                    : "text-zinc-400 hover:bg-white/5 border-l-transparent border-t-transparent border-r-transparent border-b-transparent hover:text-zinc-200 hover:border-l-violet-500/30"
                }`}
                style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
              >
                <span className="text-xs uppercase tracking-wider font-bold">
                  {isBengali ? "ক্যাশিয়ার" : "Cashier"}
                </span>
              </button>

              {/* Tab 5: Rules */}
              <button
                onClick={() => changeTab("Rules")}
                className={`w-full flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer border-l-2 ${
                  activeTab === "Rules" 
                    ? "bg-violet-600/10 text-violet-400 border-l-violet-600 border-t-transparent border-r-transparent border-b-transparent font-extrabold shadow-lg shadow-violet-950/10" 
                    : "text-zinc-400 hover:bg-white/5 border-l-transparent border-t-transparent border-r-transparent border-b-transparent hover:text-zinc-200 hover:border-l-violet-500/30"
                }`}
                style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
              >
                <span className="text-xs uppercase tracking-wider font-bold">
                  {isBengali ? "নিয়মাবলী" : "Rules & Info"}
                </span>
              </button>

              {/* Tab 6: Admin Panel (Dynamic role-based visibility) */}
              {currentUserProfile?.role === "admin" && (
                <button
                  onClick={() => changeTab("Admin")}
                  className={`w-full flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer border-l-2 ${
                    activeTab === "Admin" 
                      ? "bg-fuchsia-600/10 text-fuchsia-400 border-l-fuchsia-600 border-t-transparent border-r-transparent border-b-transparent font-extrabold shadow-lg shadow-fuchsia-950/10" 
                      : "text-zinc-500 hover:bg-white/5 border-l-transparent border-t-transparent border-r-transparent border-b-transparent hover:text-fuchsia-300 hover:border-l-fuchsia-500/30"
                  }`}
                  style={{ fontFamily: isBengali ? "'Hind Siliguri', sans-serif" : "'Comfortaa', sans-serif" }}
                >
                  <span className="text-xs uppercase tracking-wider font-bold">
                    {isBengali ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
                  </span>
                </button>
              )}
            </nav>
          </div>

          {/* Support Box inside Sidebar bottom */}
          <div className="hidden sm:block p-4 mx-2 bg-violet-600/10 border border-violet-500/20 rounded-2xl mb-4">
            <p className="text-[10px] text-violet-300 font-bold uppercase mb-1">
              {isBengali ? "সহায়তা প্রয়োজন?" : "Need Help?"}
            </p>
            <p className="text-[11px] text-zinc-400 leading-tight mb-3">
              {isBengali ? "টাকা জমা বা উত্তোলনে সমস্যায় ২৪/৭ লাইভ সাপোর্ট পান।" : "Live support available 24/7 for deposit & withdrawal issues."}
            </p>
            <a 
              href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.413-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.654zm6.749-3.98l.341.202c1.379.818 2.983 1.25 4.633 1.251 5.177 0 9.389-4.212 9.392-9.391.001-2.508-.976-4.865-2.753-6.642s-4.135-2.752-6.644-2.752c-5.178 0-9.389 4.212-9.392 9.391 0 1.62.424 3.199 1.231 4.591l.221.377-1.002 3.66 3.753-.984z"/>
              </svg>
              WhatsApp Live
            </a>
          </div>

          {/* Quick legal credits inside sidebar bottom */}
          <div className="px-4 hidden sm:block text-[9px] font-mono text-zinc-600 leading-relaxed uppercase">
            © 2026 Buriram Org<br />
            Powered by Buriram Organization
          </div>
        </aside>

        {/* Right Viewport (Independent Scroll) */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-game-dark p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* RENDER TOURNAMENTS CATEGORIES (CHAMPION RUSH / SCRIMS / PAID TOURNAMENTS) */}
            {(activeTab === "Champion Rush" || activeTab === "Scrims" || activeTab === "Paid Tournaments") && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Category Uploaded Cloudinary Banner Header */}
                <div className="relative h-48 md:h-60 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-end bg-gradient-to-r from-violet-950/80 via-zinc-900 to-black">
                  {activeCategoryBanner ? (
                    <img
                      src={activeCategoryBanner}
                      alt={activeTab}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                        siteSettings?.enableBannerTextOverlay ? "opacity-70" : "opacity-100"
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  
                  {siteSettings?.enableBannerTextOverlay && (
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10"></div>
                  )}
                  
                  {/* Banner text overlay - Only shown when enableBannerTextOverlay is ON */}
                  {siteSettings?.enableBannerTextOverlay && (() => {
                    const currentCategoryOverlay = activeTab === "Champion Rush"
                      ? siteSettings.championRushOverlay
                      : activeTab === "Scrims"
                      ? siteSettings.scrimsOverlay
                      : siteSettings.paidOverlay;

                    const currentBadge1 = currentCategoryOverlay?.badge1Text || (
                      activeTab === "Champion Rush" ? (isBengali ? "ফাস্ট পেইস ম্যাচ" : "FAST MATCH") :
                      activeTab === "Scrims" ? (isBengali ? "অফিসিয়াল টুর্নামেন্ট" : "BURIRAM VERIFIED") :
                      (isBengali ? "প্রাইজপুল টুর্নামেন্ট" : "PRIZE POOL")
                    );

                    const currentBadge2 = currentCategoryOverlay?.badge2Text || (isBengali ? "ফ্রি ফায়ার" : "Free Fire");

                    const currentTitle = currentCategoryOverlay?.title || (
                      activeTab === "Champion Rush" ? (isBengali ? "চ্যাম্পিয়ন রাশ" : "CHAMPION RUSH") :
                      activeTab === "Scrims" ? (isBengali ? "স্ক্রিমস টুর্নামেন্ট" : "CYBER SCRIMS") :
                      (isBengali ? "পেইড টুর্নামেন্ট" : "PAID ESPORTS")
                    );

                    const currentSubtitle = currentCategoryOverlay?.subtitle || (
                      activeTab === "Champion Rush" 
                        ? (isBengali ? "তাত্ক্ষণিক বুকিং এবং সরাসরি ফাস্ট-পেস ম্যাচ খেলা।" : "Instant squad booking & action-packed rush lobbies.") 
                        : activeTab === "Scrims" 
                        ? (isBengali ? "আপনার গিল্ডের যোগ্যতা প্রমাণ করার গ্লোবাল প্ল্যাটফর্ম।" : "Elite tier guild matchmaking & status scoring lobby.") 
                        : (isBengali ? "বড় পুরস্কার জিতার সুবর্ণ সুযোগ, যোগ দিন আজই!" : "High stakes prize pool tournaments. Book your slot now!")
                    );

                    const currentButtonText = currentCategoryOverlay?.buttonText || (isBengali ? "বুক স্লট" : "Book Slot");

                    return (
                      <div className="relative p-6 md:p-8 z-20 w-full animate-fade-in">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="bg-violet-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            {currentBadge1}
                          </span>
                          <span className="bg-black/50 backdrop-blur text-[9px] font-bold rounded uppercase tracking-wider border border-white/10 px-2 py-0.5 text-zinc-300">
                            {currentBadge2}
                          </span>
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black text-white font-sans uppercase tracking-tight italic">
                          {currentTitle}
                        </h1>
                        <p className="text-xs text-violet-400 font-mono mt-1 uppercase max-w-xl tracking-widest font-bold">
                          {currentSubtitle}
                        </p>

                        {currentButtonText && (
                          <div className="mt-3">
                            <button
                              onClick={() => setGamingSubTab("multi_slots")}
                              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold uppercase rounded-lg transition-all shadow-lg shadow-violet-950/50 cursor-pointer border border-violet-400/30"
                            >
                              {currentButtonText}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Sub-navigation tabs for Scrims/Tournaments */}
                <div className="flex bg-zinc-950/60 backdrop-blur border border-white/10 rounded-xl p-1 gap-1 w-full max-w-2xl font-sans overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setGamingSubTab("matches")}
                    className={`flex-1 min-w-[100px] px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer text-center relative shrink-0 ${
                      gamingSubTab === "matches"
                        ? "bg-violet-600/20 text-violet-300 font-extrabold border-b-2 border-violet-500 shadow-md"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent"
                    }`}
                  >
                    {isBengali ? "ম্যাচসমূহ" : "Match List"}
                  </button>
                  <button
                    onClick={() => setGamingSubTab("multi_slots")}
                    className={`flex-1 min-w-[120px] px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer text-center relative shrink-0 ${
                      gamingSubTab === "multi_slots"
                        ? "bg-violet-600/20 text-violet-300 font-extrabold border-b-2 border-violet-500 shadow-md"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent"
                    }`}
                  >
                    {isBengali ? "মাল্টি স্লট" : "Multiple Slots"}
                  </button>
                  <button
                    onClick={() => setGamingSubTab("rules")}
                    className={`flex-1 min-w-[100px] px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer text-center relative shrink-0 ${
                      gamingSubTab === "rules"
                        ? "bg-violet-600/20 text-violet-300 font-extrabold border-b-2 border-violet-500 shadow-md"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent"
                    }`}
                  >
                    {isBengali ? "ক্যাটাগরি রুলস" : "Category Rules"}
                  </button>
                </div>

                {/* Sub-view Content Switcher with Motion Transition */}
                <div className="pt-2 min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {gamingSubTab === "matches" && (
                      <motion.div
                        key="subtab-matches"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-8"
                      >
                        {(() => {
                          const activeCategoryTournaments = activeTournaments.filter(
                            t => t.category === activeTab && t.status !== "Completed"
                          );
                          const processedCategoryMatches = sortTournamentsByPriority(activeCategoryTournaments, nowMs);
                          const heroMatch = processedCategoryMatches.length > 0 ? processedCategoryMatches[0] : null;
                          const gridMatches = processedCategoryMatches.filter(
                            p => p.tournament.id !== heroMatch?.tournament.id
                          );

                          return (
                            <>
                              {/* Premium "Next Match" Hero Update Banner */}
                              {heroMatch && (
                                <NextMatchHero 
                                  tournament={heroMatch.tournament}
                                  processedMatch={heroMatch} 
                                  isBengali={isBengali} 
                                  onSelect={(t) => setSelectedTournament(t)}
                                  currentUser={currentUserProfile}
                                  onOpenDeposit={handleOpenDepositModal}
                                  supportWhatsAppNumber={supportPhone}
                                />
                              )}

                              <div>
                                <h2 className="text-lg font-bold text-white uppercase font-sans border-b border-zinc-900 pb-3 mb-6 flex items-center justify-between">
                                  <span>
                                    {heroMatch 
                                      ? (isBengali ? "অন্যান্য সকল ম্যাচসমূহ" : "OTHER ACTIVE & UPCOMING MATCHES")
                                      : (isBengali ? "সকল সচল ম্যাচসমূহ" : "ACTIVE & UPCOMING MATCHES")}
                                  </span>
                                  <span className="text-xs font-mono font-normal text-zinc-500">
                                    {isBengali ? "সর্বমোট:" : "Total Matches:"} {isBengali ? convertToBengaliNumbers(gridMatches.length) : gridMatches.length}
                                  </span>
                                </h2>

                                {gridMatches.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {gridMatches.map((pm) => (
                                      <TournamentCard
                                        key={pm.tournament.id}
                                        tournament={pm.tournament}
                                        processedMatch={pm}
                                        categoryBanner={activeCategoryBanner}
                                        isBengali={isBengali}
                                        onSelect={(t) => setSelectedTournament(t)}
                                      />
                                    ))}
                                  </div>
                                ) : !heroMatch ? (
                                  <div className="text-center p-16 bg-zinc-900/20 border border-zinc-800/40 rounded-2xl">
                                    <svg className="w-12 h-12 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                    <h4 className="text-zinc-400 font-bold font-sans">
                                      {isBengali ? "কোনো ম্যাচ পাওয়া যায়নি" : "No Matches Currently Active"}
                                    </h4>
                                    <p className="text-xs text-zinc-500 mt-1 font-mono">
                                      {isBengali ? "খুব শীঘ্রই নতুন ম্যাচ যোগ করা হবে, সাথেই থাকুন।" : "Stay tuned. New matchmaking matches will spawn soon!"}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    )}

                    {gamingSubTab === "multi_slots" && (
                      <motion.div
                        key="subtab-multi-slots"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <MultiTimeSlotBooking
                          tournaments={tournaments}
                          currentUser={currentUserProfile}
                          isBengali={isBengali}
                          onRefreshData={async () => {}}
                        />
                      </motion.div>
                    )}

                    {gamingSubTab === "rules" && (
                      <motion.div
                        key="subtab-rules"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <CategoryRulesView isBengali={isBengali} category={activeTab as any} siteSettings={siteSettings} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            )}

            {/* RENDER CASHIER VIEW */}
            {activeTab === "Cashier" && currentUserProfile && (
              <CashierView
                currentUser={currentUserProfile}
                transactions={transactions}
                siteSettings={siteSettings!}
                isBengali={isBengali}
                autoOpenDepositModal={autoOpenDepositModal}
              />
            )}

            {/* RENDER GLOBAL RULES VIEW */}
            {activeTab === "Rules" && siteSettings && (
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 md:p-8 space-y-6 animate-fade-in bengali-rules-container" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                <h2 className="text-2xl font-black text-white font-sans uppercase tracking-tight border-b border-zinc-800 pb-3" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                  {isBengali ? "টুর্নামেন্ট ও প্ল্যাটফর্ম নিয়মাবলী" : "BURIRAM ORG TOURNAMENT RULES & REGULATIONS"}
                </h2>
                <div className="prose prose-invert max-w-none text-zinc-300 font-sans text-sm whitespace-pre-line leading-relaxed space-y-4 bg-zinc-950/20 p-5 rounded-xl border border-zinc-850 bengali-rules-container" style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}>
                  {siteSettings.globalRules}
                </div>
              </div>
            )}

            {/* RENDER ADMIN MASTER CONTROL PANEL */}
            {activeTab === "Admin" && currentUserProfile?.role === "admin" && (
              <AdminPanel
                tournaments={tournaments}
                transactions={transactions}
                siteSettings={siteSettings!}
                isBengali={isBengali}
              />
            )}

            {/* RENDER LOGIN / REGISTER CONTROLLER */}
            {activeTab === "Login" && (
              <div className="py-12 flex items-center justify-center">
                <LoginView
                  isBengali={isBengali}
                  onSuccess={handleAuthSuccess}
                />
              </div>
            )}

          </div>
        </main>

      </div>

      {/* 5. Detailed Tournament Checkout Modal */}
      {selectedTournament && siteSettings && (
        <TournamentModal
          tournament={selectedTournament}
          globalRules={siteSettings.globalRules}
          currentUser={currentUserProfile}
          isBengali={isBengali}
          onClose={() => setSelectedTournament(null)}
          onJoin={handleJoinTournament}
          supportWhatsAppNumber={supportPhone}
          onOpenDeposit={handleOpenDepositModal}
        />
      )}

      {/* 6. Gaming Profile Modal */}
      {currentUserProfile && (
        <GamingProfileModal
          currentUser={currentUserProfile}
          isBengali={isBengali}
          isOpen={isGamingProfileModalOpen}
          onClose={() => setIsGamingProfileModalOpen(false)}
        />
      )}

      {/* 7. Global Floating WhatsApp Support Button */}
      <SupportButton whatsAppNumber={supportPhone} isBengali={isBengali} />

    </div>
  );
}
