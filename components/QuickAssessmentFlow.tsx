"use client";

import { useState } from "react";
import { ArrowRight, Activity, AlertCircle, Phone, ArrowLeft } from "lucide-react";

interface QuickAssessmentFlowProps {
  onComplete: (data: string) => void;
  onCancel: () => void;
  lang: "id" | "en";
}

export default function QuickAssessmentFlow({ onComplete, onCancel, lang }: QuickAssessmentFlowProps) {
  const [step, setStep] = useState(1);
  const [conscious, setConscious] = useState("");
  const [breathing, setBreathing] = useState("");
  const [emergencyType, setEmergencyType] = useState("");
  const [details, setDetails] = useState("");

  const t = {
    id: {
      title: "Kaji Darurat Cepat",
      cancel: "Batal",
      back: "Kembali",
      next: "Lanjut",
      submit: "Kirim & Analisis",
      step1: "Apakah pasien sadar?",
      step2: "Apakah pasien bernapas normal?",
      step3: "Apa jenis keadaan daruratnya?",
      step4: "Tambahkan detail tambahan (opsional)",
      yes: "Ya",
      no: "Tidak",
      notSure: "Tidak Yakin",
      types: [
        "Nyeri Dada",
        "Sesak Napas",
        "Pendarahan Hebat",
        "Kejang",
        "Tidak Sadar / Tumbang",
        "Kecelakaan Lalu Lintas",
        "Jatuh / Cedera",
        "Keracunan",
        "Luka Bakar",
        "Lainnya"
      ],
      detailsPlaceholder: "Contoh: Pria lansia dengan nyeri dada, Jatuh dari tangga...",
    },
    en: {
      title: "Quick Emergency Assessment",
      cancel: "Cancel",
      back: "Back",
      next: "Next",
      submit: "Submit & Analyze",
      step1: "Is the patient conscious?",
      step2: "Is the patient breathing normally?",
      step3: "What best describes the situation?",
      step4: "Add any additional details (optional)",
      yes: "Yes",
      no: "No",
      notSure: "Not Sure",
      types: [
        "Chest Pain",
        "Difficulty Breathing",
        "Severe Bleeding",
        "Seizure",
        "Unconscious / Collapsed",
        "Traffic Accident",
        "Fall / Injury",
        "Poisoning",
        "Burn",
        "Other"
      ],
      detailsPlaceholder: "Examples: Elderly male with chest pain, Child fell from stairs...",
    }
  };

  const currentT = t[lang];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    const summaryLines = [
      "Quick Assessment:",
      `Patient conscious: ${conscious.toLowerCase()}.`,
      `Breathing normally: ${breathing.toLowerCase()}.`,
      `Situation type: ${emergencyType || "Unspecified"}.`
    ];

    if (details.trim()) {
      summaryLines.push(`Additional details: ${details.trim()}.`);
    }

    onComplete(summaryLines.join("\n"));
  };

  const isStepValid = () => {
    if (step === 1) return !!conscious;
    if (step === 2) return !!breathing;
    if (step === 3) return !!emergencyType;
    return true;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pt-16 pb-20 px-4 md:px-0">
      <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden mt-4 border border-red-100 flex flex-col min-h-[75vh]">
        
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-black tracking-wide">{currentT.title}</h1>
          </div>
          <button onClick={onCancel} className="text-red-100 hover:text-white transition-colors text-sm font-bold bg-black/10 px-3 py-1.5 rounded-full">
            {currentT.cancel}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-red-100 h-1.5 flex transition-all duration-300">
          <div 
            className="bg-red-500 h-full transition-all duration-300 ease-out" 
            style={{ width: `${(step / 4) * 100}%` }} 
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center relative">
          
          <div className="w-full max-w-lg animate-in slide-in-from-right-4 fade-in duration-300">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-serif italic text-slate-800 text-center mb-8 font-black">
                  &quot;{currentT.step1}&quot;
                </h2>
                <div className="grid gap-3">
                  {[currentT.yes, currentT.no, currentT.notSure].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setConscious(opt); setTimeout(() => setStep(2), 200); }}
                      className={`w-full py-4 px-6 text-left rounded-2xl border-2 transition-all font-bold text-lg ${
                        conscious === opt 
                          ? "border-red-500 bg-red-50 text-red-700 shadow-md transform scale-[1.02]" 
                          : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-serif italic text-slate-800 text-center mb-8 font-black">
                  &quot;{currentT.step2}&quot;
                </h2>
                <div className="grid gap-3">
                  {[currentT.yes, currentT.no, currentT.notSure].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setBreathing(opt); setTimeout(() => setStep(3), 200); }}
                      className={`w-full py-4 px-6 text-left rounded-2xl border-2 transition-all font-bold text-lg ${
                        breathing === opt 
                          ? "border-red-500 bg-red-50 text-red-700 shadow-md transform scale-[1.02]" 
                          : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 w-full">
                <h2 className="text-2xl md:text-3xl font-serif italic text-slate-800 text-center mb-6 font-black">
                  &quot;{currentT.step3}&quot;
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pb-4 px-1 custom-scrollbar">
                  {currentT.types.map((type, i) => (
                    <button
                      key={type}
                      onClick={() => { setEmergencyType(currentT.types[i]); setTimeout(() => setStep(4), 200); }}
                      className={`w-full py-4 px-4 text-left rounded-2xl border-2 transition-all font-bold text-sm md:text-base ${
                        emergencyType === currentT.types[i] 
                          ? "border-red-500 bg-red-50 text-red-700 shadow-md" 
                          : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-serif italic text-slate-800 text-center mb-4 font-black">
                  {currentT.step4}
                </h2>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={currentT.detailsPlaceholder}
                  className="w-full h-40 p-4 border-2 border-slate-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none resize-none transition-all text-slate-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 md:p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-4 font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentT.back}
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-md shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
          >
            {step === 4 ? (
              <>
                <AlertCircle className="w-5 h-5 fill-white text-red-600" />
                {currentT.submit}
              </>
            ) : (
              <>
                {currentT.next}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
