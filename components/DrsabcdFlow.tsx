"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, ArrowRight, ShieldAlert, PhoneCall, Activity, HeartPulse } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import HeartRateMonitor from "./HeartRateMonitor";

interface EmergencyModeProps {
  lang: "id" | "en";
  onComplete: () => void;
}

export default function EmergencyMode({ lang, onComplete }: EmergencyModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const steps = [
    {
      id: "D",
      title: lang === "en" ? "D - Danger" : "D - Danger (Bahaya)",
      instruction: lang === "en" 
        ? "Ensure the environment is safe before approaching the patient. Watch for traffic, electricity, fire, or water hazards." 
        : "Pastikan area aman sebelum mendekati pasien. Perhatikan bahaya lalu lintas, listrik, api, atau air.",
      icon: ShieldAlert,
      color: "bg-red-600",
    },
    {
      id: "R",
      title: lang === "en" ? "R - Response" : "R - Response (Respon)",
      instruction: lang === "en"
        ? "Check if the person responds. Tap their shoulders gently and call their name loudly."
        : "Cek respon pasien. Tepuk bahunya dengan perlahan dan panggil namanya dengan lantang.",
      icon: Activity,
      color: "bg-orange-600",
    },
    {
      id: "S",
      title: lang === "en" ? "S - Send for Help" : "S - Send for Help (Cari Bantuan)",
      instruction: lang === "en"
        ? "Call 119 immediately or shout for nearby help."
        : "Segera hubungi 119 atau teriak minta tolong ke orang sekitar.",
      icon: PhoneCall,
      color: "bg-[#FF3B30]",
    },
    {
      id: "A",
      title: lang === "en" ? "A - Airway" : "A - Airway (Jalan Napas)",
      instruction: lang === "en"
        ? "Open their airway. Gently tilt their head back and lift their chin."
        : "Buka jalan napas. Tengadahkan kepala perlahan dan angkat dagunya.",
      icon: ShieldAlert,
      color: "bg-amber-600",
    },
    {
      id: "B",
      title: lang === "en" ? "B - Breathing" : "B - Breathing (Pernapasan)",
      instruction: lang === "en"
        ? "Check breathing for 10 seconds. Look at the chest, listen for breaths."
        : "Cek pernapasan selama 10 detik. Lihat pergerakan dada dan dengar suara napas.",
      icon: Activity,
      color: "bg-teal-600",
    },
    {
      id: "C",
      title: lang === "en" ? "C - CPR" : "C - CPR (RJP)",
      instruction: lang === "en"
        ? "If not breathing normally, start CPR. 30 chest compressions, then 2 rescue breaths. Push hard and fast."
        : "Jika tidak bernapas normal, mulai RJP/CPR. 30 kompresi dada, diikuti 2 napas buatan. Tekan kuat dan cepat.",
      icon: HeartPulse,
      color: "bg-red-700",
    },
    {
      id: "D",
      title: lang === "en" ? "D - Defibrillation" : "D - Defibrillation (AED)",
      instruction: lang === "en"
        ? "If an AED is available, turn it on and follow the voice prompts immediately."
        : "Jika ada AED, nyalakan dan segera ikuti instruksi suaranya.",
      icon: HeartPulse,
      color: "bg-rose-600",
    }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!synthRef.current || isMuted) return;
    
    if (synthRef.current.speaking || synthRef.current.pending) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "en" ? "en-US" : "id-ID";
    
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
       const langPrefix = lang === "en" ? "en" : "id";
       const voice = voices.find(v => v.lang.startsWith(langPrefix));
       if (voice) {
         utterance.voice = voice;
       }
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (steps[currentStep]) {
      speak(steps[currentStep].instruction);
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isMuted, lang]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const current = steps[currentStep];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] text-white flex flex-col p-6 md:p-12 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 pointer-events-none z-0 opacity-40">
        <HeartRateMonitor />
      </div>

      <div className="relative z-10 flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
          <h1 className="font-bold tracking-widest uppercase text-red-500">
            {lang === "en" ? "EMERGENCY PROTOCOL ACTIVE" : "PROTOKOL DARURAT AKTIF"}
          </h1>
        </div>
        
        <button 
          onClick={() => {
            setIsMuted(!isMuted);
            if (!isMuted && synthRef.current) {
               synthRef.current.cancel();
            } else if (isMuted && steps[currentStep]) {
               speak(steps[currentStep].instruction);
            }
          }}
          className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center w-full"
          >
            <div className={`w-28 h-28 ${current.color} rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(255,0,0,0.3)]`}>
              <Icon className="w-14 h-14 text-white" />
            </div>

            <span className="text-[#FF3B30] font-black text-6xl md:text-8xl mb-4 font-serif italic">
              {current.id}
            </span>

            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-8">
              {current.title.substring(4)}
            </h2>

            <p className="text-2xl md:text-4xl text-slate-300 font-medium leading-normal max-w-3xl">
              {current.instruction}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 max-w-4xl mx-auto w-full flex flex-col gap-4">
        <button
          onClick={handleNext}
          className="w-full bg-[#FF3B30] hover:bg-red-700 text-white py-6 rounded-2xl text-2xl md:text-3xl font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,59,48,0.3)]"
        >
          {currentStep === steps.length - 1 
            ? (lang === "en" ? "Complete Protocol" : "Selesai") 
            : (lang === "en" ? "Next Step" : "Langkah Berikutnya")}
          <ArrowRight className="w-8 h-8" />
        </button>
        
        <div className="flex justify-center gap-2 mt-4">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep ? "w-12 bg-[#FF3B30]" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
