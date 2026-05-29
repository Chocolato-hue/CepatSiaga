"use client";

import { motion } from "motion/react";

export default function EmergencyScopeSection({ lang }: { lang: "en" | "id" }) {
  const scopes = [
    lang === "en" ? "Loss of Consciousness" : "Hilang Kesadaran",
    lang === "en" ? "Breathing Emergencies" : "Gangguan Pernapasan",
    lang === "en" ? "Severe Bleeding & Trauma" : "Pendarahan & Trauma Berat",
    lang === "en" ? "Burns & Accidents" : "Luka Bakar & Kecelakaan",
    lang === "en" ? "Stroke Symptoms" : "Gejala Stroke",
    lang === "en" ? "Choking Situations" : "Tersedak",
    lang === "en" ? "Panic & Acute Distress" : "Kepanikan & Stres Akut"
  ];

  return (
    <section className="bg-[#0A1628] w-full py-28 border-t border-white/10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-20 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="font-serif italic font-bold text-4xl md:text-5xl text-[#F8F4EF] leading-tight">
              {lang === "en" ? "Built For The First Critical Minutes" : "Diciptakan Untuk Menit-Menit Pertama yang Kritis"}
            </h2>
            <p className="mt-6 text-[#F8F4EF]/70 text-lg leading-relaxed font-sans">
              {lang === "en"
                ? "CepatSiaga focuses strictly on acute emergency-response assistance. We provide actionable first-aid guidance, intelligent facility routing, and structured medical summaries for immediate response."
                : "CepatSiaga berfokus khusus pada bantuan respons darurat akut. Kami menyediakan panduan pertolongan pertama yang dapat ditindaklanjuti, perutean fasilitas cerdas, dan ringkasan medis terstruktur untuk respons segera."}
            </p>
            <p className="mt-6 text-[#F8F4EF]/40 text-sm leading-relaxed font-sans border-t border-white/10 pt-6">
              {lang === "en" 
                ? "* Not intended for chronic healthcare, general medical advice, or long-term consultation."
                : "* Bukan ditujukan untuk perawatan kesehatan kronis, saran medis umum, atau konsultasi jangka panjang."}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col gap-5"
          >
            {scopes.map((scope, idx) => (
              <div key={idx} className="flex items-center gap-5 text-[#F8F4EF]/90 border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]" />
                <span className="text-xl font-medium tracking-wide">{scope}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
