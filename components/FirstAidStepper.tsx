"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, ArrowRight, CheckCircle2 } from "lucide-react";

interface FirstAidStepperProps {
  steps: string[];
  documents?: string[];
  lang: "id" | "en";
  onHome?: () => void;
}

export default function FirstAidStepper({ steps, documents = [], lang, onHome }: FirstAidStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

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
    
    // Choose appropriate voice if possible
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
       const langPrefix = lang === "en" ? "en" : "id";
       const voice = voices.find(v => v.lang.startsWith(langPrefix));
       if (voice) {
         utterance.voice = voice;
       }
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
    synthRef.current.speak(utterance);
  };

  const stepsKey = steps.join("|");
  useEffect(() => {
    // Clear audio queue whenever a step changes
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    if (steps[currentStep]) {
      speak(steps[currentStep]);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isMuted, stepsKey, lang]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
      
      if (currentStep + 1 === steps.length) {
        setTimeout(() => {
          document.getElementById('facility-cards-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  };

  const isCompleted = currentStep === steps.length;

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700">{lang === 'en' ? 'Step-by-Step Instructions' : 'Instruksi Langkah Demi Langkah'}</h3>
        <button 
          onClick={() => {
            setIsMuted(!isMuted);
            if (!isMuted && synthRef.current) {
               synthRef.current.cancel();
            } else if (isMuted && steps[currentStep]) {
               speak(steps[currentStep]);
            }
          }}
          className={`p-2.5 rounded-full transition-colors border ${isMuted ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'}`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {!isCompleted ? (
        <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-300">
          <div className="text-xs font-bold text-[#0082A6] mb-3 tracking-widest uppercase bg-[#D8F8FF] w-fit px-3 py-1 rounded-full">
            {lang === 'en' ? `Step ${currentStep + 1} of ${steps.length}` : `Langkah ${currentStep + 1} dari ${steps.length}`}
          </div>
          <p className="font-serif text-2xl lg:text-3xl italic mx-auto leading-relaxed text-slate-800 mb-8 flex-1 mt-4">
            &quot;{steps[currentStep]}&quot;
          </p>
          <button 
            onClick={handleNext}
            className="w-full bg-[#0082A6] text-white rounded-xl py-4 uppercase text-sm font-black tracking-widest flex items-center justify-center gap-2 hover:bg-[#006d8b] transition-colors shadow-md shadow-[#0082A6]/20 mt-4"
          >
            {lang === 'en' ? 'Next Step' : 'Langkah Berikutnya'} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700 slide-in-from-bottom-4 py-6">
          <div className="w-20 h-20 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h4 className="font-serif italic font-black text-2xl lg:text-3xl text-slate-800 mb-4 text-center">{lang === 'en' ? 'Guide Completed' : 'Panduan Selesai'}</h4>
          <p className="text-slate-500 font-medium text-center mb-8 max-w-sm">
            {lang === 'en' 
              ? "You've done your best. Please find the nearest healthcare facility below and head there immediately." 
              : "Kamu sudah melakukan pertolongan pertama. Silakan cari fasilitas kesehatan terdekat di bawah ini dan segera menuju ke sana."}
          </p>

          {documents && documents.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 mb-8 text-left w-full">
              <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                📋 {lang === 'en' ? 'Prepare Documents' : 'Siapkan Dokumen'}
              </h5>
              <p className="text-xs text-amber-700/80 mb-4">
                {lang === 'en' 
                  ? 'Recommended to bring for administration:' 
                  : 'Sambil jalan, usahakan bawa dokumen berikut untuk administrasi:'}
              </p>
              <ul className="space-y-3">
                {documents.map((doc, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-amber-900 border-b border-amber-900/5 pb-2 last:border-0 last:pb-0">
                    <div className="w-5 h-5 rounded-md bg-white border border-amber-300 shadow-sm flex items-center justify-center">
                       <div className="w-2.5 h-2.5 bg-amber-400 rounded-[2px]"></div>
                    </div>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onHome && (
            <button
              onClick={onHome}
              className="w-full bg-slate-100 text-slate-700 rounded-xl py-4 uppercase text-sm font-black tracking-widest hover:bg-slate-200 transition-colors"
            >
              {lang === 'en' ? 'Restart Application' : 'Mulai Ulang Aplikasi'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
