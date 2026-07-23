import React, { useEffect, useState } from "react";
import { Tournament } from "../types";
import { formatTimeBilingual, convertToBengaliNumbers } from "../utils/dateFormatter";

interface AnnouncementBarProps {
  tournaments: Tournament[];
  customOverride?: string;
  isBengali: boolean;
}

export default function AnnouncementBar({ tournaments, customOverride, isBengali }: AnnouncementBarProps) {
  const [tickerText, setTickerText] = useState("");

  useEffect(() => {
    const updateTicker = () => {
      // Filter only upcoming tournaments where start time is in the future
      const upcoming = tournaments.filter(
        (t) => t.status === "Upcoming" && new Date(t.startDateTime).getTime() > Date.now()
      );

      if (upcoming.length === 0) {
        setTickerText(
          isBengali
            ? "বুড়িরাম অর্গ - আমাদের পরবর্তী টুর্নামেন্টের জন্য সাথেই থাকুন!"
            : "BURIRAM ORG - Stay tuned for our upcoming tournaments!"
        );
        return;
      }

      // Format upcoming tournaments into marquee text
      const parts = upcoming.slice(0, 3).map((t) => {
        const timeStr = formatTimeBilingual(t.startDateTime, isBengali);
        const slotsLeft = t.totalSlots - t.takenSlots;
        const slotsLeftStr = isBengali ? convertToBengaliNumbers(slotsLeft) : slotsLeft;

        if (isBengali) {
          return `${t.category === "Champion Rush" ? "চ্যাম্পিয়ন রাশ" : t.category === "Scrims" ? "স্ক্রিমস" : "পেইড টুর্নামেন্ট"} - ${timeStr} | মাত্র ${slotsLeftStr}টি স্লট খালি আছে!`;
        } else {
          return `${t.category} @ ${timeStr} | Only ${slotsLeftStr} Slots Left!`;
        }
      });

      let prefix = "";
      if (isBengali) {
        prefix = "[পরবর্তী ম্যাচ] ";
      } else {
        prefix = "[NEXT MATCH] ";
      }

      const tickerParts = parts.join(" | ");
      setTickerText(`${prefix}${tickerParts}`);
    };

    updateTicker();
    
    // Set interval to keep sync active
    const interval = setInterval(updateTicker, 5000);
    return () => clearInterval(interval);
  }, [tournaments, isBengali]);

  return (
    <div className="w-full bg-violet-900/40 border-b border-violet-500/30 text-[10px] sm:text-xs h-8 overflow-hidden flex items-center select-none">
      <div className="whitespace-nowrap flex animate-marquee">
        <span className="inline-block px-4 font-medium text-violet-300 tracking-wide">
          {customOverride ? (
            <span className="flex items-center gap-2">
              <span className="bg-fuchsia-600 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                {isBengali ? "ঘোষণা" : "Alert"}
              </span>
              <span>{customOverride}</span>
              <span className="mx-4 text-violet-500/50">|</span>
              <span>{tickerText}</span>
            </span>
          ) : (
            tickerText
          )}
        </span>
        {/* Duplicate for seamless infinite loop scroll */}
        <span className="inline-block px-4 font-medium text-violet-300 tracking-wide">
          {customOverride ? (
            <span className="flex items-center gap-2">
              <span className="bg-fuchsia-600 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                {isBengali ? "ঘোষণা" : "Alert"}
              </span>
              <span>{customOverride}</span>
              <span className="mx-4 text-violet-500/50">|</span>
              <span>{tickerText}</span>
            </span>
          ) : (
            tickerText
          )}
        </span>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
