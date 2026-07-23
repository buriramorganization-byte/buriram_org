import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  runTransaction,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { SiteSettings, Tournament, Transaction, UserProfile, PlayerSlot } from "../types";
import { syncSlotBookingToGoogleSheet } from "./googleSheetService";

const SETTINGS_DOC_ID = "global";

// Safe read-before-write siteSettings
export async function initializeSiteSettings(): Promise<SiteSettings> {
  const defaultSettings: SiteSettings = {
    logoUrl: "",
    championRushBanner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
    scrimsBanner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200",
    paidBanner: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=1200",
    globalRules: "1. No hacks or third-party tools allowed. If caught, immediate ban.\n2. Emulator players are strictly forbidden unless specified.\n3. Team coordination must be done inside the provided game room.\n4. Decisions by Buriram Org admins are final.\n5. Match timing is strict. Rooms will be created 15 minutes prior to start.",
    championRushRules: "1. Respect all players and avoid toxic language.\n2. Matches are played on designated custom maps.\n3. Verify your results with screenshots in case of disputes.",
    scrimsRules: "1. No stream sniping or map sharing.\n2. Emulator users must play in designated emulator slots.\n3. Team names must match registered squad names exactly.",
    paidTournamentRules: "1. Entry fees are non-refundable after slot allocation.\n2. Room IDs are shared 15 minutes prior to the start time.\n3. Prize money is distributed within 24 hours of verification.",
    enableBannerTextOverlay: false,
    championRushOverlay: {
      badge1Text: "ফাস্ট পেইস ম্যাচ",
      badge2Text: "ফ্রি ফায়ার",
      title: "চ্যাম্পিয়ন রাশ",
      subtitle: "তাত্ক্ষণিক বুকিং এবং সরাসরি ফাস্ট-পেস ম্যাচ খেলা।",
      buttonText: "বুক স্লট"
    },
    scrimsOverlay: {
      badge1Text: "অফিসিয়াল টুর্নামেন্ট",
      badge2Text: "ফ্রি ফায়ার",
      title: "স্ক্রিমস টুর্নামেন্ট",
      subtitle: "আপনার গিল্ডের যোগ্যতা প্রমাণ করার গ্লোবাল প্ল্যাটফর্ম।",
      buttonText: "বুক স্লট"
    },
    paidOverlay: {
      badge1Text: "প্রাইজপুল টুর্নামেন্ট",
      badge2Text: "ফ্রি ফায়ার",
      title: "পেইড টুর্নামেন্ট",
      subtitle: "বড় পুরস্কার জিতার সুবর্ণ সুযোগ, যোগ দিন আজই!",
      buttonText: "বুক স্লট"
    },
    bannerBadge1Text: "অফিসিয়াল টুর্নামেন্ট",
    bannerBadge2Text: "ফ্রি ফায়ার",
    bannerOverlayTitle: "স্ক্রিমস টুর্নামেন্ট",
    bannerOverlaySubtitle: "আপনার গিল্ডের যোগ্যতা প্রমাণ করার গ্লোবাল প্ল্যাটফর্ম।",
    bannerOverlayButtonText: "বুক স্লট",
    bKashNumber: "+8801700000000",
    nagadNumber: "+8801800000000",
    bKashInstructions: "",
    nagadInstructions: "",
    customAnnouncement: ""
  };

  try {
    const settingsRef = doc(db, "siteSettings", SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      try {
        await setDoc(settingsRef, defaultSettings);
      } catch (writeErr) {
        console.warn("Could not write default site settings to Firestore (insufficient permissions). Using in-memory defaults.", writeErr);
      }
      return defaultSettings;
    } else {
      // Merge existing with defaults in case of missing fields
      const existing = settingsSnap.data() as Partial<SiteSettings>;
      const merged: SiteSettings = {
        logoUrl: existing.logoUrl ?? defaultSettings.logoUrl,
        championRushBanner: existing.championRushBanner ?? defaultSettings.championRushBanner,
        scrimsBanner: existing.scrimsBanner ?? defaultSettings.scrimsBanner,
        paidBanner: existing.paidBanner ?? defaultSettings.paidBanner,
        globalRules: existing.globalRules ?? defaultSettings.globalRules,
        championRushRules: existing.championRushRules ?? defaultSettings.championRushRules,
        scrimsRules: existing.scrimsRules ?? defaultSettings.scrimsRules,
        paidTournamentRules: existing.paidTournamentRules ?? defaultSettings.paidTournamentRules,
        enableBannerTextOverlay: existing.enableBannerTextOverlay ?? defaultSettings.enableBannerTextOverlay,
        championRushOverlay: existing.championRushOverlay ?? defaultSettings.championRushOverlay,
        scrimsOverlay: existing.scrimsOverlay ?? defaultSettings.scrimsOverlay,
        paidOverlay: existing.paidOverlay ?? defaultSettings.paidOverlay,
        bannerBadge1Text: existing.bannerBadge1Text ?? defaultSettings.bannerBadge1Text,
        bannerBadge2Text: existing.bannerBadge2Text ?? defaultSettings.bannerBadge2Text,
        bannerOverlayTitle: existing.bannerOverlayTitle ?? defaultSettings.bannerOverlayTitle,
        bannerOverlaySubtitle: existing.bannerOverlaySubtitle ?? defaultSettings.bannerOverlaySubtitle,
        bannerOverlayButtonText: existing.bannerOverlayButtonText ?? defaultSettings.bannerOverlayButtonText,
        bKashNumber: existing.bKashNumber ?? defaultSettings.bKashNumber,
        nagadNumber: existing.nagadNumber ?? defaultSettings.nagadNumber,
        bKashInstructions: existing.bKashInstructions ?? defaultSettings.bKashInstructions,
        nagadInstructions: existing.nagadInstructions ?? defaultSettings.nagadInstructions,
        whatsAppNumber: existing.whatsAppNumber ?? defaultSettings.whatsAppNumber,
        customAnnouncement: existing.customAnnouncement ?? defaultSettings.customAnnouncement
      };
      return merged;
    }
  } catch (err) {
    console.warn("Error reading site settings from Firestore, falling back to in-memory defaults:", err);
    return defaultSettings;
  }
}

