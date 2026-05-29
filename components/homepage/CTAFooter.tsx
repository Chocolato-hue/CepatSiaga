"use client";

import { motion } from "motion/react";

export default function CTAFooter({ lang }: { lang: "en" | "id" }) {
  return (
    <footer className="w-full flex flex-col border-t border-[#0A1628]/8">
      {/* Top CTA (Cream) */}
      <div className="bg-[#F8F4EF] w-full py-32 text-center flex flex-col items-center justify-center px-6">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: false }}
           transition={{ duration: 0.6 }}
           className="max-w-3xl flex flex-col items-center"
        >
          <h2 className="font-serif italic font-bold text-4xl md:text-6xl text-[#0A1628] leading-tight mb-8">
            {lang === "en" ? "Ready to save a life?" : "Siap menyelamatkan nyawa?"}
          </h2>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-[#E63946] text-white px-10 py-5 rounded-full text-base font-sans font-bold tracking-widest hover:scale-105 hover:bg-[#c9303c] shadow-2xl transition-all uppercase"
          >
            {lang === "en" ? "Start Emergency Triage" : "Mulai Triase Darurat"}
          </button>
        </motion.div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-[#0A1628] border-t border-white/10 relative overflow-hidden">
        {/* ECG Line Animation */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/10 overflow-hidden">
           <motion.div
             initial={{ x: "-100%" }}
             animate={{ x: "100%" }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#00B4D8] to-transparent"
             style={{ filter: "blur(2px)" }}
           />
        </div>
        
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col gap-10">

          {/* Top Row */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

            {/* Left */}
            <div className="max-w-xl">
              <h3 className="text-[#F8F4EF] font-serif text-2xl italic font-semibold">
                CepatSiaga
              </h3>

              <p className="mt-4 text-[#F8F4EF]/72 text-sm leading-relaxed">
                {lang === "en"
                  ? "AI-assisted emergency guidance designed to help Indonesian families respond faster during critical medical situations."
                  : "Panduan darurat berbasis AI untuk membantu masyarakat Indonesia merespons situasi medis kritis dengan lebih cepat."}
              </p>

              <p className="mt-4 text-[#F8F4EF]/40 text-xs leading-relaxed">
                {lang === "en"
                  ? "CepatSiaga does not replace professional medical services, emergency responders, or clinical judgment."
                  : "CepatSiaga bukan pengganti layanan medis profesional, tenaga darurat, atau keputusan klinis."}
              </p>
            </div>

            {/* Right */}
            <div className="flex flex-col items-start md:items-end gap-4">

              {/* Trust Pills */}
              <div className="flex flex-wrap gap-3">

                <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[#F8F4EF]/70 text-xs tracking-wide">
                  {lang === "en"
                    ? "Emergency-First Design"
                    : "Desain Berbasis Situasi Darurat"}
                </div>

                <div className="px-4 py-2 rounded-full border border-[#00B4D8]/20 bg-[#00B4D8]/10 text-[#7DD3FC] text-xs tracking-wide">
                  SatuSehat Ecosystem Aligned
                </div>
                
                <div className="px-4 py-2 rounded-full border border-[#00B4D8]/20 bg-[#00B4D8]/10 text-[#7DD3FC] text-xs tracking-wide">
                  DRSABCD-Informed Emergency Guidance
                </div>

                <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[#F8F4EF]/70 text-xs tracking-wide">
                  Built Around Kemenkes Hospital Data
                </div>

                <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[#F8F4EF]/70 text-xs tracking-wide">
                  {lang === "en"
                    ? "Privacy-Conscious Architecture"
                    : "Arsitektur Berorientasi Privasi"}
                </div>

              </div>

              {/* Metadata */}
              <div className="pt-2 text-right text-[#F8F4EF]/30 text-[11px] uppercase tracking-[0.2em]">
                Built during Google #JuaraVibeCoding 2026
              </div>

            </div>
          </div>

          {/* Bottom Line */}
          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[#F8F4EF]/35 text-xs">

            <span>
              © 2026 CepatSiaga
            </span>

            <span className="text-center md:text-right">
              {lang === "en"
                ? "Designed for faster emergency response accessibility across Indonesia."
                : "Dirancang untuk meningkatkan akses respons darurat di Indonesia."}
            </span>

          </div>
        </div>
      </div>
    </footer>
  );
}
