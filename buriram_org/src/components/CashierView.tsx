import React, { useState, useEffect } from "react";
import { UserProfile, Transaction, SiteSettings } from "../types";
import { submitTransaction } from "../services/firebaseService";
import { convertToBengaliNumbers } from "../utils/dateFormatter";
import { Wallet, Plus, ArrowUpRight, Clock, CheckCircle2, XCircle, ChevronRight, Copy, ArrowDownLeft } from "lucide-react";

interface CashierViewProps {
  currentUser: UserProfile;
  transactions: Transaction[];
  siteSettings: SiteSettings;
  isBengali: boolean;
  autoOpenDepositModal?: boolean;
}

export default function CashierView({ currentUser, transactions, siteSettings, isBengali, autoOpenDepositModal }: CashierViewProps) {
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showWithdrawMoneyModal, setShowWithdrawMoneyModal] = useState(false);

  useEffect(() => {
    if (autoOpenDepositModal) {
      setShowAddMoneyModal(true);
    }
  }, [autoOpenDepositModal]);
  const [activeFilter, setActiveFilter] = useState<"All" | "Deposit" | "Withdrawal">("All");

  // Form states
  const [method, setMethod] = useState<"bKash" | "Nagad">("bKash");
  const [amount, setAmount] = useState<number | "">("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // bKash Logo SVG Helper
  const BkashLogo = () => (
    <svg className="w-12 h-6" viewBox="0 0 100 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="45" rx="8" fill="#e2136e" />
      <text x="50" y="28" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">bKash</text>
    </svg>
  );

  // Nagad Logo SVG Helper
  const NagadLogo = () => (
    <svg className="w-12 h-6" viewBox="0 0 100 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="45" rx="8" fill="#f44336" />
      <text x="50" y="28" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Nagad</text>
    </svg>
  );

  const resetForm = () => {
    setAmount("");
    setMobileNumber("");
    setTransactionId("");
    setMessage(null);
  };

  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: isBengali ? "সঠিক পরিমাণ লিখুন।" : "Please enter a valid amount." });
      return;
    }
    if (!mobileNumber.trim()) {
      setMessage({ type: "error", text: isBengali ? "মোবাইল নাম্বার লিখুন।" : "Please enter mobile number." });
      return;
    }
    if (!transactionId.trim()) {
      setMessage({ type: "error", text: isBengali ? "লেনদেন আইডি (TxnID) দিন।" : "Please enter transaction ID." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const res = await submitTransaction(
      currentUser.uid,
      currentUser.email,
      currentUser.name,
      "Deposit",
      method,
      Number(amount),
      mobileNumber.trim(),
      transactionId.trim()
    );

    setIsSubmitting(false);
    if (res.success) {
      setMessage({ type: "success", text: res.message });
      setTimeout(() => {
        setShowAddMoneyModal(false);
        resetForm();
      }, 2500);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  const handleWithdrawMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: isBengali ? "সঠিক পরিমাণ লিখুন।" : "Please enter a valid amount." });
      return;
    }
    if (!mobileNumber.trim()) {
      setMessage({ type: "error", text: isBengali ? "টার্গেট একাউন্ট নাম্বার দিন।" : "Please enter target account number." });
      return;
    }

    const totalDeducted = Number(amount) + 5;
    if (currentUser.balance < totalDeducted) {
      setMessage({
        type: "error",
        text: isBengali
          ? `আপনার পর্যাপ্ত ব্যালেন্স নেই। প্রয়োজনীয়: ${totalDeducted} BDT (ফি সহ), বর্তমান ব্যালেন্স: ${currentUser.balance} BDT`
          : `Insufficient balance. Required: ${totalDeducted} BDT (with fee), Wallet: ${currentUser.balance} BDT`
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const res = await submitTransaction(
      currentUser.uid,
      currentUser.email,
      currentUser.name,
      "Withdrawal",
      method,
      Number(amount),
      mobileNumber.trim(),
      ""
    );

    setIsSubmitting(false);
    if (res.success) {
      setMessage({ type: "success", text: res.message });
      setTimeout(() => {
        setShowWithdrawMoneyModal(false);
        resetForm();
      }, 2500);
    } else {
      setMessage({ type: "error", text: res.message });
    }
  };

  // Conversions for UI
  const balanceDisplay = isBengali ? convertToBengaliNumbers(currentUser.balance) : currentUser.balance;
  const adminBksh = siteSettings.bKashNumber || "+8801700000000";
  const adminNagad = siteSettings.nagadNumber || "+8801800000000";

  // Filter Transaction logs
  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === "All") return true;
    return t.type === activeFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Wallet Balance Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#120a2b] via-[#090416] to-[#030107] border border-violet-500/25 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(139,92,246,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Background ambient lighting */}
        <div className="absolute right-0 top-0 w-[200px] h-[200px] bg-violet-600/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute left-1/3 bottom-0 w-[150px] h-[150px] bg-fuchsia-600/5 rounded-full blur-[80px] -z-10"></div>
        
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Wallet className="w-4 h-4" />
            </span>
            <span className="font-mono text-xs text-violet-300 font-bold uppercase tracking-widest">
              {isBengali ? "পার্সোনাল গেমিং ওয়ালেট" : "PERSONAL GAMING WALLET"}
            </span>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-5xl font-black text-white font-sans tracking-tight flex items-baseline gap-2">
              <span>৳{balanceDisplay}</span>
              <span className="text-sm sm:text-base font-mono font-black text-violet-400">BDT</span>
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              {isBengali ? `নিবন্ধিত একাউন্ট আইডি: ${currentUser.email}` : `Registered Wallet ID: ${currentUser.email}`}
            </p>
          </div>
        </div>

        {/* Clean Handcrafted Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 z-10 w-full md:w-auto">
          <button
            onClick={() => { resetForm(); setShowAddMoneyModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.03] active:scale-[0.98] text-white font-sans font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer border border-emerald-500/20"
          >
            <Plus className="w-4 h-4 text-white" />
            {isBengali ? "টাকা জমা দিন" : "Deposit Funds"}
          </button>
          
          <button
            onClick={() => { resetForm(); setShowWithdrawMoneyModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 hover:bg-rose-500 hover:scale-[1.03] active:scale-[0.98] text-white font-sans font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-950/40 cursor-pointer border border-rose-500/20"
          >
            <ArrowUpRight className="w-4 h-4 text-white" />
            {isBengali ? "টাকা উত্তোলন করুন" : "Withdraw Funds"}
          </button>
        </div>
      </div>

      {/* Transaction History Logs with Filters */}
      <div className="bg-zinc-950/40 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>{isBengali ? "লেনদেন বিবরণী" : "TRANSACTION LOGS"}</span>
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              {isBengali ? "আপনার একাউন্টের সাম্প্রতিক লেনদেন সমূহ" : "Review real-time deposits and withdrawal requests"}
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex bg-black/50 border border-white/5 p-1 rounded-xl self-start">
            <button
              onClick={() => setActiveFilter("All")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "All"
                  ? "bg-violet-600 text-white font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {isBengali ? "সব" : "All"}
            </button>
            <button
              onClick={() => setActiveFilter("Deposit")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "Deposit"
                  ? "bg-violet-600 text-white font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {isBengali ? "ডিপোজিট" : "Deposits"}
            </button>
            <button
              onClick={() => setActiveFilter("Withdrawal")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "Withdrawal"
                  ? "bg-violet-600 text-white font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {isBengali ? "উত্তোলন" : "Withdrawals"}
            </button>
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-black/40 border-b border-white/10 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">
                  <th className="p-4">{isBengali ? "তারিখ" : "DATE"}</th>
                  <th className="p-4">{isBengali ? "ধরণ" : "TYPE"}</th>
                  <th className="p-4">{isBengali ? "পদ্ধতি" : "METHOD"}</th>
                  <th className="p-4 text-right">{isBengali ? "পরিমাণ" : "AMOUNT"}</th>
                  <th className="p-4">{isBengali ? "মোবাইল" : "MOBILE"}</th>
                  <th className="p-4">{isBengali ? "অবস্থা" : "STATUS"}</th>
                  <th className="p-4">{isBengali ? "লেনদেন রেফারেন্স" : "REFERENCE / TXN"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredTransactions.map((t) => {
                  const date = new Date(t.createdAt).toLocaleDateString(isBengali ? "bn-BD" : "en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });
                  const amountVal = isBengali ? convertToBengaliNumbers(t.amount) : t.amount;
                  const feeVal = isBengali ? convertToBengaliNumbers(t.fee) : t.fee;

                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-zinc-500 whitespace-nowrap">{date}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-mono font-black uppercase text-[9px] px-2 py-0.5 rounded ${
                          t.type === "Deposit" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {t.type === "Deposit" ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                              <span>{isBengali ? "জমা" : "Deposit"}</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-rose-400" />
                              <span>{isBengali ? "উত্তোলন" : "Withdrawal"}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        {t.method === "bKash" ? (
                          <span className="font-bold text-pink-500 tracking-tight">bKash</span>
                        ) : (
                          <span className="font-bold text-orange-500 tracking-tight">Nagad</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-black text-white whitespace-nowrap">
                        ৳{amountVal}
                        {t.fee > 0 && (
                          <span className="text-[9px] text-rose-400 block font-normal mt-0.5">
                            +{feeVal} fee
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400 font-mono">{t.mobileNumber}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          t.status === "Approved" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : t.status === "Rejected" 
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        }`}>
                          {t.status === "Approved" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>{isBengali ? "অনুমোদিত" : "Approved"}</span>
                            </>
                          ) : t.status === "Rejected" ? (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>{isBengali ? "প্রত্যাখ্যাত" : "Rejected"}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>{isBengali ? "অপেক্ষমান" : "Pending"}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono truncate max-w-[150px]" title={t.adminReference || t.transactionId}>
                            {t.type === "Withdrawal" && t.status === "Approved" && t.adminReference ? (
                              <span className="text-violet-400 font-bold">{t.adminReference}</span>
                            ) : (
                              t.transactionId
                            )}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(t.transactionId);
                              alert(isBengali ? "কপি করা হয়েছে!" : "TxnID copied!");
                            }}
                            className="p-1 hover:bg-white/10 rounded text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center bg-black/20 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-white/5 rounded-full text-zinc-600">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              {isBengali ? "এই ক্যাটাগরিতে কোনো লেনদেন রেকর্ড পাওয়া যায়নি।" : "No cash transactions logged yet."}
            </p>
          </div>
        )}
      </div>

      {/* ==================== ADD MONEY MODAL ==================== */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg lg:max-w-xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[85vh] flex flex-col">
            <div className="shrink-0 p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#140a2c] to-black">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                  <Plus className="w-4 h-4" />
                </span>
                {isBengali ? "টাকা জমা দিন (সেন্ড মানি)" : "Add Money (Send Money)"}
              </h3>
              <button 
                onClick={() => setShowAddMoneyModal(false)} 
                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Method Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                  {isBengali ? "পেমেন্ট পদ্ধতি নির্বাচন করুন" : "SELECT PAYMENT METHOD"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod("bKash")}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      method === "bKash" 
                        ? "bg-pink-500/10 border-pink-500 text-pink-400 font-bold shadow-lg shadow-pink-950/20" 
                        : "bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <BkashLogo />
                    <span className="text-xs font-mono font-bold">bKash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("Nagad")}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      method === "Nagad" 
                        ? "bg-orange-500/10 border-orange-500 text-orange-400 font-bold shadow-lg shadow-orange-950/20" 
                        : "bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <NagadLogo />
                    <span className="text-xs font-mono font-bold">Nagad</span>
                  </button>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl font-mono text-xs text-zinc-300 space-y-2.5">
                <p className="font-bold text-violet-400 flex items-center gap-1.5">
                  <ChevronRight className="w-4 h-4 text-violet-500" />
                  <span>{isBengali ? "টাকা পাঠানোর নিয়মাবলী:" : "HOW TO PAY:"}</span>
                </p>

                {(() => {
                  const customRules = method === "bKash" ? siteSettings?.bKashInstructions : siteSettings?.nagadInstructions;
                  if (customRules && customRules.trim()) {
                    return (
                      <div className="text-zinc-300 space-y-1.5 text-xs leading-relaxed font-sans bg-black/40 p-3 rounded-xl border border-white/5">
                        {customRules.split("\n").filter(Boolean).map((line, idx) => (
                          <p key={idx} className="flex items-start gap-1.5">
                            <span className="text-violet-400 font-bold font-mono">•</span>
                            <span className="text-zinc-300">{line}</span>
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <p className="text-zinc-400 leading-relaxed">
                      1. {isBengali ? "আপনার পার্সোনাল একাউন্ট থেকে" : "From your Personal account,"}{" "}
                      <span className="text-white font-bold">{isBengali ? "সেন্ড মানি (Send Money)" : "Send Money"}</span>{" "}
                      {isBengali ? "করুন।" : "to our number below."}
                    </p>
                  );
                })()}

                <div className="p-3 bg-[#0a0a0a] border border-white/15 rounded-xl flex items-center justify-between text-white font-bold">
                  <span className="font-mono">
                    {method === "bKash" ? "bKash:" : "Nagad:"}{" "}
                    <span className="text-violet-400">{method === "bKash" ? adminBksh : adminNagad}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(method === "bKash" ? adminBksh : adminNagad);
                      alert(isBengali ? "কপি করা হয়েছে!" : "Number copied!");
                    }}
                    className="text-[10px] text-zinc-500 hover:text-violet-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isBengali ? "কপি" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed pt-1 border-t border-white/5">
                  2. {isBengali ? "টাকা সফলভাবে পাঠানোর পর, নিচের ফর্মে আপনার পাঠানো পরিমাণ, মোবাইল নাম্বার এবং ট্রানজেকশন আইডি (TxnID) সাবমিট করুন।" : "After payment is complete, enter the details in the form below to initiate review."}
                </p>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-zinc-500 mb-1.5">{isBengali ? "টাকার পরিমাণ (BDT)" : "Amount (BDT)"}</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 100"
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1.5">{isBengali ? "আপনার মোবাইল নাম্বার" : "Your Mobile Number"}</label>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1.5">{isBengali ? "ট্রানজেকশন আইডি (TxnID)" : "Transaction ID (TxnID)"}</label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. A1B2C3D4"
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-mono transition-all"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${
                  message.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                  {message.text}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isBengali ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-850 text-white font-black rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-emerald-950/35"
                >
                  {isSubmitting ? (isBengali ? "প্রক্রিয়াকরণ..." : "Submitting...") : (isBengali ? "জমা দিন" : "Submit Request")}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== WITHDRAW MONEY MODAL ==================== */}
      {showWithdrawMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg lg:max-w-xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[85vh] flex flex-col">
            <div className="shrink-0 p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#140a2c] to-black">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span className="p-1 rounded bg-rose-500/10 text-rose-400">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                {isBengali ? "টাকা উত্তোলন করুন" : "Withdraw Money"}
              </h3>
              <button 
                onClick={() => setShowWithdrawMoneyModal(false)} 
                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawMoneySubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Method Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                  {isBengali ? "উত্তোলন পদ্ধতি নির্বাচন করুন" : "SELECT WITHDRAWAL METHOD"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod("bKash")}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      method === "bKash" 
                        ? "bg-pink-500/10 border-pink-500 text-pink-400 font-bold shadow-lg shadow-pink-950/20" 
                        : "bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <BkashLogo />
                    <span className="text-xs font-mono font-bold">bKash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("Nagad")}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      method === "Nagad" 
                        ? "bg-orange-500/10 border-orange-500 text-orange-400 font-bold shadow-lg shadow-orange-950/20" 
                        : "bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <NagadLogo />
                    <span className="text-xs font-mono font-bold">Nagad</span>
                  </button>
                </div>
              </div>

              {/* Warning box */}
              <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-2xl text-rose-400 font-mono text-xs flex items-start gap-2.5 leading-relaxed">
                <p className="text-zinc-400">
                  {isBengali 
                    ? "একটি ফ্ল্যাট ৫ টাকা ফি উত্তোলন চার্জ হিসাবে কাটা হবে। (মোট কর্তন = উত্তোলন পরিমাণ + ৫ টাকা BDT)" 
                    : "A flat 5 BDT fee is automatically deducted from your wallet for each withdrawal request. (Total deducted = Amount + 5 BDT)"}
                </p>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-zinc-500 mb-1.5">{isBengali ? "উত্তোলন পরিমাণ (BDT)" : "Withdrawal Amount (BDT)"}</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 200"
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-mono transition-all"
                  />
                  {amount !== "" && (
                    <span className="text-[10px] text-zinc-400 block mt-1.5">
                      {isBengali 
                        ? `আপনার ওয়ালেট থেকে মোট কাটা হবে: ${amount + 5} টাকা` 
                        : `Total balance to deduct: ${amount + 5} BDT`}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1.5">
                    {method === "bKash" 
                      ? (isBengali ? "টার্গেট bKash পার্সোনাল নাম্বার" : "Target bKash Personal Number")
                      : (isBengali ? "টার্গেট Nagad পার্সোনাল নাম্বার" : "Target Nagad Personal Number")}
                  </label>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 font-mono transition-all"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-xs font-mono border ${
                  message.text ? (message.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400")
                    : ""
                }`}>
                  {message.text}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawMoneyModal(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isBengali ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-850 text-white font-black rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-rose-950/35"
                >
                  {isSubmitting ? (isBengali ? "উত্তোলন হচ্ছে..." : "Withdrawing...") : (isBengali ? "উত্তোলন করুন" : "Withdraw Funds")}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