// Subscribe to site settings
export function subscribeSiteSettings(onUpdate: (settings: SiteSettings) => void) {
  const defaultSettings: SiteSettings = {
    logoUrl: "",
    championRushBanner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
    scrimsBanner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200",
    paidBanner: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=1200",
    globalRules: "1. No hacks or third-party tools allowed. If caught, immediate ban.\n2. Emulator players are strictly forbidden unless specified.\n3. Team coordination must be done inside the provided game room.\n4. Decisions by Buriram Org admins are final.\n5. Match timing is strict. Rooms will be created 15 minutes prior to start.",
    championRushRules: "1. Respect all players and avoid toxic language.\n2. Matches are played on designated custom maps.\n3. Verify your results with screenshots in case of disputes.",
    scrimsRules: "1. No stream sniping or map sharing.\n2. Emulator users must play in designated emulator slots.\n3. Team names must match registered squad names exactly.",
    paidTournamentRules: "1. Entry fees are non-refundable after slot allocation.\n2. Room IDs are shared 15 minutes prior to the start time.\n3. Prize money is distributed within 24 hours of verification.",
    enableBannerTextOverlay: false,
    championRushOverlay: {
      badge1Text: "ফাস্ট পেইস ম্যাচ",
      badge2Text: "ফ্রি ফায়ার",
      title: "চ্যাম্পিয়ন রাশ",
      subtitle: "তাত্ক্ষণিক বুকিং এবং সরাসরি ফাস্ট-পেস ম্যাচ খেলা।",
      buttonText: "বুক স্লট"
    },
    scrimsOverlay: {
      badge1Text: "অফিসিয়াল টুর্নামেন্ট",
      badge2Text: "ফ্রি ফায়ার",
      title: "স্ক্রিমস টুর্নামেন্ট",
      subtitle: "আপনার গিল্ডের যোগ্যতা প্রমাণ করার গ্লোবাল প্ল্যাটফর্ম।",
      buttonText: "বুক স্লট"
    },
    paidOverlay: {
      badge1Text: "প্রাইজপুল টুর্নামেন্ট",
      badge2Text: "ফ্রি ফায়ার",
      title: "পেইড টুর্নামেন্ট",
      subtitle: "বড় পুরস্কার জিতার সুবর্ণ সুযোগ, যোগ দিন আজই!",
      buttonText: "বুক স্লট"
    },
    bannerBadge1Text: "অফিসিয়াল টুর্নামেন্ট",
    bannerBadge2Text: "ফ্রি ফায়ার",
    bannerOverlayTitle: "স্ক্রিমস টুর্নামেন্ট",
    bannerOverlaySubtitle: "আপনার গিল্ডের যোগ্যতা প্রমাণ করার গ্লোবাল প্ল্যাটফর্ম।",
    bannerOverlayButtonText: "বুক স্লট",
    bKashNumber: "+8801700000000",
    nagadNumber: "+8801800000000",
    bKashInstructions: "",
    nagadInstructions: "",
    whatsAppNumber: "+8801700000000",
    customAnnouncement: ""
  };

  const settingsRef = doc(db, "siteSettings", SETTINGS_DOC_ID);
  return onSnapshot(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      const existing = snapshot.data() as Partial<SiteSettings>;
      onUpdate({
        logoUrl: existing.logoUrl ?? defaultSettings.logoUrl,
        championRushBanner: existing.championRushBanner ?? defaultSettings.championRushBanner,
        scrimsBanner: existing.scrimsBanner ?? defaultSettings.scrimsBanner,
        paidBanner: existing.paidBanner ?? defaultSettings.paidBanner,
        globalRules: existing.globalRules ?? defaultSettings.globalRules,
        championRushRules: existing.championRushRules ?? defaultSettings.championRushRules,
        scrimsRules: existing.scrimsRules ?? defaultSettings.scrimsRules,
        paidTournamentRules: existing.paidTournamentRules ?? defaultSettings.paidTournamentRules,
        enableBannerTextOverlay: existing.enableBannerTextOverlay ?? defaultSettings.enableBannerTextOverlay,
        championRushOverlay: existing.championRushOverlay ?? defaultSettings.championRushOverlay,
        scrimsOverlay: existing.scrimsOverlay ?? defaultSettings.scrimsOverlay,
        paidOverlay: existing.paidOverlay ?? defaultSettings.paidOverlay,
        bannerBadge1Text: existing.bannerBadge1Text ?? defaultSettings.bannerBadge1Text,
        bannerBadge2Text: existing.bannerBadge2Text ?? defaultSettings.bannerBadge2Text,
        bannerOverlayTitle: existing.bannerOverlayTitle ?? defaultSettings.bannerOverlayTitle,
        bannerOverlaySubtitle: existing.bannerOverlaySubtitle ?? defaultSettings.bannerOverlaySubtitle,
        bannerOverlayButtonText: existing.bannerOverlayButtonText ?? defaultSettings.bannerOverlayButtonText,
        bKashNumber: existing.bKashNumber ?? defaultSettings.bKashNumber,
        nagadNumber: existing.nagadNumber ?? defaultSettings.nagadNumber,
        bKashInstructions: existing.bKashInstructions ?? defaultSettings.bKashInstructions,
        nagadInstructions: existing.nagadInstructions ?? defaultSettings.nagadInstructions,
        whatsAppNumber: existing.whatsAppNumber ?? defaultSettings.whatsAppNumber,
        customAnnouncement: existing.customAnnouncement ?? defaultSettings.customAnnouncement
      });
    } else {
      onUpdate(defaultSettings);
    }
  }, (error) => {
    console.warn("Error subscribing to site settings, falling back to in-memory defaults:", error);
    onUpdate(defaultSettings);
  });
}

