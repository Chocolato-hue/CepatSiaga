"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";

interface SosFirstAidStepperProps {
  lang: "id" | "en";
  documents?: string[];
  onHome?: () => void;
}

type Branch = "conscious" | "unconscious" | "unknown" | null;
type BreathingStatus = "breathing" | "not_breathing" | null;

const LOCALE_TEXT: any = {
  id: {
    stepLabel: (n: number | string, total: number | string) => `Langkah ${n} dari ${total}`,
    next: "Langkah Berikutnya",
    done: "Selesai",
    restart: "Mulai Ulang",
    doneTitle: "Pertolongan Pertama Selesai",
    doneDesc: "Kamu sudah melakukan yang terbaik. Segera menuju fasilitas kesehatan terdekat di bawah ini.",
    docTitle: "Siapkan Dokumen",
    docDesc: "Usahakan bawa dokumen berikut saat tiba di fasilitas:",

    // Phase: secure
    secure: "Sebelum apapun, pastikan area aman. Minta orang-orang untuk memberi ruang — jangan sampai pasien dikerumuni. Pastikan tidak ada bahaya di sekitar seperti lalu lintas, api, atau kabel listrik. Keselamatanmu juga penting.",

    // Phase: assess — question
    assessQ: "Apakah pasien sadar?",
    assessOpt1: "Sadar",
    assessOpt2: "Tidak Sadar",
    assessOpt3: "Tidak Tahu",

    // Phase: unknown_check
    unknownCheck: "Coba cek: tepuk bahunya pelan-pelan dan panggil namanya dengan lantang. Apakah matanya terbuka atau ada gerakan? Apakah ada suara napas? Jika ada respons sekecil apapun, pilih Sadar. Jika sama sekali tidak ada, pilih Tidak Sadar.",
    unknownOpt1: "Ada Respons — Sadar",
    unknownOpt2: "Tidak Ada Respons — Tidak Sadar",

    // Branch: conscious steps
    conscious: [
      "Bagus. Pasien masih sadar — itu tanda yang baik. Tetap tenang dan bicara dengan suara yang lembut agar ia tidak panik.",
      "Minta pasien untuk tidak banyak bergerak. Bantu ia duduk atau berbaring dalam posisi yang paling nyaman untuknya.",
      "Tanya perlahan: Di mana yang terasa sakit? Apakah sulit bernapas? Apakah ada riwayat penyakit atau alergi obat?",
      "Jika ada pendarahan: tekan luka dengan kain bersih apapun yang ada. Terus tekan — jangan diangkat. Tambahkan kain baru di atasnya jika perlu.",
      "Tetap di sisinya dan pantau terus. Jika kondisinya berubah — tidak sadar, sulit bernapas, atau kejang — segera beritahu petugas 119.",
    ],

    // Phase: breathing_check — question
    breathingQ: "Tengadahkan kepalanya sedikit ke belakang dan angkat dagunya. Dekatkan pipimu ke mulutnya — apakah terasa atau terdengar napas selama 10 detik?",
    breathingOpt1: "Ya, Bernapas",
    breathingOpt2: "Tidak Bernapas",

    // Branch: recovery (unconscious, breathing)
    recovery: [
      "Syukurlah — masih bernapas. Baringkan pasien dalam posisi pemulihan: miringkan tubuhnya ke satu sisi agar jalan napas tetap terbuka dan tidak tersedak jika muntah.",
      "Jaga kepalanya tetap sedikit tengadah. Pastikan tidak ada yang menyumbat mulut atau hidungnya.",
      "Pantau napasnya terus — lihat gerakan dada, dengar suara napas. Jika napas berhenti kapanpun, segera mulai CPR.",
      "Tetap di sisinya, bicara pelan meskipun ia tidak merespons. Biarkan ia tahu ada orang yang menjaganya.",
    ],

    // Branch: CPR steps
    cpr: [
      "Pasien tidak bernapas — kita perlu bertindak sekarang. Tenang, kamu bisa melakukan ini.",
      "Baringkan pasien telentang di permukaan yang keras dan rata. Berlutut di samping dadanya.",
      "Letakkan pangkal telapak tanganmu di tengah dadanya — tepat di antara dua puting. Tumpuk tangan satunya di atas. Jari-jari tidak menyentuh dada.",
      "Tekan keras ke bawah sekitar 5–6 cm, lalu lepaskan penuh. Ulangi sekitar 30 kali dengan kecepatan 2 kali per detik — seperti irama lagu 'Stayin Alive'.",
      "Setelah 30 kompresi: tengadahkan kepalanya, angkat dagu, tutup hidungnya, dan tiup napas ke mulutnya selama 1 detik. Lihat apakah dadanya mengembang. Ulangi 2 kali.",
      "Terus lakukan siklus 30 kompresi + 2 napas buatan. Jangan berhenti sampai bantuan tiba atau pasien mulai bernapas sendiri. Kamu melakukan hal yang benar.",
    ],
  },
  en: {
    stepLabel: (n: number | string, total: number | string) => `Step ${n} of ${total}`,
    next: "Next Step",
    done: "Done",
    restart: "Restart",
    doneTitle: "First Aid Completed",
    doneDesc: "You've done your best. Head to the nearest healthcare facility listed below.",
    docTitle: "Prepare Documents",
    docDesc: "Try to bring these documents when you arrive:",

    secure: "Before anything else, make sure the area is safe. Ask people to step back and give the patient space — do not let them be crowded. Check for nearby hazards: traffic, fire, or electrical wires. Your safety matters too.",

    assessQ: "Is the patient conscious?",
    assessOpt1: "Conscious",
    assessOpt2: "Unconscious",
    assessOpt3: "Not Sure",

    unknownCheck: "Try this: gently tap their shoulder and call their name out loud. Do their eyes open at all? Is there any movement or sound? If there is any response, choose Conscious. If there is nothing at all, choose Unconscious.",
    unknownOpt1: "There's a Response — Conscious",
    unknownOpt2: "No Response — Unconscious",

    conscious: [
      "Good. The patient is still conscious — that's a positive sign. Speak calmly and gently so they don't panic further.",
      "Ask them to stay as still as possible. Help them sit or lie in whichever position feels most comfortable.",
      "Ask slowly: Where does it hurt? Is it hard to breathe? Do you have any medical conditions or drug allergies?",
      "If there is bleeding: press firmly on the wound with any clean cloth. Keep pressing — do not lift it. Add more cloth on top if needed.",
      "Stay beside them and keep monitoring. If their condition changes — unconscious, trouble breathing, or seizure — tell the 119 operator immediately.",
    ],

    breathingQ: "Gently tilt their head back and lift their chin. Bring your cheek close to their mouth — can you feel or hear any breathing for 10 seconds?",
    breathingOpt1: "Yes, Breathing",
    breathingOpt2: "Not Breathing",

    recovery: [
      "Good — they're still breathing. Place the patient in the recovery position: gently roll them onto their side to keep the airway open and prevent choking if they vomit.",
      "Keep their head slightly tilted back. Make sure nothing is blocking their mouth or nose.",
      "Keep watching their breathing — look for chest movement, listen for breath sounds. If breathing stops at any point, start CPR immediately.",
      "Stay beside them and speak softly even if they don't respond. Let them feel someone is there.",
    ],

    cpr: [
      "The patient is not breathing — we need to act now. Stay calm, you can do this.",
      "Lay the patient flat on their back on a firm surface. Kneel beside their chest.",
      "Place the heel of your hand on the center of their chest — right between the nipples. Stack your other hand on top. Keep your fingers off the chest.",
      "Push down hard about 5–6 cm, then release fully. Repeat about 30 times at a rate of 2 per second — think of the rhythm of 'Stayin Alive'.",
      "After 30 compressions: tilt the head back, lift the chin, pinch the nose shut, and breathe into their mouth for 1 second. Watch for the chest to rise. Do this 2 times.",
      "Keep repeating: 30 compressions + 2 rescue breaths. Do not stop until help arrives or the patient starts breathing on their own. You are doing the right thing.",
    ],
  },
};

  const MuteButton = ({ isMuted, onClick }: { isMuted: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-full transition-colors border ${isMuted ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-red-50 text-red-500 border-red-100 hover:bg-red-100"}`}
    >
      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );

  const StepBadge = ({ current, total, t }: { current: number | string; total: number | string; t: any }) => (
    <div className="text-xs font-bold text-[#0082A6] mb-3 tracking-widest uppercase bg-[#D8F8FF] w-fit px-3 py-1 rounded-full">
      {t.stepLabel(current, total)}
    </div>
  );

  const Instruction = ({ text }: { text: string }) => (
    <p className="font-serif text-2xl lg:text-3xl italic mx-auto leading-relaxed text-slate-800 mb-8 flex-1 mt-4">
      &quot;{text}&quot;
    </p>
  );

  const NextBtn = ({ onClick, label, t }: { onClick: () => void; label?: string; t: any }) => (
    <button
      onClick={onClick}
      className="w-full bg-[#0082A6] text-white rounded-xl py-4 uppercase text-sm font-black tracking-widest flex items-center justify-center gap-2 hover:bg-[#006d8b] transition-colors shadow-md shadow-[#0082A6]/20 mt-4"
    >
      {label ?? t.next} <ArrowRight className="w-5 h-5" />
    </button>
  );

  const ChoiceBtn = ({ label, onClick, color = "slate" }: { label: string; onClick: () => void; color?: "green" | "red" | "slate" | "amber" }) => {
    const colors: Record<string, string> = {
      green: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
      red: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
      amber: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
      slate: "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100",
    };
    return (
      <button
        onClick={onClick}
        className={`w-full border rounded-xl py-4 px-5 text-sm font-bold text-left transition-colors ${colors[color]}`}
      >
        {label}
      </button>
    );
  };

export default function SosFirstAidStepper({ lang, documents = [], onHome }: SosFirstAidStepperProps) {
  const [phase, setPhase] = useState<
    | "secure"        // Step 1: amankan area
    | "assess"        // Step 2: apakah sadar?
    | "unknown_check" // Step 2b: cara cek jika tidak tahu
    | "conscious"     // Branch: sadar
    | "breathing_check" // Branch tidak sadar: apakah bernapas?
    | "recovery"      // Branch: tidak sadar, bernapas
    | "cpr"           // Branch: tidak sadar, tidak bernapas
    | "done"
  >("secure");

  const [consciousBranch, setConsciousBranch] = useState<Branch>(null);
  const [breathingStatus, setBreathingStatus] = useState<BreathingStatus>(null);
  const [consciousStep, setConsciousStep] = useState(0);
  const [cprStep, setCprStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      // Wait for voices to load
      if (synthRef.current.getVoices().length === 0) {
        synthRef.current.onvoiceschanged = () => {};
      }
    }
    return () => { synthRef.current?.cancel(); };
  }, []);

  const speak = (text: string) => {
    if (!synthRef.current || isMuted) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "en" ? "en-US" : "id-ID";
    const voices = synthRef.current.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang === "en" ? "en" : "id"));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  };

  const t = LOCALE_TEXT[lang as "id" | "en"];
  function getCurrentSpeakText(): string {
    if (phase === "secure") return t.secure;
    if (phase === "assess") return t.assessQ;
    if (phase === "unknown_check") return t.unknownCheck;
    if (phase === "breathing_check") return t.breathingQ;
    if (phase === "conscious") return t.conscious[consciousStep] ?? "";
    if (phase === "recovery") return t.recovery[consciousStep] ?? "";
    if (phase === "cpr") return t.cpr[cprStep] ?? "";
    return "";
  }

  // Speak whenever phase or step changes
  useEffect(() => {
    synthRef.current?.cancel();
    const text = getCurrentSpeakText();
    if (text) speak(text);
    return () => { synthRef.current?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, consciousStep, cprStep, isMuted, lang]);

  // ── Phase renderers ─────────────────────────────────────────────

  const renderSecure = () => (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-300">
      <StepBadge current={1} total={"?"} t={t} />
      <Instruction text={t.secure} />
      <NextBtn onClick={() => setPhase("assess")} t={t} />
    </div>
  );

  const renderAssess = () => (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-300">
      <StepBadge current={2} total={"?"} t={t} />
      <p className="font-serif text-2xl lg:text-3xl italic mx-auto leading-relaxed text-slate-800 mb-8 flex-1 mt-4 text-center">
        &quot;{t.assessQ}&quot;
      </p>
      <div className="flex flex-col gap-3 mt-4">
        <ChoiceBtn label={`✅ ${t.assessOpt1}`} color="green" onClick={() => { setConsciousBranch("conscious"); setPhase("conscious"); setConsciousStep(0); }} />
        <ChoiceBtn label={`🔴 ${t.assessOpt2}`} color="red" onClick={() => { setConsciousBranch("unconscious"); setPhase("breathing_check"); }} />
        <ChoiceBtn label={`❓ ${t.assessOpt3}`} color="amber" onClick={() => { setConsciousBranch("unknown"); setPhase("unknown_check"); }} />
      </div>
    </div>
  );

  const renderUnknownCheck = () => (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-300">
      <StepBadge current={2} total={"?"} t={t} />
      <Instruction text={t.unknownCheck} />
      <div className="flex flex-col gap-3 mt-4">
        <ChoiceBtn label={`✅ ${t.unknownOpt1}`} color="green" onClick={() => { setConsciousBranch("conscious"); setPhase("conscious"); setConsciousStep(0); }} />
        <ChoiceBtn label={`🔴 ${t.unknownOpt2}`} color="red" onClick={() => { setConsciousBranch("unconscious"); setPhase("breathing_check"); }} />
      </div>
    </div>
  );

  const renderConscious = () => {
    const steps = t.conscious;
    const isLast = consciousStep === steps.length - 1;
    return (
      <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-300">
        <StepBadge current={consciousStep + 1} total={steps.length} t={t} />
        <Instruction text={steps[consciousStep]} />
        <NextBtn
          onClick={() => isLast ? setPhase("done") : setConsciousStep(p => p + 1)}
          label={isLast ? t.done : t.next} t={t}
        />
      </div>
    );
  };

  const renderBreathingCheck = () => (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-300">
      <StepBadge current={1} total={"?"} t={t} />
      <Instruction text={t.breathingQ} />
      <div className="flex flex-col gap-3 mt-4">
        <ChoiceBtn label={`✅ ${t.breathingOpt1}`} color="green" onClick={() => { setBreathingStatus("breathing"); setPhase("recovery"); setConsciousStep(0); }} />
        <ChoiceBtn label={`🔴 ${t.breathingOpt2}`} color="red" onClick={() => { setBreathingStatus("not_breathing"); setPhase("cpr"); setCprStep(0); }} />
      </div>
    </div>
  );

  const renderRecovery = () => {
    const steps = t.recovery;
    const isLast = consciousStep === steps.length - 1;
    return (
      <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-300">
        <StepBadge current={consciousStep + 1} total={steps.length} t={t} />
        <Instruction text={steps[consciousStep]} />
        <NextBtn
          onClick={() => isLast ? setPhase("done") : setConsciousStep(p => p + 1)}
          label={isLast ? t.done : t.next} t={t}
        />
      </div>
    );
  };

  const renderCpr = () => {
    const steps = t.cpr;
    const isLast = cprStep === steps.length - 1;
    return (
      <div className="flex-1 flex flex-col animate-in slide-in-from-right fade-in duration-300">
        <div className="text-xs font-bold text-red-600 mb-3 tracking-widest uppercase bg-red-50 w-fit px-3 py-1 rounded-full border border-red-100">
          CPR — {t.stepLabel(cprStep + 1, steps.length)}
        </div>
        <Instruction text={steps[cprStep]} />
        <NextBtn
          onClick={() => isLast ? setPhase("done") : setCprStep(p => p + 1)}
          label={isLast ? t.done : t.next} t={t}
        />
      </div>
    );
  };

  const renderDone = () => (
    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700 slide-in-from-bottom-4 py-6">
      <div className="w-20 h-20 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h4 className="font-serif italic font-black text-2xl lg:text-3xl text-slate-800 mb-4 text-center">{t.doneTitle}</h4>
      <p className="text-slate-500 font-medium text-center mb-8 max-w-sm">{t.doneDesc}</p>

      {documents.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 mb-8 text-left w-full">
          <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
            📋 {t.docTitle}
          </h5>
          <p className="text-xs text-amber-700/80 mb-4">{t.docDesc}</p>
          <ul className="space-y-3">
            {documents.map((doc, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-medium text-amber-900 border-b border-amber-900/5 pb-2 last:border-0 last:pb-0">
                <div className="w-5 h-5 rounded-md bg-white border border-amber-300 shadow-sm flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-[2px]" />
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
          className="w-full bg-slate-100 text-slate-700 rounded-xl py-4 uppercase text-sm font-black tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> {t.restart}
        </button>
      )}
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700">
          {lang === "id" ? "Panduan Pertolongan Pertama" : "First Aid Guide"}
        </h3>
        <MuteButton isMuted={isMuted} onClick={() => {
            if (!isMuted) synthRef.current?.cancel();
            setIsMuted(p => !p);
        }} />
      </div>

      {phase === "secure"          && renderSecure()}
      {phase === "assess"          && renderAssess()}
      {phase === "unknown_check"   && renderUnknownCheck()}
      {phase === "conscious"       && renderConscious()}
      {phase === "breathing_check" && renderBreathingCheck()}
      {phase === "recovery"        && renderRecovery()}
      {phase === "cpr"             && renderCpr()}
      {phase === "done"            && renderDone()}
    </div>
  );
}