"use client";

import { useEffect, useState } from "react";

export default function ResponseTimer({ isRunning, finalTime, lang = "id" }: { isRunning: boolean; finalTime: number | null, lang?: "id" | "en" }) {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setMs(Date.now() - startTime);
      }, 10);
    } else if (!isRunning && finalTime !== null) {
      setTimeout(() => setMs(finalTime), 0);
    }
    return () => clearInterval(interval);
  }, [isRunning, finalTime]);

  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  
  return (
    <div className="flex flex-col items-end">
      <div className="font-mono text-2xl font-black text-[#FF3B30] tracking-tighter tabular-nums flex items-baseline gap-1">
        00:{seconds.toString().padStart(2, "0")}<span className="text-sm">{(Math.floor(milliseconds / 10)).toString().padStart(2, "0")}</span>
      </div>
      <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest text-right">
        {isRunning 
          ? (lang === "en" ? "Analyzing" : "Menganalisa")
          : (lang === "en" ? "AI Response Time" : "Waktu Respons AI")}
      </p>
    </div>
  );
}