// Update Site Settings
export async function updateSiteSettings(updates: Partial<SiteSettings>) {
  const settingsRef = doc(db, "siteSettings", SETTINGS_DOC_ID);
  await updateDoc(settingsRef, updates);
}

// Subscribe to User profile
export function subscribeUserProfile(uid: string, onUpdate: (profile: UserProfile | null) => void) {
  const userRef = doc(db, "users", uid);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as UserProfile);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.warn("Error subscribing to user profile:", error);
    onUpdate(null);
  });
}

// Check or create User profile on Auth state change
export async function checkOrCreateUserProfile(
  uid: string, 
  email: string, 
  name: string,
  publicMetadata?: Record<string, any>,
  unsafeMetadata?: Record<string, any>
): Promise<UserProfile> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  const normalizedEmail = (email || "").trim().toLowerCase();
  const isAdminUser = 
    normalizedEmail === "buriramorganization@gmail.com" || 
    publicMetadata?.role === "admin";
  
  const metaTeamName = unsafeMetadata?.teamName || publicMetadata?.teamName || "";
  const metaIgnName = unsafeMetadata?.ignName || publicMetadata?.ignName || "";

  if (!userSnap.exists()) {
    const newProfile: UserProfile = {
      uid,
      email,
      name: name || email.split("@")[0] || "User",
      role: isAdminUser ? "admin" : "player",
      balance: 0,
      teamName: metaTeamName,
      ignName: metaIgnName,
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  } else {
    const existing = userSnap.data() as UserProfile;
    let needsUpdate = false;
    const updates: Partial<UserProfile> = {};

    if (isAdminUser && existing.role !== "admin") {
      updates.role = "admin";
      existing.role = "admin";
      needsUpdate = true;
    }
    if (metaTeamName && !existing.teamName) {
      updates.teamName = metaTeamName;
      existing.teamName = metaTeamName;
      needsUpdate = true;
    }
    if (metaIgnName && !existing.ignName) {
      updates.ignName = metaIgnName;
      existing.ignName = metaIgnName;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await updateDoc(userRef, updates);
    }
    return existing;
  }
}

