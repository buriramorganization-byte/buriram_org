import React from "react";

interface SupportButtonProps {
  whatsAppNumber: string;
  isBengali: boolean;
}

export default function SupportButton({ whatsAppNumber, isBengali }: SupportButtonProps) {
  const cleanNumber = whatsAppNumber.replace(/\D/g, "");
  const text = encodeURIComponent(
    isBengali 
      ? "হ্যালো বুড়িরাম অর্গ, আমার কিছু সহায়তা প্রয়োজন।" 
      : "Hello Buriram Org, I need support regarding a match or transaction."
  );
  const url = `https://wa.me/${cleanNumber || "8801700000000"}?text=${text}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-400 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center cursor-pointer group"
      title={isBengali ? "গ্রাহক সেবা পান" : "Get Support"}
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.019-5.101-2.875-6.958C16.543 1.924 14.07 1.9 11.442 1.9c-5.439 0-9.859 4.42-9.863 9.865-.001 1.73.473 3.424 1.373 4.953l-.995 3.635 3.73-.978z" />
      </svg>
      
      {/* Visual tooltip */}
      <span className="absolute right-14 bg-zinc-950 text-white font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-md border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
        💬 {isBengali ? "অনলাইন সাপোর্ট" : "Live Support"}
      </span>
    </a>
  );
}
