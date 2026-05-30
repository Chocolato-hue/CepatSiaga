"use client";

import { motion } from "motion/react";

export default function EmergencyScopeSection({ lang }: { lang: "en" | "id" }) {
  const scopes = [
  lang === "en" ? "Unconscious Person" : "Orang Tidak Sadar",
  lang === "en" ? "Difficulty Breathing" : "Sesak atau Sulit Bernapas",
  lang === "en" ? "Severe Bleeding" : "Pendarahan Berat",
  lang === "en" ? "Major Injury or Accident" : "Cedera atau Kecelakaan Berat",
  lang === "en" ? "Possible Stroke" : "Dugaan Stroke",
  lang === "en" ? "Choking" : "Tersedak",
  lang === "en" ? "Severe Panic or Distress" : "Panik atau Distres Berat"
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
              {lang === "en"
                ? "Built For The First Critical Minutes"
                : "Diciptakan untuk Menit-Menit Pertama yang Paling Kritis"}
            </h2>

            <p className="mt-6 text-[#F8F4EF]/80 text-lg leading-relaxed font-sans">
              {lang === "en"
                ? "Helping everyday people take the right first steps during a medical emergency."
                : "Membantu siapa saja mengambil langkah pertama yang tepat saat menghadapi keadaan darurat medis."}
            </p>

            <p className="mt-4 text-[#F8F4EF]/65 text-base leading-relaxed font-sans">
              {lang === "en"
                ? "Get immediate first-aid guidance, find nearby medical facilities, and prepare important patient information before professional help arrives."
                : "Dapatkan panduan pertolongan pertama, temukan fasilitas kesehatan terdekat, dan siapkan informasi penting pasien sebelum bantuan profesional tiba."}
            </p>

            <p className="mt-6 text-[#F8F4EF]/40 text-sm leading-relaxed font-sans border-t border-white/10 pt-6">
              {lang === "en"
                ? "Not a replacement for emergency services, doctors, or hospitals. Designed to support decisions during the first critical minutes while help is on the way."
                : "Bukan pengganti layanan darurat, dokter, atau rumah sakit. Dirancang untuk membantu pada menit-menit pertama yang sangat menentukan sambil menunggu bantuan tiba."}
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
              <div
                key={idx}
                className="flex items-center gap-5 text-[#F8F4EF]/90 border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]" />
                <span className="text-xl font-medium tracking-wide">
                  {scope}
                </span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}