// Update User Gaming Profile (Team Name, IGN)
export async function updateUserGamingProfile(
  uid: string,
  teamName: string,
  ignName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      teamName: teamName.trim(),
      ignName: ignName.trim()
    });
    return { success: true, message: "Gaming profile updated successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update profile." };
  }
}

// Subscribe to Tournaments
export function subscribeTournaments(onUpdate: (tournaments: Tournament[]) => void) {
  const tournamentsRef = collection(db, "tournaments");
  return onSnapshot(tournamentsRef, (snapshot) => {
    const tournaments: Tournament[] = [];
    snapshot.forEach((doc) => {
      tournaments.push({ id: doc.id, ...doc.data() } as Tournament);
    });
    // Sort by start date time
    tournaments.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    onUpdate(tournaments);
  }, (error) => {
    console.warn("Error subscribing to tournaments:", error);
    onUpdate([]);
  });
}

// Create Tournament (Admin)
export async function createTournament(tournamentData: Omit<Tournament, "id" | "takenSlots" | "slots">) {
  const tournamentsRef = collection(db, "tournaments");
  await addDoc(tournamentsRef, {
    ...tournamentData,
    takenSlots: 0,
    slots: [],
    createdAt: new Date().toISOString()
  });
}

// Update Tournament (Admin)
export async function updateTournament(tournamentId: string, updates: Partial<Tournament>) {
  const tournamentRef = doc(db, "tournaments", tournamentId);
  await updateDoc(tournamentRef, updates);
}

// Update multiple Tournament WhatsApp links at once (Quick CG Links)
export async function updateBatchTournamentWhatsAppLinks(linksMap: Record<string, string>) {
  const promises = Object.entries(linksMap).map(async ([tournamentId, encryptedLink]) => {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    await updateDoc(tournamentRef, { whatsAppLink: encryptedLink });
  });
  await Promise.all(promises);
}

// Delete Tournament (Admin)
export async function deleteTournament(tournamentId: string) {
  const tournamentRef = doc(db, "tournaments", tournamentId);
  await deleteDoc(tournamentRef);
}

