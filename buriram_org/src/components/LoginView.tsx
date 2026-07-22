import React, { useState } from "react";
import { SignIn, SignUp, useUser, useSignIn } from "@clerk/clerk-react";

interface LoginViewProps {
  isBengali: boolean;
  onSuccess?: (uid: string, email: string, name: string) => Promise<void>;
}

export default function LoginView({ isBengali }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { isSignedIn, user } = useUser();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const publishableKey = ((import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY) || "";

  // If publishableKey is missing, display friendly instructions for adding Clerk API Keys
  if (!publishableKey) {
    return (
      <div 
        className="w-full max-w-md mx-auto bg-slate-900/90 border border-amber-500/30 p-8 rounded-2xl shadow-2xl text-xs font-sans"
        style={{ fontFamily: isBengali ? "'Hind Siliguri', 'Comfortaa', sans-serif" : "'Comfortaa', sans-serif" }}
      >
        <div className="text-center mb-6">
          <div className="h-12 w-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">
            {isBengali ? "Clerk Authentication কনফিগারেশন প্রয়োজন" : "Clerk Authentication Setup Required"}
          </h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            {isBengali 
              ? "লগইন করতে .env ফাইলে আপনার Clerk Publishable Key বসাতে হবে।" 
              : "Please add your Clerk Publishable Key to the .env file to enable login."}
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px] text-slate-300">
          <p className="text-amber-400 font-bold mb-1">.env Configuration:</p>
          <div className="p-2 bg-black/50 rounded text-emerald-400 select-all">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </div>
          <div className="p-2 bg-black/50 rounded text-emerald-400 select-all">
            CLERK_SECRET_KEY=sk_test_...
          </div>
        </div>

        <p className="mt-4 text-center text-slate-500 text-[11px]">
          {isBengali 
            ? "API Key যুক্ত করার পর পেজটি রিফ্রেশ করুন।" 
            : "Refresh the page after updating the .env file."}
        </p>
      </div>
    );
  }

  // Signed In state notice inside Login Tab
  if (isSignedIn && user) {
    const userEmail = user.primaryEmailAddress?.emailAddress || "";
    const userName = user.fullName || user.firstName || userEmail.split("@")[0];

    return (
      <div 
        className="w-full max-w-md mx-auto bg-slate-900/95 border border-emerald-500/30 p-8 rounded-2xl shadow-2xl text-center text-xs font-sans"
        style={{ fontFamily: isBengali ? "'Hind Siliguri', 'Comfortaa', sans-serif" : "'Comfortaa', sans-serif" }}
      >
        <div className="h-14 w-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">
          {isBengali ? "আপনি সফলভাবে লগইন করেছেন!" : "You are Signed In!"}
        </h2>
        <p className="text-slate-400 mt-2 font-medium">
          {userName} ({userEmail})
        </p>
        <div className="mt-6 p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold">
          {isBengali ? "টুর্নামেন্টে যোগ দিতে হোমপেজ অথবা টুর্নামেন্ট ট্যাবে যান।" : "Explore tournaments to book your slot!"}
        </div>
      </div>
    );
  }

  // Step 1: Send OTP reset code to email
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn || !resetEmail) return;
    setLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: resetEmail.trim(),
      });
      setCodeSent(true);
      setResetSuccess(
        isBengali 
          ? "আপনার ইমেইলে রিসেট কোড পাঠানো হয়েছে। চেক করুন।" 
          : "A reset code has been sent to your email."
      );
    } catch (err: any) {
      console.error("Reset Code Error:", err);
      setResetError(
        err?.errors?.[0]?.longMessage || 
        err?.errors?.[0]?.message || 
        (isBengali ? "ইমেইল পাঠাতে সমস্যা হয়েছে। সঠিক ইমেইল দিন।" : "Failed to send reset code. Please check email.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP code and set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn || !resetCode || !newPassword) return;
    setLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setResetSuccess(
          isBengali 
            ? "পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে! আপনি লগইন হয়েছেন।" 
            : "Password successfully reset! You are logged in."
        );
      } else {
        setResetError(isBengali ? "পাসওয়ার্ড রিসেট অসম্পূর্ণ।" : "Password reset incomplete.");
      }
    } catch (err: any) {
      console.error("Password Submit Error:", err);
      setResetError(
        err?.errors?.[0]?.longMessage || 
        err?.errors?.[0]?.message || 
        (isBengali ? "ভুল কোড অথবা পাসওয়ার্ড সঠিক নয়।" : "Invalid code or weak password.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="w-full max-w-md mx-auto flex flex-col items-center justify-center font-sans text-xs"
      style={{ fontFamily: isBengali ? "'Hind Siliguri', 'Comfortaa', sans-serif" : "'Comfortaa', sans-serif" }}
    >
      {/* Auth Mode Toggle */}
      <div className="flex items-center justify-between w-full mb-4 bg-slate-900/90 border border-slate-700/60 p-1.5 rounded-xl shadow-lg">
        <button
          onClick={() => {
            setIsSignUp(false);
            setIsResetMode(false);
          }}
          className={`flex-1 py-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
            !isSignUp && !isResetMode
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          {isBengali ? "লগইন" : "Login"}
        </button>
        <button
          onClick={() => {
            setIsSignUp(true);
            setIsResetMode(false);
          }}
          className={`flex-1 py-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
            isSignUp && !isResetMode
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          {isBengali ? "সাইন আপ" : "Sign Up"}
        </button>
      </div>

      {/* Forgot Password Mode View */}
      {isResetMode ? (
        <div className="w-full bg-slate-900/95 border border-slate-700/60 text-slate-100 shadow-2xl backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wide">
              {isBengali ? "পাসওয়ার্ড রিসেট করুন" : "Reset Password"}
            </h2>
            <button 
              onClick={() => setIsResetMode(false)}
              className="text-indigo-400 hover:text-indigo-300 text-xs font-bold cursor-pointer"
            >
              {isBengali ? "← লগইনে ফিরে যান" : "← Back to Login"}
            </button>
          </div>

          {resetError && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-xl font-medium text-xs">
              {resetError}
            </div>
          )}

          {resetSuccess && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-xl font-medium text-xs">
              {resetSuccess}
            </div>
          )}

          {!codeSent ? (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBengali ? "আপনার রেজিস্টার্ড ইমেইল" : "Registered Email"}
                </label>
                <input 
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {loading 
                  ? (isBengali ? "কোড পাঠানো হচ্ছে..." : "Sending Code...") 
                  : (isBengali ? "রিসেট কোড পাঠান" : "Send Reset Code")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBengali ? "ইমেইলে পাঠানো রিসেট কোড (OTP)" : "Email OTP Code"}
                </label>
                <input 
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBengali ? "নতুন পাসওয়ার্ড" : "New Password"}
                </label>
                <input 
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs cursor-pointer disabled:opacity-50"
              >
                {loading 
                  ? (isBengali ? "পাসওয়ার্ড আপডেট হচ্ছে..." : "Resetting Password...") 
                  : (isBengali ? "পাসওয়ার্ড সেভ ও লগইন করুন" : "Save Password & Login")}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Standard Clerk Auth Component */
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex justify-center">
            {isSignUp ? (
              <SignUp 
                routing="hash"
                appearance={{
                  layout: {
                    logoPlacement: 'none',
                    showOptionalFields: false,
                  },
                  variables: {
                    colorPrimary: '#6366f1',
                    colorBackground: '#1e293b',
                    colorText: '#ffffff',
                    colorTextSecondary: '#94a3b8',
                    colorInputBackground: '#0f172a',
                    colorInputText: '#ffffff',
                    borderRadius: '0.75rem',
                  },
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full shadow-2xl rounded-2xl overflow-hidden",
                    card: "bg-slate-900/95 border border-slate-700/60 text-slate-100 shadow-2xl backdrop-blur-md rounded-2xl p-6",
                    headerTitle: "text-white font-bold text-lg tracking-wide",
                    headerSubtitle: "text-slate-400 text-xs",
                    socialButtonsBlockButton: "bg-slate-950 text-white border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all font-bold rounded-xl text-white shadow-sm",
                    socialButtonsBlockButtonText: "text-white font-bold text-xs text-slate-100 opacity-100",
                    socialButtonsBlockButtonArrow: "text-white",
                    formFieldLabel: "text-slate-300 font-semibold text-xs",
                    formFieldLabelRow: "flex items-center justify-between w-full mb-1",
                    formFieldAction: "text-indigo-400 hover:text-indigo-300 font-bold text-xs transition-colors cursor-pointer ml-auto",
                    formFieldInput: "bg-slate-950 border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition-all text-xs",
                    formButtonPrimary: "bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all py-2.5 text-xs border-none cursor-pointer",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300 font-bold text-xs",
                    footerActionText: "text-slate-400 text-xs",
                    identityPreviewText: "text-slate-200 font-medium text-xs",
                    identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300 text-xs",
                    dividerLine: "bg-slate-700",
                    dividerText: "text-slate-400 text-xs uppercase font-bold",
                    footer: "hidden"
                  }
                }}
              />
            ) : (
              <SignIn 
                routing="hash"
                appearance={{
                  layout: {
                    logoPlacement: 'none',
                    showOptionalFields: false,
                  },
                  variables: {
                    colorPrimary: '#6366f1',
                    colorBackground: '#1e293b',
                    colorText: '#ffffff',
                    colorTextSecondary: '#94a3b8',
                    colorInputBackground: '#0f172a',
                    colorInputText: '#ffffff',
                    borderRadius: '0.75rem',
                  },
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full shadow-2xl rounded-2xl overflow-hidden",
                    card: "bg-slate-900/95 border border-slate-700/60 text-slate-100 shadow-2xl backdrop-blur-md rounded-2xl p-6",
                    headerTitle: "text-white font-bold text-lg tracking-wide",
                    headerSubtitle: "text-slate-400 text-xs",
                    socialButtonsBlockButton: "bg-slate-950 text-white border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all font-bold rounded-xl text-white shadow-sm",
                    socialButtonsBlockButtonText: "text-white font-bold text-xs text-slate-100 opacity-100",
                    socialButtonsBlockButtonArrow: "text-white",
                    formFieldLabel: "text-slate-300 font-semibold text-xs",
                    formFieldLabelRow: "flex items-center justify-between w-full mb-1",
                    formFieldAction: "text-indigo-400 hover:text-indigo-300 font-bold text-xs transition-colors cursor-pointer ml-auto",
                    formFieldInput: "bg-slate-950 border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition-all text-xs",
                    formButtonPrimary: "bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all py-2.5 text-xs border-none cursor-pointer",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300 font-bold text-xs",
                    footerActionText: "text-slate-400 text-xs",
                    identityPreviewText: "text-slate-200 font-medium text-xs",
                    identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300 text-xs",
                    dividerLine: "bg-slate-700",
                    dividerText: "text-slate-400 text-xs uppercase font-bold",
                    footer: "hidden"
                  }
                }}
              />
            )}
          </div>

          {/* Direct Forgot Password Trigger Button */}
          {!isSignUp && (
            <button
              onClick={() => setIsResetMode(true)}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all cursor-pointer hover:underline"
            >
              {isBengali ? "পাসওয়ার্ড ভুলে গেছেন? রিসেট করুন" : "Forgot Password? Reset Here"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
