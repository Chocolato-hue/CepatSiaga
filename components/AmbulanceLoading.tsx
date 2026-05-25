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

export default function AmbulanceLoading({ lang = 'id' }: { lang?: "en" | "id" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases[lang].length);
    }, 3000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-black min-h-[50vh]">
      <motion.div 
        className="text-6xl mb-6 relative"
        animate={{ 
          x: ["-50%", "150%"]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ width: "200px" }}
      >
        🚑
      </motion.div>
      <div className="h-20 relative w-full overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="font-medium tracking-wide text-lg text-slate-600 absolute max-w-lg text-center"
            >
              {phrases[lang][index]}
            </motion.p>
          </AnimatePresence>
      </div>
    </div>
  );
}