// Reset Daily Matches (Admin)
// Instantly clear taken slots, reset obsolete dates to today, clear WhatsApp group links, and set status to Upcoming
export async function resetDailyMatches() {
  const tournamentsRef = collection(db, "tournaments");
  const snap = await getDocs(tournamentsRef);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${year}-${month}-${day}`;

  const promises = snap.docs.map(async (tournamentDoc) => {
    const data = tournamentDoc.data() as Tournament;
    let originalTimeStr = "18:30";
    if (data.startDateTime) {
      const parts = data.startDateTime.split("T");
      if (parts.length > 1) {
        originalTimeStr = parts[1].substring(0, 5);
      } else {
        const spaceParts = data.startDateTime.split(" ");
        if (spaceParts.length > 1) {
          originalTimeStr = spaceParts[1].substring(0, 5);
        }
      }
    }
    const newStartDateTime = `${todayDateStr}T${originalTimeStr}`;
    const ref = doc(db, "tournaments", tournamentDoc.id);
    await updateDoc(ref, {
      takenSlots: 0,
      slots: [],
      whatsAppLink: "", // Clear WhatsApp group links for a fresh restart
      startDateTime: newStartDateTime,
      status: "Upcoming"
    });
  });
  await Promise.all(promises);
}

// Reset an individual tournament match back to 0 slots with today's date
export async function resetTournamentMatch(tournamentId: string) {
  const tournamentRef = doc(db, "tournaments", tournamentId);
  const snap = await getDoc(tournamentRef);
  if (!snap.exists()) return;

  const data = snap.data() as Tournament;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${year}-${month}-${day}`;

  let originalTimeStr = "18:30";
  if (data.startDateTime) {
    const parts = data.startDateTime.split("T");
    if (parts.length > 1) {
      originalTimeStr = parts[1].substring(0, 5);
    } else {
      const spaceParts = data.startDateTime.split(" ");
      if (spaceParts.length > 1) {
        originalTimeStr = spaceParts[1].substring(0, 5);
      }
    }
  }

  // Verify if today at originalTimeStr is in the future
  let targetDateTime = new Date(`${todayDateStr}T${originalTimeStr}`);
  if (targetDateTime.getTime() <= now.getTime()) {
    // If the original time for today has already elapsed, set time to current time + 1 hour so live countdown restarts
    const futureTime = new Date(now.getTime() + 60 * 60 * 1000);
    const fHours = String(futureTime.getHours()).padStart(2, '0');
    const fMins = String(futureTime.getMinutes()).padStart(2, '0');
    originalTimeStr = `${fHours}:${fMins}`;
  }

  const newStartDateTime = `${todayDateStr}T${originalTimeStr}`;
  await updateDoc(tournamentRef, {
    takenSlots: 0,
    slots: [],
    whatsAppLink: "", // Clear WhatsApp group link for fresh restart
    startDateTime: newStartDateTime,
    status: "Upcoming"
  });
}

// Register for a tournament (Supports Single or Multiple Slot Purchase)
export async function registerForTournament(
  tournamentId: string,
  userId: string,
  userEmail: string,
  teamName: string,
  ignName: string,
  slotCount: number = 1
): Promise<{ success: boolean; message: string }> {
  const tournamentRef = doc(db, "tournaments", tournamentId);
  const userRef = doc(db, "users", userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const tournamentSnap = await transaction.get(tournamentRef);
      const userSnap = await transaction.get(userRef);

      if (!tournamentSnap.exists()) {
        throw new Error("Tournament does not exist.");
      }
      if (!userSnap.exists()) {
        throw new Error("User profile not found.");
      }

      const tournament = tournamentSnap.data() as Tournament;
      const user = userSnap.data() as UserProfile;

      // Check if match timer expired or room is active / closed
      if (tournament.status !== "Upcoming" || new Date(tournament.startDateTime).getTime() <= Date.now()) {
        throw new Error("এই ম্যাচের বুকিং সময় শেষ হয়ে গেছে! (BOOKING CLOSED)");
      }

      const requestedSlots = Math.max(1, slotCount);

      // Check if enough slots are available
      const remainingSlots = tournament.totalSlots - tournament.takenSlots;
      if (remainingSlots < requestedSlots) {
        throw new Error(`স্লট খালি নেই! মাত্র ${remainingSlots}টি স্লট বাকি আছে। (Only ${remainingSlots} slots remaining!)`);
      }

      // Calculate total entry fee for requested slots
      const totalEntryFee = tournament.entryFee * requestedSlots;
      if (user.balance < totalEntryFee) {
        throw new Error(`অপর্যাপ্ত ব্যালেন্স। আপনার দরকার ৳${totalEntryFee} BDT, কিন্তু ব্যালেন্স আছে ৳${user.balance} BDT।`);
      }

      // Generate player slot entries
      const newSlots: PlayerSlot[] = [];
      for (let i = 0; i < requestedSlots; i++) {
        const slotIdx = tournament.takenSlots + i + 1;
        const slotTeamLabel = requestedSlots > 1 ? `${teamName} (Slot ${i + 1})` : teamName;
        newSlots.push({
          teamName: slotTeamLabel,
          ignName: ignName.trim() || "N/A",
          userId,
          userEmail,
          index: slotIdx,
          joinedAt: new Date().toISOString()
        });
      }

      // Compute updated balance & slot count
      const newBalance = user.balance - totalEntryFee;
      const newTakenSlots = tournament.takenSlots + requestedSlots;
      const updatedSlots = [...(tournament.slots || []), ...newSlots];

      // Update User Balance in Firestore
      transaction.update(userRef, { balance: newBalance });

      // Update Tournament slots in Firestore
      transaction.update(tournamentRef, {
        takenSlots: newTakenSlots,
        slots: updatedSlots
      });

      // Sync slot booking to Google Sheet asynchronously
      syncSlotBookingToGoogleSheet({
        squadName: teamName,
        ign: ignName,
        phoneNumber: userEmail || userId,
        tournamentTitle: tournament.title,
        status: "Paid"
      }).catch(err => console.warn("Google Sheet sync error:", err));

      return {
        success: true,
        message: `সফলভাবে "${tournament.title}" টুর্নামেন্টে ${requestedSlots}টি স্লট বুক করা হয়েছে!`
      };
    });

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "An unknown error occurred during slot booking."
    };
  }
}

