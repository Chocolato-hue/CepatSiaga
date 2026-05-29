'use client';

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export default function FeaturesSection({
  lang,
}: {
  lang: "en" | "id";
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const steps = [
    {
      number: "01",

      title:
        lang === "en"
          ? "Describe the Emergency"
          : "Jelaskan Situasi Darurat",

      desc:
        lang === "en"
          ? "Describe symptoms or situations naturally. CepatSiaga analyzes urgency levels and critical response needs within seconds."
          : "Jelaskan gejala atau situasi secara alami. CepatSiaga menganalisis tingkat urgensi dan kebutuhan respons kritis dalam hitungan detik.",

      accent: "from-[#00B4D8]/20 to-transparent",
    },

    {
      number: "02",

      title:
        lang === "en"
          ? "Receive Immediate Guidance"
          : "Dapatkan Panduan Langsung",

      desc:
        lang === "en"
          ? "Step-by-step first-aid guidance appears instantly while waiting for professional emergency assistance."
          : "Panduan pertolongan pertama langkah demi langkah muncul secara instan sambil menunggu bantuan medis profesional.",

      accent: "from-[#E63946]/20 to-transparent",
    },

    {
      number: "03",

      title:
        lang === "en"
          ? "Find the Fastest Available Care"
          : "Temukan Layanan Medis Tercepat",

      desc:
        lang === "en"
          ? "Nearby hospitals and emergency facilities are prioritized based on urgency, accessibility, and estimated response speed."
          : "Rumah sakit dan fasilitas darurat terdekat diprioritaskan berdasarkan urgensi, aksesibilitas, dan estimasi kecepatan respons.",

      accent: "from-[#0082A6]/20 to-transparent",
    },

    {
      number: "04",

      title:
        lang === "en"
          ? "Generate Emergency Medical Summary"
          : "Buat Ringkasan Medis Darurat",

      desc:
        lang === "en"
          ? "Structured emergency summaries are automatically prepared for hospitals, responders, or accompanying family members."
          : "Ringkasan medis darurat terstruktur dibuat secara otomatis untuk rumah sakit, petugas, atau anggota keluarga pendamping.",

      accent: "from-[#7DD3FC]/20 to-transparent",

      preview: true,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#F8F4EF] py-32 border-t border-[#0A1628]/8">

      {/* Ambient Glow */}
      <motion.div
        animate={{
          opacity: [0.02, 0.04, 0.02],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0082A6,transparent_40%)]"
      />

      {/* Subtle Grid */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0A1628_1px,transparent_1px),linear-gradient(to_bottom,#0A1628_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div ref={ref} className="max-w-5xl mx-auto px-6 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.7 }}
          className="text-center mb-28"
        >
          <span className="uppercase tracking-[0.35em] text-xs text-[#0082A6] font-medium">
            {lang === "en"
              ? "Emergency Response Flow"
              : "Alur Respons Darurat"}
          </span>

          <h2 className="mt-6 font-serif italic font-bold text-4xl md:text-6xl text-[#0A1628] leading-tight">
            {lang === "en"
              ? "When Every Minute Matters"
              : "Saat Setiap Menit Sangat Berarti"}
          </h2>

          <p className="mt-7 text-[#0A1628]/65 text-lg leading-relaxed max-w-2xl mx-auto">
            {lang === "en"
              ? "Designed to help people navigate medical emergencies with faster guidance, coordinated response, and clearer communication."
              : "Dirancang untuk membantu masyarakat menghadapi situasi medis darurat dengan panduan lebih cepat, respons terkoordinasi, dan komunikasi yang lebih jelas."}
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">

          {/* Vertical Line */}
          <div className="absolute left-[28px] top-0 bottom-0 w-px bg-gradient-to-b from-[#0082A6]/20 via-[#0A1628]/10 to-transparent hidden md:block" />

          <div className="flex flex-col gap-28">

            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-120px" }}
                transition={{
                  duration: 0.8,
                  delay: idx * 0.08,
                  ease: "easeOut",
                }}
                className="relative"
              >
                <div className="grid md:grid-cols-[80px_1fr] gap-8 md:gap-14 items-start">

                  {/* Step Marker */}
                  <div className="relative flex items-center justify-center">

                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(0,180,216,0)",
                          "0 0 25px rgba(0,180,216,0.15)",
                          "0 0 0px rgba(0,180,216,0)",
                        ],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: idx * 0.6,
                      }}
                      className="w-14 h-14 rounded-full border border-[#0A1628]/10 bg-white backdrop-blur-xl flex items-center justify-center shadow-sm"
                    >
                      <span className="font-serif italic text-lg text-[#0A1628]/70">
                        {step.number}
                      </span>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="relative">

                    {/* Ambient Accent */}
                    <div
                      className={`absolute -inset-6 bg-gradient-to-r ${step.accent} blur-3xl opacity-40`}
                    />

                    <div className="relative">

                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-2xl md:text-3xl font-semibold text-[#0A1628] tracking-tight"
                      >
                        {step.title}
                      </motion.h3>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="mt-5 text-[#0A1628]/65 text-lg leading-relaxed max-w-2xl"
                      >
                        {step.desc}
                      </motion.p>

                      {/* Medical Summary Card */}
                      {step.preview && (
                        <motion.div
                          initial={{ opacity: 0, y: 24, scale: 0.98 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                          }}
                          whileHover={{
                            y: -4,
                          }}
                          className="mt-12 max-w-md rounded-3xl border border-[#0A1628]/10 bg-white/90 backdrop-blur-2xl shadow-[0_25px_80px_rgba(10,22,40,0.08)] overflow-hidden"
                        >

                          {/* Top */}
                          <div className="px-5 py-4 border-b border-[#0A1628]/5 flex items-center justify-between">

                            <span className="text-sm font-semibold text-[#0A1628]">
                              Emergency Medical Summary
                            </span>

                            <motion.div
                              animate={{
                                opacity: [0.5, 1, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                              }}
                              className="w-2 h-2 rounded-full bg-[#E63946]"
                            />
                          </div>

                          {/* Body */}
                          <div className="p-5 flex flex-col gap-5 text-sm">

                            <div>
                              <p className="text-[#0A1628]/40 uppercase tracking-wider text-[10px]">
                                Possible Condition
                              </p>

                              <p className="text-[#0A1628] font-medium mt-1">
                                Severe Head Trauma
                              </p>
                            </div>

                            <div>
                              <p className="text-[#0A1628]/40 uppercase tracking-wider text-[10px]">
                                Reported Symptoms
                              </p>

                              <ul className="mt-2 flex flex-col gap-1 text-[#0A1628]/70">
                                <li>• Loss of consciousness</li>
                                <li>• Heavy bleeding</li>
                                <li>• Difficulty responding</li>
                              </ul>
                            </div>

                            <div>
                              <p className="text-[#0A1628]/40 uppercase tracking-wider text-[10px]">
                                Recommended Action
                              </p>

                              <p className="mt-1 text-[#E63946] font-medium">
                                Immediate ER evaluation required
                              </p>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
