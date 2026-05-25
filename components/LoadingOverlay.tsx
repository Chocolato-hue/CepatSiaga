"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const phrases = {
  en: [
    "Take a deep breath. We are analyzing the situation to give you immediate first-aid instructions...",
    "Please stay calm...",
    "We are analyzing the emergency...",
    "Preparing immediate instructions..."
  ],
  id: [
    "Tarik napas dalam-dalam. Kami sedang menganalisis kondisi darurat untuk memberikan panduan P3K segera...",
    "Mohon tetap tenang...",
    "Kami sedang menganalisis situasi darurat...",
    "Menyiapkan instruksi segera..."
  ]
};

export default function LoadingOverlay({ lang = 'id' }: { lang?: "en" | "id" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases[lang].length);
    }, 3000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#D8F8FF] transition-opacity duration-500 animate-in fade-in">
      <div className="flex flex-col items-center max-w-2xl text-center p-8 bg-white/50 backdrop-blur-md rounded-3xl shadow-xl">
         <motion.div
           animate={{ scale: [1, 1.1, 1] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           className="w-24 h-24 mb-6 bg-[#0082A6]/10 rounded-full flex items-center justify-center"
         >
           <span className="text-4xl">🤍</span>
         </motion.div>
        <span className="text-3xl font-serif italic font-black text-[#0082A6] tracking-tighter mb-8">CepatSiaga.</span>
        <div className="h-24 relative w-full overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-slate-800 font-medium tracking-wide text-lg sm:text-xl absolute max-w-lg leading-relaxed"
              >
                {phrases[lang][index]}
              </motion.p>
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
