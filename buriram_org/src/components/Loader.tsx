import React, { useEffect, useState } from "react";

interface LoaderProps {
  logoUrl?: string;
  isVisible: boolean;
}

export default function Loader({ logoUrl, isVisible }: LoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const displayProgress = Math.min(100, Math.floor(progress));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090b] select-none">
      <div className="relative flex items-center justify-center">
        {/* Pulsing neon violet aura */}
        <div className="absolute h-64 w-64 rounded-full bg-violet-600/15 blur-2xl animate-pulse"></div>
        
        {/* Sleek rotating outer gaming ring */}
        <div className="absolute h-44 w-44 rounded-full border border-zinc-800"></div>
        <div className="absolute h-44 w-44 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-transparent border-l-transparent animate-spin duration-[1.8s] ease-out"></div>
        <div className="absolute h-40 w-40 rounded-full border border-dashed border-zinc-700/60 animate-spin duration-[8s] ease-linear"></div>

        {/* Dynamic official logo */}
        <div className="relative h-28 w-28 rounded-full bg-[#121214] flex items-center justify-center border-2 border-zinc-800/80 overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.25)]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="BURIRAM ORG"
              className="h-24 w-24 object-contain rounded-full transition-transform hover:scale-105 duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="font-sans font-black text-2xl text-white tracking-tighter">B<span className="text-violet-500">R</span></span>
              <span className="text-[7px] font-mono tracking-widest text-zinc-500 uppercase font-black -mt-1">GAMING</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Platform Name under spinner */}
      <div className="mt-10 text-center space-y-2 max-w-xs">
        <h1 className="font-sans font-black text-3xl tracking-tight text-white uppercase">
          BURIRAM <span className="text-violet-500">ORG</span>
        </h1>
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase font-bold">
          E-sports Arena & Matchmaking
        </p>
      </div>

      {/* Stylized progress bar */}
      <div className="mt-12 w-64 bg-zinc-950 border border-zinc-900 rounded-full h-1.5 p-0.5 overflow-hidden relative">
        <div 
          className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      <div className="mt-2 font-mono text-[10px] text-zinc-500 tracking-wider">
        PREPARING ARENA... <span className="text-violet-400 font-bold font-sans">{displayProgress}%</span>
      </div>
    </div>
  );
}