// Bulk Register for Multiple Champion Rush / Tournament Time Slots at once
export async function registerForMultipleTournaments(
  tournamentIds: string[],
  userId: string,
  userEmail: string,
  teamName: string,
  ignName: string,
  slotsPerMatch: number = 1
): Promise<{ success: boolean; message: string }> {
  if (!tournamentIds || tournamentIds.length === 0) {
    return { success: false, message: "কোনো টাইম-স্লট নির্বাচন করা হয়নি।" };
  }

  const userRef = doc(db, "users", userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error("User profile not found.");
      }

      const user = userSnap.data() as UserProfile;

      // Fetch all selected tournament docs inside transaction
      const tournamentSnaps = await Promise.all(
        tournamentIds.map(id => transaction.get(doc(db, "tournaments", id)))
      );

      let grandTotalFee = 0;

      // Validate availability and calculate total fee
      for (const snap of tournamentSnaps) {
        if (!snap.exists()) continue;
        const t = snap.data() as Tournament;
        if (t.status !== "Upcoming" || new Date(t.startDateTime).getTime() <= Date.now()) {
          throw new Error(`"${t.title}" এর বুকিং সময় শেষ হয়ে গেছে! (BOOKING CLOSED)`);
        }
        const remaining = t.totalSlots - t.takenSlots;
        if (remaining < slotsPerMatch) {
          throw new Error(`"${t.title}" ম্যাচে পর্যাপ্ত স্লট খালি নেই!`);
        }
        grandTotalFee += t.entryFee * slotsPerMatch;
      }

      if (user.balance < grandTotalFee) {
        throw new Error(`সবগুলো টাইম-স্লট বুক করতে মোট ৳${grandTotalFee} BDT প্রয়োজন, আপনার ব্যালেন্স আছে ৳${user.balance} BDT।`);
      }

      // Execute slot booking updates for each match
      for (const snap of tournamentSnaps) {
        if (!snap.exists()) continue;
        const t = snap.data() as Tournament;
        const tRef = doc(db, "tournaments", snap.id);

        const newSlots: PlayerSlot[] = [];
        for (let i = 0; i < slotsPerMatch; i++) {
          const slotIdx = t.takenSlots + i + 1;
          const slotLabel = slotsPerMatch > 1 ? `${teamName} (Slot ${i + 1})` : teamName;
          newSlots.push({
            teamName: slotLabel,
            ignName: ignName.trim() || "N/A",
            userId,
            userEmail,
            index: slotIdx,
            joinedAt: new Date().toISOString()
          });
        }

        transaction.update(tRef, {
          takenSlots: t.takenSlots + slotsPerMatch,
          slots: [...(t.slots || []), ...newSlots]
        });
      }

      // Deduct grand total from user balance
      transaction.update(userRef, { balance: user.balance - grandTotalFee });

      // Sync each booked match to Google Sheet
      for (const snap of tournamentSnaps) {
        if (!snap.exists()) continue;
        const t = snap.data() as Tournament;
        syncSlotBookingToGoogleSheet({
          squadName: teamName,
          ign: ignName,
          phoneNumber: userEmail || userId,
          tournamentTitle: t.title,
          status: "Paid"
        }).catch(err => console.warn("Google Sheet sync error:", err));
      }

      return {
        success: true,
        message: `সফলভাবে ${tournamentIds.length}টি টাইম-স্লটের জন্য মোট ৳${grandTotalFee} BDT পরিশোধ করে স্লট বুক করা হয়েছে!`
      };
    });

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to book multiple time slots."
    };
  }
}

