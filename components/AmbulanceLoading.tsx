"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const phrases = {
  en: [
    "Please take a breath...",
    "We are with you...",
    "Finding nearby facilities...",
    "Preparing guidance...",
    "Analyzing emergency...",
    "Optimizing recommendations..."
  ],
  id: [
    "Tarik napas perlahan...",
    "Kami ada bersama Anda...",
    "Mencari fasilitas terdekat...",
    "Menyiapkan panduan...",
    "Menganalisis kondisi darurat...",
    "Mengoptimalkan rekomendasi..."
  ]
};

export default function AmbulanceLoading({ lang = 'id' }: { lang?: "en" | "id" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases[lang].length);
    }, 2500);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#D8F8FF] transition-opacity duration-500 animate-in fade-in">
      <div className="flex flex-col items-center max-w-2xl text-center p-8">
         <motion.div
           animate={{ scale: [1, 1.15, 1], filter: ["drop-shadow(0 0 10px rgba(255,255,255,0.8))", "drop-shadow(0 0 30px rgba(255,255,255,1))", "drop-shadow(0 0 10px rgba(255,255,255,0.8))"] }}
           transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
           className="w-20 h-20 mb-6 bg-white/40 border border-white/60 blur-[1px] backdrop-blur-md rounded-full flex items-center justify-center shadow-lg"
         >
           <span className="text-4xl mt-1 blur-none">🤍</span>
         </motion.div>
         
        <h2 className="text-2xl sm:text-3xl font-serif italic font-black text-[#0082A6] tracking-tight mb-4 drop-shadow-sm">CepatSiaga.</h2>
        
        <div className="min-h-[60px] relative w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-[#005B75] font-bold tracking-wide text-base sm:text-lg absolute max-w-lg leading-snug drop-shadow-sm px-4"
              >
                {phrases[lang][index]}
              </motion.p>
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
