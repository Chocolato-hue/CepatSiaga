"use client";

import { t } from "@/lib/i18n";
import { motion } from "motion/react";

export default function UrgencySection({ lang }: { lang: "en" | "id" }) {
  return (
    <section className="bg-[#F8F4EF] w-full py-24 border-t border-[#0A1628]/8">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="w-full flex flex-col md:flex-row gap-12 items-center"
        >
          <div className="flex-1">
            <h3 className="font-serif italic font-bold text-4xl md:text-5xl text-[#0A1628] leading-tight mb-6 tracking-tight">
              {t[lang].everySecondCounts}
            </h3>
            <p className="text-[#1C2B3A]/80 font-sans font-medium text-lg leading-relaxed mb-6">
              {t[lang].whoFact}
            </p>
            <div className="flex flex-col gap-2 mt-8 p-6 bg-white rounded-2xl border border-[#0A1628]/10 shadow-sm">
               <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#0082A6]">{t[lang].didYouKnow}</span>
               <p className="font-serif italic text-xl font-bold text-[#0A1628]">
                 {t[lang].goldenHour}
               </p>
            </div>
          </div>
          <div className="w-full md:w-1/3 aspect-square bg-[#0082A6] rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 text-white shadow-xl shadow-[#0082A6]/20">
            <span className="text-7xl md:text-8xl font-black font-sans tracking-tighter">80<span className="text-5xl font-mono">%</span></span>
            <span className="text-sm font-bold uppercase tracking-widest opacity-90 leading-tight font-sans">
              {t[lang].statsDeath}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