// Subscribe to Transactions (Admin sees all, Player sees own)
export function subscribeTransactions(userId: string | null, isAdmin: boolean, onUpdate: (transactions: Transaction[]) => void) {
  const transactionsRef = collection(db, "transactions");
  let q = query(transactionsRef, orderBy("createdAt", "desc"));

  if (!isAdmin && userId) {
    q = query(transactionsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  }

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = [];
    snapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    onUpdate(transactions);
  }, (error) => {
    console.warn("Error subscribing to transactions:", error);
    onUpdate([]);
  });
}

// Submit Transaction Request (Deposit or Withdrawal)
export async function submitTransaction(
  userId: string,
  userEmail: string,
  userName: string,
  type: "Deposit" | "Withdrawal",
  method: "bKash" | "Nagad",
  amount: number,
  mobileNumber: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, message: "User profile not found." };
    }

    const user = userSnap.data() as UserProfile;
    const fee = type === "Withdrawal" ? 5 : 0;

    // For Withdrawal, verify balance upfront and deduct immediately (pending status)
    if (type === "Withdrawal") {
      const totalDeducted = amount + fee;
      if (user.balance < totalDeducted) {
        return { success: false, message: "Insufficient balance to cover withdrawal + flat 5 BDT fee." };
      }

      // Deduct immediately in Firestore transaction to prevent double spending
      await runTransaction(db, async (transaction) => {
        const uSnap = await transaction.get(userRef);
        const latestUser = uSnap.data() as UserProfile;
        if (latestUser.balance < totalDeducted) {
          throw new Error("Insufficient balance.");
        }
        transaction.update(userRef, { balance: latestUser.balance - totalDeducted });
      });
    }

    const transactionsRef = collection(db, "transactions");
    await addDoc(transactionsRef, {
      userId,
      userEmail,
      userName,
      type,
      method,
      amount,
      fee,
      mobileNumber,
      transactionId: type === "Deposit" ? transactionId : `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: "Pending",
      createdAt: new Date().toISOString()
    });

    return { 
      success: true, 
      message: type === "Deposit" 
        ? "Deposit request submitted successfully! Pending verification." 
        : "Withdrawal request submitted! Total deducted from wallet: " + (amount + fee) + " BDT." 
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to submit transaction." };
  }
}

// Verify & Update Transaction Status (Admin Action)
export async function verifyTransaction(
  transactionId: string,
  status: "Approved" | "Rejected",
  adminReference: string
): Promise<{ success: boolean; message: string }> {
  const transactionRef = doc(db, "transactions", transactionId);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const transSnap = await transaction.get(transactionRef);
      if (!transSnap.exists()) {
        throw new Error("Transaction not found.");
      }

      const trans = transSnap.data() as Transaction;
      if (trans.status !== "Pending") {
        throw new Error("Transaction is already " + trans.status);
      }

      const userRef = doc(db, "users", trans.userId);
      const userSnap = await transaction.get(userRef);

      if (trans.type === "Deposit") {
        if (status === "Approved") {
          if (userSnap.exists()) {
            const user = userSnap.data() as UserProfile;
            transaction.update(userRef, { balance: user.balance + trans.amount });
          }
        }
      } else if (trans.type === "Withdrawal") {
        if (status === "Rejected") {
          // If withdrawal is rejected, refund the deducted amount + fee to player's wallet
          if (userSnap.exists()) {
            const user = userSnap.data() as UserProfile;
            const refundAmount = trans.amount + trans.fee;
            transaction.update(userRef, { balance: user.balance + refundAmount });
          }
        }
      }

      transaction.update(transactionRef, {
        status,
        adminReference,
        verifiedAt: new Date().toISOString()
      });

      return { success: true, message: `Transaction request was successfully ${status}.` };
    });

    return result;
  } catch (error: any) {
    return { success: false, message: error.message || "An error occurred." };
  }
}
