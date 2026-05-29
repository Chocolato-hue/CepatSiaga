"use client";

import { useState, useEffect } from "react";
import { Mic, AlertTriangle, MapPin } from "lucide-react";
import { t } from "@/lib/i18n";
import { motion } from "motion/react";

export default function EmergencyInput({
  onSubmit,
  onSOS,
  lang,
  isAnalyzing = false,
  locationStatus = "detected",
  onLocationUpdate,
  onContinueWithoutLocation,
  dark = false,
}: {
  onSubmit: (text: string) => void;
  onSOS: () => void;
  lang: "id" | "en";
  isAnalyzing?: boolean;
  locationStatus?: string;
  onLocationUpdate?: (loc: { lat: number; lng: number }) => void;
  onContinueWithoutLocation?: () => void;
  dark?: boolean;
}) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(
        () =>
          setIsSecure(
            window.location.protocol === "https:" ||
              window.location.hostname === "localhost"
          ),
        0
      );
    }
  }, []);

  const handleVoiceInput = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert(
        lang === "en"
          ? "Microphone not accessible."
          : "Mikrofon tidak dapat diakses."
      );
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(
        lang === "en"
          ? "Browser does not support voice recognition."
          : "Browser tidak mendukung pengenalan suara."
      );
      return;
    }

    const recognition = new SR();
    recognition.lang = lang === "id" ? "id-ID" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech error:", e.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, staggerChildren: 0.1, delayChildren: 0.2 }}
      className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center px-4 relative z-10 mb-12"
    >
      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2 shadow-sm border ${
          dark
            ? "bg-red-500/15 text-red-300 border-red-500/30"
            : "bg-red-50 text-red-600 border-red-100"
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        {t[lang].everySecondCounts}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        className={`text-4xl md:text-5xl lg:text-6xl text-center mb-4 font-serif italic tracking-tighter drop-shadow-sm ${
          dark ? "text-white" : "text-slate-800"
        }`}
      >
        {t[lang].heroTitle}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        className={`mb-10 text-center max-w-lg font-medium text-lg leading-relaxed ${
          dark ? "text-white/65" : "text-slate-600 opacity-80"
        }`}
      >
        {t[lang].heroSubtitle}
      </motion.p>

      {locationStatus === "denied" && onLocationUpdate && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: 10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`w-full mb-6 p-5 rounded-3xl shadow-sm text-center border ${

            dark
              ? "bg-amber-500/10 border-amber-500/25"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div
            className={`flex items-center justify-center gap-2 mb-2 ${
              dark ? "text-amber-300" : "text-amber-700"
            }`}
          >
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold">
              {lang === "en"
                ? "Location Access Denied"
                : "Akses Lokasi Ditolak"}
            </h3>
          </div>
          <p
            className={`text-sm font-medium mb-4 ${
              dark ? "text-amber-300/80" : "text-amber-600"
            }`}
          >
            {lang === "en"
              ? "Location access is needed to find nearby emergency facilities."
              : "Akses lokasi dibutuhkan untuk mencari fasilitas darurat terdekat."}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) =>
                      onLocationUpdate({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                      }),
                    () =>
                      alert(
                        lang === "en"
                          ? "Still denied. Please enable in your browser settings."
                          : "Masih ditolak. Harap izinkan di pengaturan browser Anda."
                      ),
                    { enableHighAccuracy: false }
                  );
                }
              }}
              className={`border font-bold px-4 py-2.5 rounded-full text-xs uppercase tracking-widest transition-colors ${
                dark
                  ? "bg-white/10 border-amber-400/30 text-amber-300 hover:bg-white/15"
                  : "bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
              }`}
            >
              {lang === "en"
                ? "Retry Location Access"
                : "Coba Akses Lokasi Lagi"}
            </button>
            <button
              onClick={() => {
                if (onContinueWithoutLocation) {
                  onContinueWithoutLocation();
                }
              }}
              className={`border font-bold px-4 py-2.5 rounded-full text-xs uppercase tracking-widest transition-colors ${
                dark
                  ? "bg-amber-500/15 border-amber-400/25 text-amber-300 hover:bg-amber-500/25"
                  : "bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200"
              }`}
            >
              {lang === "en"
                ? "Continue Without Nearby Facilities"
                : "Lanjut Tanpa Fasilitas Terdekat"}
            </button>
          </div>
        </motion.div>
      )}

      <div className="w-full relative px-2 md:px-0">
        <motion.div
          animate={{
            boxShadow:
              text.length > 0
                ? "0px 0px 0px 0px rgba(0, 180, 216, 0)"
                : [
                    "0px 0px 0px 0px rgba(0, 180, 216, 0.2)",
                    "0px 0px 24px 12px rgba(0, 180, 216, 0.12)",
                    "0px 0px 0px 0px rgba(0, 180, 216, 0)",
                  ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-3xl"
          style={{ margin: "4px" }}
        />

        <form
          onSubmit={handleSubmit}
          className="w-full relative shadow-2xl rounded-3xl overflow-hidden z-10 border bg-white border-blue-50"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (text.trim() && !isAnalyzing) {
                  onSubmit(text);
                }
              }
            }}
            placeholder={t[lang].heroInputPlaceholder}
            className="w-full p-6 md:p-8 pb-24 text-lg md:text-xl focus:outline-none resize-none min-h-[220px] transition-all font-medium placeholder:text-slate-400 text-slate-800 bg-transparent"
          />

          <div
            className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex justify-between items-center z-20 bg-white"
          >
            <button
              type="button"
              onClick={onSOS}
              className="rounded-full px-6 py-3 font-bold shadow-sm transition-all active:scale-95 text-xs tracking-widest uppercase flex items-center gap-2 group hidden md:flex border bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
            >
              <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {lang === "en" ? "SOS Panic" : "SOS Panik"}
            </button>

            <button
              type="submit"
              disabled={
                (!text.trim() && !isListening) ||
                isAnalyzing ||
                locationStatus === "loading"
              }
              className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-[11px] md:text-xs transition-all flex items-center justify-center bg-[#0082A6] text-white hover:bg-[#00B4D8] hover:scale-105 shadow-md shadow-[#0082A6]/30 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed ml-auto"
            >
              {locationStatus === "loading"
                ? t[lang].locLoading
                : isAnalyzing
                ? lang === "en"
                  ? "ANALYZING..."
                  : "MENGANALISA..."
                : t[lang].heroSubmit}
            </button>
          </div>
        </form>
      </div>

      {/* Mobile SOS */}
      <button
        type="button"
        onClick={onSOS}
        className={`mt-6 w-full max-w-[200px] rounded-full px-6 py-3 font-bold shadow-sm active:scale-95 text-xs tracking-widest uppercase flex items-center justify-center gap-2 md:hidden border ${
          dark
            ? "bg-red-500/15 text-red-300 border-red-500/30"
            : "bg-red-50 text-red-600 border-red-200"
        }`}
      >
        <AlertTriangle className="w-4 h-4" />
        {lang === "en" ? "SOS Panic" : "SOS Panik"}
      </button>
    </motion.div>
  );
}
