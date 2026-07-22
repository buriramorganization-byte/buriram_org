import React, { useEffect, useState } from "react";
import { Tournament } from "../types";
import { updateTournament } from "../services/firebaseService";
import { convertToBengaliNumbers } from "../utils/dateFormatter";

interface CountdownTimerProps {
  tournament: Tournament;
  isBengali: boolean;
  onFinished?: () => void;
}

export default function CountdownTimer({ tournament, isBengali, onFinished }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);
  const [isRoomActive, setIsRoomActive] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const startMs = new Date(tournament.startDateTime).getTime();
      const nowMs = Date.now();
      const difference = startMs - nowMs;

      if (tournament.status !== "Upcoming" || difference <= 0) {
        setIsRoomActive(true);
        setTimeLeft(null);

        if (tournament.status === "Upcoming" && difference <= 0) {
          updateTournament(tournament.id, { status: "Active" }).catch((err) => {
            console.error("Failed to automatically start tournament:", err);
          });
          if (onFinished) onFinished();
        }
        return;
      }

      setIsRoomActive(false);

      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formatNum = (num: number) => num < 10 ? `0${num}` : `${num}`;

      setTimeLeft({
        hours: formatNum(hours),
        minutes: formatNum(minutes),
        seconds: formatNum(seconds)
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);

    return () => clearInterval(interval);
  }, [tournament, onFinished]);

  if (isRoomActive || tournament.status !== "Upcoming") {
    if (tournament.status === "Completed") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 text-black font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-black"></span>
          {isBengali ? "ম্যাচ সমাপ্ত" : "MATCH ENDED"}
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-600 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/40 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
        {isBengali ? "ম্যাচ লাইভ" : "MATCH LIVE"}
      </div>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const { hours, minutes, seconds } = timeLeft;
  const hDisplay = isBengali ? convertToBengaliNumbers(hours) : hours;
  const mDisplay = isBengali ? convertToBengaliNumbers(minutes) : minutes;
  const sDisplay = isBengali ? convertToBengaliNumbers(seconds) : seconds;

  return (
    <div className="flex items-center gap-1 font-mono text-sm font-bold text-violet-400 bg-violet-950/40 border border-violet-800/30 px-3 py-1.5 rounded-md">
      <span>[</span>
      <span className="w-6 text-center">{hDisplay}</span>
      <span>:</span>
      <span className="w-6 text-center">{mDisplay}</span>
      <span>:</span>
      <span className="w-6 text-center">{sDisplay}</span>
      <span>]</span>
    </div>
  );
}
