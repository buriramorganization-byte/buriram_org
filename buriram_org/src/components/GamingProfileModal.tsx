import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { UserProfile } from "../types";
import { updateUserGamingProfile } from "../services/firebaseService";

interface GamingProfileModalProps {
  currentUser: UserProfile;
  isBengali: boolean;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function GamingProfileModal({
  currentUser,
  isBengali,
  isOpen,
  onClose,
  onUpdated,
}: GamingProfileModalProps) {
  const { user } = useUser();
  const [teamName, setTeamName] = useState(currentUser.teamName || "");
  const [ignName, setIgnName] = useState(currentUser.ignName || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !ignName.trim()) {
      setMessage({
        type: "error",
        text: isBengali ? "অনুগ্রহ করে টিমের নাম এবং IGN ফিল্ড পূরণ করুন।" : "Please fill in both Team Name and IGN.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. Sync with Clerk unsafeMetadata if available
      if (user) {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            teamName: teamName.trim(),
            ignName: ignName.trim(),
          },
        });
      }

      // 2. Sync with Firestore Database
      const result = await updateUserGamingProfile(currentUser.uid, teamName, ignName);

      if (result.success) {
        setMessage({
          type: "success",
          text: isBengali ? "গেমিং প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!" : "Gaming profile saved successfully!",
        });
        if (onUpdated) onUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (err: any) {
      console.error("Gaming profile save error:", err);
      setMessage({
        type: "error",
        text: err.message || (isBengali ? "প্রোফাইল আপডেট করতে সমস্যা হয়েছে।" : "Failed to update gaming profile."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-lg lg:max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative text-slate-100 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col my-auto"
        style={{ fontFamily: isBengali ? "'Hind Siliguri', 'Comfortaa', sans-serif" : "'Comfortaa', sans-serif" }}
      >
        {/* Header Icon */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">
                {isBengali ? "গেমিং প্রোফাইল লিঙ্ক করুন" : "Complete Gaming Profile"}
              </h2>
              <p className="text-xs text-slate-400">
                {isBengali ? "টুর্নামেন্টে দ্রুত স্লট বুক করার জন্য সেট করুন" : "Set your default team and in-game name"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs font-semibold ${
              message.type === "success"
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/60 border-rose-500/40 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              {isBengali ? "টিমের নাম (Team Name) *" : "Team Name *"}
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={isBengali ? "যেমন: Buriram Esports" : "e.g. Buriram Esports"}
              className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* IGN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              {isBengali ? "ইন-গেম নাম (In-Game Name / IGN) *" : "In-Game Name / IGN *"}
            </label>
            <input
              type="text"
              required
              value={ignName}
              onChange={(e) => setIgnName(e.target.value)}
              placeholder={isBengali ? "যেমন: BURIRAM_BOSS / UID" : "e.g. BURIRAM_BOSS / UID"}
              className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>{isBengali ? "সংরক্ষণ করা হচ্ছে..." : "Saving Profile..."}</span>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{isBengali ? "গেমিং প্রোফাইল সেভ করুন" : "Save Gaming Profile"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
