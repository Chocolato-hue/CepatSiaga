"use client";

import { motion } from "motion/react";

export default function ResearchSection({ lang }: { lang: "en" | "id" }) {
  return (
    <section className="bg-[#0A1628] w-full py-24 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16 border-b border-[#1C2B3A] pb-8">
          <h2 className="font-serif italic font-bold text-4xl md:text-5xl text-[#F8F4EF] mb-4">
            {lang === "en" ? "The Clinical Data" : "Data Klinis"}
          </h2>
          <p className="font-sans text-[#00B4D8] font-semibold tracking-widest uppercase text-sm">
            {lang === "en" ? "Why rapid intervention matters" : "Mengapa intervensi cepat penting"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5 }}
            className="bg-[#1C2B3A] p-8 rounded-xl border border-[#304156] flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-xs text-[#00B4D8] tracking-widest uppercase mb-4 block">Source: WHO</span>
              <h3 className="font-serif italic font-bold text-2xl text-[#F8F4EF] mb-4">Traffic & Delays</h3>
              <p className="font-sans text-[#F8F4EF]/70 leading-relaxed">
                {lang === "en" 
                  ? "In major Indonesian cities, average ambulance response times can exceed 30+ minutes during gridlock." 
                  : "Di kota besar Indonesia, waktu respons ambulans rata-rata bisa melebihi 30+ menit saat macet lalu lintas."}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#304156]">
              <span className="font-mono text-4xl text-[#E63946] font-bold">30+ <span className="text-xl">min</span></span>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#1C2B3A] p-8 rounded-xl border border-[#304156] flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-xs text-[#00B4D8] tracking-widest uppercase mb-4 block">Source: PERKI</span>
              <h3 className="font-serif italic font-bold text-2xl text-[#F8F4EF] mb-4">Cardiac Arrest</h3>
              <p className="font-sans text-[#F8F4EF]/70 leading-relaxed">
                {lang === "en" 
                  ? "Without immediate CPR and first aid, survival chances drop drastically for every minute lost." 
                  : "Tanpa CPR dan P3K instan, peluang bertahan hidup turun drastis setiap detiknya."}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#304156]">
              <span className="font-mono text-4xl text-[#E63946] font-bold">10<span className="text-xl">% / min</span></span>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#1C2B3A] p-8 rounded-xl border border-[#304156] flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-xs text-[#00B4D8] tracking-widest uppercase mb-4 block">Source: Kemenkes RI</span>
              <h3 className="font-serif italic font-bold text-2xl text-[#F8F4EF] mb-4">First-Aid Necessity</h3>
              <p className="font-sans text-[#F8F4EF]/70 leading-relaxed">
                {lang === "en" 
                  ? "Bystander intervention before medical transport arrives significantly improves clinical outcomes upon ER admission." 
                  : "Intervensi orang sekitar sebelum paramedis tiba sangat meningkatkan kesembuhan saat sampai di IGD."}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#304156]">
              <span className="font-mono text-lg text-[#00B4D8] font-bold uppercase tracking-widest">Crucial Action</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
