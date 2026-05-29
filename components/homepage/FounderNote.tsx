"use client";

import { motion } from "motion/react";

export default function FounderNote({ lang }: { lang: "en" | "id" }) {
  return (
    <section className="bg-[#0A1628] w-full py-24">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center gap-8 text-[#F8F4EF]"
        >
          <div className="w-16 h-1 bg-[#0082A6] rounded-full"></div>
          <blockquote className="font-serif italic font-bold text-3xl md:text-5xl leading-tight">
            &quot;{lang === "en" ? "I want to increase the chance of my fellow Indonesian citizens' lives by just one percent." : "Saya ingin meningkatkan peluang hidup sesama warga Indonesia walau hanya satu persen."}&quot;
          </blockquote>
          
          <div className="flex flex-col gap-6 text-lg md:text-xl font-sans font-normal text-[#F8F4EF]/80 leading-relaxed max-w-3xl">
            <p>
              {lang === "en" 
                ? "I know how it feels to panic during unexpected moments, when our beloved's heartbeat drops during an unexpected time, and we don't know what to do."
                : "Saya tahu bagaimana rasanya panik di saat-saat tak terduga, ketika detak jantung orang yang kita cintai menurun, dan kita tidak tahu harus berbuat apa."}
            </p>
            <p>
              {lang === "en"
                ? "That's why I created this app. For people who don't know what to do or where to find nearby facilities, I hope it helps you a lot."
                : "Itulah alasan saya membuat aplikasi ini. Bagi orang-orang yang tidak tahu harus berbuat apa atau ke mana mencari fasilitas medis terdekat, saya harap ini dapat sangat membantu."}
            </p>
          </div>
          
          <div className="mt-4 flex flex-col items-center">
            <span className="font-sans font-semibold text-xl text-[#00B4D8]">Elena Anastasia Jaya</span>
            <span className="font-sans text-sm text-[#F8F4EF]/60 tracking-widest uppercase mt-1">Founder, CepatSiaga</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
