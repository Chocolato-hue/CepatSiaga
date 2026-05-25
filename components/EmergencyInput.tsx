"use client";

import { useState, useEffect } from "react";
import { Mic, AlertTriangle } from "lucide-react";
import { t } from "@/lib/i18n";
import { motion } from "motion/react";

export default function EmergencyInput({ onSubmit, onSOS, lang, isAnalyzing = false, locationStatus = "detected" }: { onSubmit: (text: string) => void, onSOS: () => void, lang: "id" | "en", isAnalyzing?: boolean, locationStatus?: string }) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => setIsSecure(window.location.protocol === 'https:' || window.location.hostname === 'localhost'), 0);
    }
  }, []);

  const handleVoiceInput = async () => {
    // Step 1: explicitly request mic permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert(lang === "en" ? "Microphone not accessible." : "Mikrofon tidak dapat diakses.");
      return;
    }

    // Step 2: initialize SpeechRecognition
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(lang === "en" ? "Browser does not support voice recognition." : "Browser tidak mendukung pengenalan suara.");
      return;
    }

    const recognition = new SR();
    recognition.lang = lang === "id" ? 'id-ID' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Step 3: set handlers BEFORE calling start()
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      console.error('Speech error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    // Step 4: start AFTER all handlers are set
    recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center px-4 relative z-10 w-full mb-12">
      <div className="bg-red-50 text-[#FF3B30] border border-red-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse"></div>
        {t[lang].everySecondCounts}
      </div>
      
      <h1 className="text-4xl md:text-5xl lg:text-6xl text-center mb-4 font-serif italic tracking-tighter text-slate-800">
        {t[lang].heroTitle}
      </h1>
      <p className="opacity-70 mb-10 text-center max-w-lg font-medium text-lg leading-relaxed text-slate-600">
        {t[lang].heroSubtitle}
      </p>

      <div className="w-full relative px-2 md:px-0">
        <motion.div
           animate={{
             boxShadow: text.length > 0 ? "0px 0px 0px 0px rgba(0, 130, 166, 0)" : ["0px 0px 0px 0px rgba(0, 130, 166, 0.4)", "0px 0px 20px 10px rgba(0, 130, 166, 0)", "0px 0px 0px 0px rgba(0, 130, 166, 0)"],
           }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="absolute inset-0 rounded-3xl"
           style={{ margin: "4px" }} 
        ></motion.div>
        
        <form onSubmit={handleSubmit} className="w-full relative shadow-2xl rounded-3xl overflow-hidden bg-white border border-[#0082A6]/20 z-10">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (text.trim() && !isAnalyzing) {
                  onSubmit(text);
                }
              }
            }}
            placeholder={t[lang].heroInputPlaceholder}
            className="w-full bg-white p-6 md:p-8 pb-24 text-lg md:text-xl focus:outline-none resize-none min-h-[220px] transition-all placeholder:text-slate-300 font-medium text-slate-800"
          />

          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent flex justify-between items-center z-20">
            <button 
              type="button"
              onClick={onSOS}
              className="bg-red-50 hover:bg-red-100 text-[#FF3B30] border border-red-200 rounded-full px-6 py-3 font-bold shadow-sm transition-all active:scale-95 text-xs tracking-widest uppercase flex items-center gap-2 group hidden md:flex"
            >
              <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {lang === "en" ? "SOS Panic" : "SOS Panik"}
            </button>

            <button
              type="submit"
              disabled={(!text.trim() && !isListening) || isAnalyzing || locationStatus === "loading"}
              className={`px-8 py-4 rounded-full font-black uppercase tracking-widest text-[11px] md:text-xs transition-all flex items-center justify-center bg-[#0082A6] text-white hover:scale-105 shadow-md shadow-[#0082A6]/30 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed ml-auto`}
            >
              {locationStatus === "loading" ? t[lang].locLoading : isAnalyzing ? (lang === 'en' ? "ANALYZING..." : "MENGANALISA...") : t[lang].heroSubmit}
            </button>
          </div>
        </form>
      </div>
      
      {/* Mobile SOS Button - visible only on small screens below the form */}
      <button 
        type="button"
        onClick={onSOS}
        className="mt-6 w-full max-w-[200px] bg-red-50 text-[#FF3B30] border border-red-200 rounded-full px-6 py-3 font-bold shadow-sm active:scale-95 text-xs tracking-widest uppercase flex items-center justify-center gap-2 md:hidden"
      >
        <AlertTriangle className="w-4 h-4" />
        {lang === "en" ? "SOS Panic" : "SOS Panik"}
      </button>
    </div>
  );
}
