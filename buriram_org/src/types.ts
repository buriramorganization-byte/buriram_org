export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "player";
  balance: number;
  teamName?: string;
  ignName?: string;
}

export interface CategoryBannerOverlay {
  badge1Text?: string;
  badge2Text?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export interface SiteSettings {
  logoUrl: string;
  championRushBanner: string;
  scrimsBanner: string;
  paidBanner: string;
  globalRules: string;
  championRushRules?: string;
  scrimsRules?: string;
  paidTournamentRules?: string;
  championRushTimeline?: string;
  scrimsTimeline?: string;
  paidTournamentTimeline?: string;
  enableBannerTextOverlay?: boolean;
  championRushOverlay?: CategoryBannerOverlay;
  scrimsOverlay?: CategoryBannerOverlay;
  paidOverlay?: CategoryBannerOverlay;
  bannerBadge1Text?: string;
  bannerBadge2Text?: string;
  bannerOverlayTitle?: string;
  bannerOverlaySubtitle?: string;
  bannerOverlayButtonText?: string;
  bKashNumber: string;
  nagadNumber: string;
  bKashInstructions?: string;
  nagadInstructions?: string;
  whatsAppNumber?: string;
  customAnnouncement: string;
}

export interface PlayerSlot {
  teamName: string;
  ignName: string;
  userId: string;
  userEmail: string;
  index: number;
  joinedAt?: string;
}

export interface Tournament {
  id: string;
  title: string;
  category: "Champion Rush" | "Scrims" | "Paid Tournaments";
  mapName?: string; // e.g. Bermuda, Purgatory, Kalahari, Alpine, NeXTera, Custom
  startDateTime: string; // ISO string
  entryFee: number;
  totalSlots: number;
  takenSlots: number;
  slots: PlayerSlot[];
  description: string;
  prizePool: number;
  prizeType: "Top 3" | "Top 4" | "Top 5";
  prizePrizes: number[]; // BDT prizes for 1st, 2nd, etc.
  whatsAppLink: string;
  status: "Upcoming" | "Active" | "Completed"; // Active means Match Started / Room Active
  createdAt?: string; // Auto-date creation ISO string
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: "Deposit" | "Withdrawal";
  method: "bKash" | "Nagad";
  amount: number;
  fee: number;
  mobileNumber: string;
  transactionId: string;
  status: "Pending" | "Approved" | "Rejected";
  adminReference?: string;
  createdAt: string;
}
