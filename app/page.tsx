"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { HomeIcon, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SectionTracker from "@/components/SectionTracker";

import { getTextSearchParams, isValidFacility } from "@/lib/places";
import { t } from "@/lib/i18n";
import EmergencyInput from "@/components/EmergencyInput";
import ResponseTimer from "@/components/ResponseTimer";
import FacilityList from "@/components/FacilityList";
import FirstAidStepper from "@/components/FirstAidStepper";
import PreArrivalBriefing from "@/components/PreArrivalBriefing";
import MapView from "@/components/MapView";
import LocationSearch from "@/components/LocationSearch";
import LoadingOverlay from "@/components/LoadingOverlay";
import AmbulanceLoading from "@/components/AmbulanceLoading";
import AiChatbot from "@/components/AiChatbot";
import { MAP_STYLES } from "@/lib/mapStyles";

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<"INPUT" | "ANALYZING" | "CLARIFICATION" | "TRIAGING" | "RESULTS">("INPUT");
  const [clarificationData, setClarificationData] = useState<{question: string, options: string[]} | null>(null);
  const [originalEmergencyText, setOriginalEmergencyText] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "detected" | "denied">("loading");
  const [cityName, setCityName] = useState<string | null>(null);
  const [triageData, setTriageData] = useState<any | null>(null);
  const [submissionTime, setSubmissionTime] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<"none" | "facilities" | "triage">("none");
  
  // Timer State
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Map Data State
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [prefetchedPlaces, setPrefetchedPlaces] = useState<any[] | null>(null);

  // Use a ref so the effect doesn't get re-triggered unnecessarily
  const stopTimerTriggered = useRef(false);

  // Stop timer when both triage and facilities are loaded
  useEffect(() => {
    if (triageData && facilities.length > 0 && isTimerRunning && !stopTimerTriggered.current) {
      stopTimerTriggered.current = true;
      setIsTimerRunning(false);
      setFinalTime(Date.now() - ((window as any).appStartTime || Date.now()));
      setPhase("RESULTS");
    }
  }, [triageData, facilities, isTimerRunning]);

  // Cleanup isTimerRunning to reset trigger
  useEffect(() => {
    if (!isTimerRunning) {
      // allow next run
      const timer = setTimeout(() => { stopTimerTriggered.current = false; }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isTimerRunning]);

  // Scroll to top whenever RESULTS phase begins
  useEffect(() => {
    if (phase === "RESULTS") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [phase]);

  // Preferences
  const [lang, setLang] = useState<"id" | "en">("id");
  const [travelMode, setTravelMode] = useState<"DRIVING" | "TWO_WHEELER" | "WALKING">("DRIVING");
  const [overrideType, setOverrideType] = useState<string | null>(null);

  // Navigation tracking
  const [isNavigating, setIsNavigating] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLocationSelect = useCallback((loc: { lat: number; lng: number }) => {
    setUserLocation(loc);
    setSelectedFacility(null);
    setPrefetchedPlaces(null);
  }, []);

  // Restore State on Mount
  useEffect(() => {
    const saved = sessionStorage.getItem("sigap_state");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.phase && state.phase === "RESULTS") {
          setTimeout(() => {
            setPhase(state.phase);
            setTriageData(state.triageData);
            if (state.facilities) setFacilities(state.facilities);
            if (state.selectedFacility) setSelectedFacility(state.selectedFacility);
            if (state.finalTime) setFinalTime(state.finalTime);
            if (state.isTimerRunning) setIsTimerRunning(state.isTimerRunning);
            if (state.overrideType) setOverrideType(state.overrideType);
          }, 0);
        } else {
          sessionStorage.removeItem("sigap_state");
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, []);

  // Save State on Change
  useEffect(() => {
    if (phase !== "INPUT") {
      try {
        const safeReplacer = (key: string, value: any) => {
          if (key === "path" || key === "location" || key === "viewport") {
            // Some objects might be too complex or circular. Better to keep it simple.
            // location could be a google.maps.LatLng, convert to literal
            if (value && typeof value.lat === 'function') {
              return { lat: value.lat(), lng: value.lng() };
            }
          }
          if (value && typeof value === 'object') {
            if (key === "path") return undefined; // Don't save path
          }
          return value;
        };

        const stateStr = JSON.stringify({
          phase,
          triageData,
          facilities,
          selectedFacility,
          finalTime,
          isTimerRunning,
          overrideType
        }, safeReplacer);
      
        sessionStorage.setItem("sigap_state", stateStr);
      } catch (err) {
        console.error("Failed to store state", err);
      }
    } else {
      sessionStorage.removeItem("sigap_state");
    }
  }, [phase, triageData, facilities, selectedFacility, finalTime, isTimerRunning, overrideType]);

  useEffect(() => {
    if ("geolocation" in navigator && !isNavigating) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setLocationStatus("detected");
          
          // Use internal geocoding proxy to avoid CORS/User-Agent issues with Nominatim
          fetch(`/api/geocode?lat=${loc.lat}&lon=${loc.lng}&lang=${lang}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.address) {
                let city = data.address.city || data.address.city_district || data.address.town || data.address.village || data.address.county;
                if (city) {
                  if (lang === "en") {
                    city = city.replace(/^Kota\s+/i, "").replace(/^Kabupaten\s+/i, "");
                  }
                  setCityName(city);
                }
              }
            })
            .catch(err => console.log("Reverse geocoding fallback failed", err));
        },
        (err) => {
          console.log("Geolocation error:", err);
          setLocationStatus("denied");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else if (!("geolocation" in navigator)) {
        setTimeout(() => setLocationStatus("denied"), 0);
    }
  }, [isNavigating, lang]);

  const resetToHome = () => {
    setPhase("INPUT");
    setTriageData(null);
    setClarificationData(null);
    setFacilities([]);
    setSelectedFacility(null);
    setPrefetchedPlaces(null);
    setIsTimerRunning(false);
    setFinalTime(null);
    setOverrideType(null);
    setOriginalEmergencyText("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSOS = () => {
    (window as any).appStartTime = Date.now();
    setSubmissionTime(new Date().toISOString());
    setPhase("TRIAGING");
    setIsTimerRunning(true);
    setFinalTime(null);
    setFacilities([]);
    setSelectedFacility(null);
    setPrefetchedPlaces(null);
    setOverrideType(null);
    setOriginalEmergencyText(lang === 'en' ? "SOS Panic Button Activated." : "Tombol Panik SOS Diaktifkan.");

    if (!userLocation) {
      alert(lang === "en"
        ? "Location required for emergency routing."
        : "Lokasi diperlukan untuk pencarian darurat.");
      return;
    }

    const location = userLocation;

    const sosTriage = {
      needs_clarification: false,
      severity: "Critical",
      facility_type: "hospital",
      reason: lang === 'en' ? "SOS Panic Button Activated." : "Tombol Panik SOS Diaktifkan.",
      immediate_action: lang === 'en' ? "Head to the nearest ER immediately." : "Segera menuju IGD terdekat.",
      first_aid_steps: [
        lang === 'en' ? "Ensure the patient's airway is clear and check breathing." : "Pastikan jalan napas pasien terbuka dan cek pernapasan.",
        lang === 'en' ? "If bleeding, apply firm direct pressure with a clean cloth." : "Jika ada pendarahan, tekan kuat area luka dengan kain bersih.",
        lang === 'en' ? "Tell the ER doctor: Time of incident and what you found." : "Sampaikan ke dokter IGD: Waktu kejadian dan apa yang pertama kali ditemukan."
      ],
      do_not_do: [
        lang === 'en' ? "Do not give any food or liquid to the patient." : "DILARANG memberikan makanan atau minuman kepada pasien."
      ],
      recommended_documents: ["KTP", "Kartu BPJS/Asuransi"]
    };
    setTriageData(sosTriage);

    if (window.google?.maps) {
      google.maps.importLibrary("places").then(async (lib) => {
        const { Place } = lib as google.maps.PlacesLibrary;
        const searchParams = getTextSearchParams("hospital", location.lat, location.lng);
        
        try {
          const res = await Place.searchByText(searchParams).catch(() => ({ places: [] }));
          
          let combinedPlaces = [...((res as any).places || [])];

          if (combinedPlaces.length > 0) {
            const seen = new Set();
            const seenCoords = new Set();
            const unique = combinedPlaces.filter((p: any) => {
              if (!isValidFacility(p, "hospital")) return false;
              
              if (p.location) {
                const lat = typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat;
                const lng = typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng;
                if (lat != null && lng != null) {
                  const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
                  if (seenCoords.has(coordKey)) return false;
                  seenCoords.add(coordKey);
                }
              }

              if (!p.formattedAddress) return false;
              if (seen.has(p.formattedAddress)) return false;
              seen.add(p.formattedAddress);
              return true;
            }).slice(0, 10);
            setPrefetchedPlaces(unique);
          }
        } catch(err) {
            console.log("SOS prefetch failed", err);
        }
      });
    }
  };

  const startNavigation = () => {
    if (!selectedFacility?.location || !userLocation) return;
    
    setIsNavigating(true); // show indicator state if they go back but we route away
    const params = new URLSearchParams();
    params.set("lat", selectedFacility.location.lat.toString());
    params.set("lng", selectedFacility.location.lng.toString());
    params.set("name", selectedFacility.displayName);
    params.set("id", selectedFacility.id);
    params.set("address", selectedFacility.formattedAddress || "");
    params.set("userLat", userLocation.lat.toString());
    params.set("userLng", userLocation.lng.toString());
    params.set("lang", lang);
    params.set("travelMode", travelMode);
    
    const others = facilities.filter(f => f.id !== selectedFacility.id).map(f => ({
      id: f.id,
      lat: f.location?.lat,
      lng: f.location?.lng,
      name: f.displayName,
      eta: f.eta
    })).slice(0, 3);
    
    if (others.length > 0) {
      params.set("others", JSON.stringify(others));
    }
    
    router.push(`/navigasi?${params.toString()}`);
  };

  const handleEmergencySubmit = async (text: string) => {
    (window as any).appStartTime = Date.now();
    setSubmissionTime(new Date().toISOString());
    setPhase("ANALYZING");
    setIsTimerRunning(true);
    setFinalTime(null);
    setFacilities([]);
    setSelectedFacility(null);
    setPrefetchedPlaces(null);
    setOverrideType(null);
    setOriginalEmergencyText(text);

    if (!userLocation) {
      alert(lang === "en"
        ? "Location required for emergency routing."
        : "Lokasi diperlukan untuk pencarian darurat.");
      return;
    }

    const location = userLocation;

    const fetchWithRetry = async (url: string, options: any, retries = 2): Promise<any> => {
      try {
        const res = await fetch(url, options);
        if (!res.ok) {
           const text = await res.text();
           if (text.includes("Jaringan sedang sibuk") || res.status === 429 || res.status >= 500) {
             throw new Error("Network busy");
           }
           throw new Error("API error");
        }
        return await res.json();
      } catch (e) {
        if (retries > 0) {
          console.warn(`Retrying fetch... ${retries} attempts left`);
          await new Promise(r => setTimeout(r, 1000));
          return fetchWithRetry(url, options, retries - 1);
        }
        throw e;
      }
    };

    const triagePromise = fetchWithRetry("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emergency: text, location })
    });

    // Try to pre-fetch places immediately assuming default 'hospital'
    let placesPromise = Promise.resolve<{places: any[]} | null>(null);
    
    if (window.google?.maps) {
      try {
        const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        const searchParams = getTextSearchParams("hospital", location.lat, location.lng);
        placesPromise = Place.searchByText(searchParams) as Promise<any>;
      } catch (e) {
        console.log("Pre-fetch places failed", e);
      }
    }

    try {
      const [data, placesRes] = await Promise.all([triagePromise, placesPromise]);
      
      if (data.needs_clarification) {
        setClarificationData(data);
        setOriginalEmergencyText(text);
        setPhase("CLARIFICATION");
        setIsTimerRunning(false);
        return;
      }
      
      setTriageData(data);
      let combinedPlaces = [...(placesRes?.places || [])];
      
      if (combinedPlaces.length > 0 && data.facility_type === 'hospital') {
         const seen = new Set();
         const seenCoords = new Set();
         const unique = combinedPlaces.filter((p: any) => {
           if (!isValidFacility(p, "hospital")) return false;

           if (p.location) {
             const lat = typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat;
             const lng = typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng;
             if (lat != null && lng != null) {
               const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
               if (seenCoords.has(coordKey)) return false;
               seenCoords.add(coordKey);
             }
           }

           if (!p.formattedAddress) return false;
           if (seen.has(p.formattedAddress)) return false;
           seen.add(p.formattedAddress);
           return true;
         }).slice(0, 10);
         setPrefetchedPlaces(unique);
      }
      setPhase("TRIAGING");
    } catch (err) {
      console.error(err);
      // Fallback
      setTriageData({
        needs_clarification: false,
        severity: "Moderate",
        facility_type: "hospital",
        reason: lang === 'en' ? "System error. Seek nearest help immediately." : "Kesalahan sistem. Segera cari bantuan terdekat.",
        immediate_action: lang === 'en' ? "Please get a ride to ER now." : "Harap cari tumpangan ke IGD sekarang.",
        first_aid_steps: [lang === 'en' ? "Ensure airway is clear and breathing continues." : "Pastikan jalan napas bersih dan lanjutkan pernapasan.", lang === 'en' ? "Seek help to the nearest ER doctor." : "Berikan informasi spesifik ke IGD saat tiba."],
        do_not_do: [],
        recommended_documents: ["KTP", "Kartu BPJS/Asuransi"]
      });
      setPhase("TRIAGING");
    }
  };

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans bg-slate-50 p-6">
        <div className="text-center max-w-xl bg-white p-8 border border-slate-200 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-display font-semibold mb-3">Google Maps API Key Required</h2>
          <p className="text-slate-500 mb-6 font-medium">Please add your Google Maps API Key in AI Studio secrets to use the location and routing features.</p>
          <div className="bg-slate-100 rounded-xl p-4 text-left text-sm font-mono text-slate-800 break-all border border-slate-200">
            Name: GOOGLE_MAPS_PLATFORM_KEY
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly" libraries={["places", "geometry"]}>
      <main className="min-h-screen relative pb-20">
        
        {/* Header */}
        <header className="absolute top-0 w-full px-10 py-6 z-10 flex justify-between items-center border-b border-black/10 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex flex-col cursor-pointer" onClick={resetToHome}>
              <span className="text-3xl md:text-4xl font-serif italic font-black tracking-tighter text-black">CepatSiaga.</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">{lang === 'en' ? 'Emergency Smart Assist' : 'Asisten Darurat Pintar'}</span>
            </div>
            
            {phase !== "INPUT" && (
              <button onClick={resetToHome} className="hidden md:flex ml-4 font-bold flex items-center gap-2 px-3 py-1.5 border border-black/20 text-black/60 rounded-full hover:bg-black/5 text-[10px] md:text-xs tracking-widest uppercase transition-colors">
                <HomeIcon className="w-3 h-3 md:w-4 md:h-4" /> {lang === 'en' ? 'Home' : 'Beranda'}
              </button>
            )}
            
            <span className="h-6 w-[1px] bg-black/20 mx-2 hidden md:block"></span>
            <div className="flex bg-black/5 rounded-full p-1 border border-black/10">
              <button onClick={() => setLang("id")} className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${lang === 'id' ? 'bg-white shadow-sm' : 'text-black/40 hover:bg-black/5'}`}>ID</button>
              <button onClick={() => setLang("en")} className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${lang === 'en' ? 'bg-white shadow-sm' : 'text-black/40 hover:bg-black/5'}`}>EN</button>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">{lang === 'en' ? 'Current Location' : 'Lokasi Saat Ini'}</p>
              <p className="text-sm font-medium flex items-center gap-1 justify-end">
                {locationStatus === "loading" ? "📍 Mendeteksi lokasi..." : 
                 locationStatus === "denied" ? "📍 Lokasi tidak diaktifkan" : 
                 cityName ? `📍 ${cityName}` : "📍 Lokasi Terdeteksi"}
              </p>
            </div>
          </div>
        </header>

        {(phase === "INPUT") && (
          <div className="w-full flex flex-col">
            {/* Hero Section - 100vh */}
            <div className="min-h-screen flex items-center justify-center pt-20">
              <EmergencyInput onSubmit={handleEmergencySubmit} onSOS={handleSOS} lang={lang} isAnalyzing={false} locationStatus={locationStatus} />
            </div>
            
            {/* Landing Page Content - Horizontal Rows */}
            <div className="max-w-5xl mx-auto px-6 flex flex-col w-full pb-32">
              
              {/* Row 1: The Urgent Reality */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="w-full flex flex-col md:flex-row gap-12 items-center py-24 border-t border-black/10"
              >
                <div className="flex-1">
                  <h3 className="font-serif italic font-black text-4xl md:text-5xl text-black leading-tight mb-6 tracking-tight">
                    {t[lang].everySecondCounts}
                  </h3>
                  <p className="text-black/70 font-medium text-lg leading-relaxed mb-6">
                    {t[lang].whoFact}
                  </p>
                  <div className="flex flex-col gap-2 mt-8 p-6 bg-[#D8F8FF] rounded-2xl border border-[#0082A6]/10">
                     <span className="text-[10px] uppercase font-black tracking-widest text-[#0082A6]">{t[lang].didYouKnow}</span>
                     <p className="font-serif italic text-xl font-bold text-[#0082A6]">
                       {t[lang].goldenHour}
                     </p>
                  </div>
                </div>
                <div className="w-full md:w-1/3 aspect-square bg-[#0082A6] rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 text-white hover:scale-105 transition-transform duration-500 shadow-xl shadow-[#0082A6]/20">
                  <span className="text-7xl md:text-8xl font-black font-sans tracking-tighter">80<span className="text-5xl">%</span></span>
                  <span className="text-sm font-bold uppercase tracking-widest opacity-90 leading-tight">
                    {t[lang].statsDeath}
                  </span>
                </div>
              </motion.div>

              {/* Row 2: Features Layout */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="w-full py-24 border-t border-black/10 flex flex-col gap-12"
              >
                {[
                  {
                    icon: "🚑",
                    title: t[lang].aiTriage,
                    desc: t[lang].aiTriageDesc
                  },
                  {
                    icon: "🏥",
                    title: t[lang].instantFirstAid,
                    desc: t[lang].instantFirstAidDesc
                  },
                  {
                    icon: "🚨",
                    title: t[lang].panicButton,
                    desc: t[lang].panicButtonDesc
                  }
                ].map((feature, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-6 items-center md:items-start p-8 rounded-3xl bg-white border border-[#0082A6]/10 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-5xl md:text-6xl bg-[#D8F8FF] p-6 rounded-2xl flex-shrink-0">{feature.icon}</span>
                    <div className="flex flex-col gap-3 text-center md:text-left mt-2 content-center md:content-start h-full justify-center">
                      <h4 className="font-bold text-2xl text-[#0082A6] tracking-tight">{feature.title}</h4>
                      <p className="text-black/60 text-lg leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Row 3: CTA Section */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center py-20 pb-32"
              >
                 <button 
                   onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                   className="bg-[#0082A6] text-white px-10 py-5 rounded-full text-sm font-black tracking-widest hover:scale-105 hover:bg-[#006d8b] shadow-xl shadow-[#0082A6]/30 transition-all"
                 >
                   {t[lang].startAi}
                 </button>
              </motion.div>

            </div>
          </div>
        )}
        
        {phase === "ANALYZING" && (
          <div className="pt-32 px-4 max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
            <AmbulanceLoading lang={lang} />
          </div>
        )}

        {phase === "CLARIFICATION" && clarificationData && (
          <div className="pt-32 px-4 max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#D8F8FF] border border-[#0082A6]/20 p-8 shadow-sm flex flex-col gap-6 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <h2 className="font-serif italic font-black text-2xl text-[#0082A6] leading-tight">
                  {lang === 'en' ? 'Need More Context' : 'Butuh Klarifikasi'}
                </h2>
              </div>
              <p className="text-lg font-medium text-slate-800">
                {(clarificationData.question as any)[lang] || clarificationData.question}
              </p>
              <div className="flex flex-col gap-3 mt-4">
                {((clarificationData.options as any)[lang] || clarificationData.options).map((opt: string, i: number) => (
                  <button 
                    key={i}
                    onClick={() => handleEmergencySubmit(`${originalEmergencyText}. Klarifikasi: ${opt}`)}
                    className="w-full text-left bg-white border border-[#0082A6]/20 rounded-xl px-6 py-4 font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = new FormData(e.currentTarget).get('other_clarification');
                    if (val) handleEmergencySubmit(`${originalEmergencyText}. Klarifikasi: ${val}`);
                  }}
                  className="mt-2 flex gap-2 relative"
                >
                  <input 
                    name="other_clarification"
                    type="text" 
                    placeholder={lang === 'en' ? 'Other details...' : 'Detail keluhan lain...'}
                    className="flex-1 rounded-xl bg-white border border-[#0082A6]/30 p-4 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0082A6] placeholder:text-slate-400 text-sm md:text-base shadow-sm"
                    required
                  />
                  <button type="submit" className="bg-[#0082A6] rounded-xl text-white font-bold uppercase tracking-widest px-6 hover:bg-[#006d8b] shadow-md shadow-[#0082A6]/20 transition-colors border border-[#0082A6] text-[10px] md:text-xs">
                    {lang === 'en' ? 'Send' : 'Kirim'}
                  </button>
                </form>
              </div>
              <button
                onClick={resetToHome}
                className="mt-6 uppercase text-xs tracking-widest font-bold text-slate-500 hover:text-slate-800 underline text-center"
              >
                {lang === 'en' ? 'Cancel' : 'Batalkan'}
              </button>
            </div>
          </div>
        )}

        {phase === "TRIAGING" && !triageData && <LoadingOverlay />}

        {(phase === "TRIAGING" || phase === "RESULTS") && triageData && (
          <div className="flex flex-col min-h-screen w-full bg-[#E8ECE6] pt-20 relative">
             <SectionTracker />
             
             {/* Floating AI Chatbot Widget */}
             <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
               <AnimatePresence>
                 {isChatOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.95 }}
                     className="mb-4 w-[90vw] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden"
                   >
                     <div className="bg-white p-4 flex justify-between items-center text-black border-b border-black/10 shrink-0">
                       <h3 className="font-bold text-black">{t[lang].chatTitle}</h3>
                       <button onClick={() => setIsChatOpen(false)} className="hover:bg-slate-100 p-1 rounded-full text-slate-500 transition-colors">
                         <X className="w-5 h-5" />
                       </button>
                     </div>
                     <div className="flex-1 overflow-hidden relative">
                       <AiChatbot lang={lang} condition={originalEmergencyText} />
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
               
               <button 
                 onClick={() => setIsChatOpen(!isChatOpen)}
                 className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 ${isChatOpen ? 'bg-slate-800 text-white' : 'bg-[#0082A6] text-white'}`}
               >
                 {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
               </button>
             </div>

             {/* Main Content: The 3 Core Sections */}
             <div className="w-full max-w-7xl mx-auto px-6 lg:px-24 py-8 lg:py-12 flex flex-col gap-16 lg:gap-24 overflow-y-auto pb-32">
               
               {/* Section 1: First Aid Hub (Split Two-Column on Desktop) */}
               <motion.section 
                 id="action" 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="flex flex-col lg:flex-row gap-6 scroll-mt-32 w-full"
               >
                  {/* Left Column: Info Darurat */}
                  <div className="w-full lg:w-[40%] flex flex-col gap-4">
                    <div className="bg-white p-4 md:p-6 border border-black/10 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${triageData.severity === 'Critical' ? 'bg-[#FF3B30] animate-pulse' : 'bg-[#0082A6]'}`}></div>
                        <h2 className="font-serif italic font-black text-xl text-black tracking-tight">{t[lang].emergencyInfo}</h2>
                      </div>
                      <p className="text-black font-medium text-sm leading-relaxed mb-4">{triageData.reason?.[lang] || triageData.reason}</p>
                      
                      <div className="bg-[#0082A6] text-white p-4 rounded-xl mb-4 shadow-sm">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-[#D8F8FF] mb-1">{t[lang].immediateAction}</span>
                        <span className="font-black text-base md:text-lg tracking-tight leading-snug">{triageData.immediate_action?.[lang] || triageData.immediate_action}</span>
                      </div>

                      {triageData.do_not_do && (triageData.do_not_do[lang] || triageData.do_not_do)?.length > 0 && (
                        <div className="bg-red-50 p-4 border border-red-100 rounded-xl mt-2 text-xs md:text-sm shadow-sm">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-[#FF3B30] mb-2">⚠️ {t[lang].doNotDo}</span>
                          <p className="text-red-900/60 text-[10px] mb-2">{t[lang].doNotDoDesc}</p>
                          <ul className="list-disc list-outside ml-4 text-red-900 font-bold space-y-1">
                            {(triageData.do_not_do[lang] || triageData.do_not_do).map((item: string, idx: number) => (
                              <li key={idx} className="leading-snug">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: First Aid Stepper */}
                  <div className="w-full lg:w-[60%] bg-white border border-black/10 rounded-2xl shadow-sm p-4 md:p-6 flex flex-col gap-4">
                     <h3 className="text-xl md:text-2xl font-serif italic font-black tracking-tight text-black mb-2 border-b border-black/10 pb-4 text-center">
                       {t[lang].firstAidGuide}
                     </h3>
                     <FirstAidStepper 
                        steps={(triageData.first_aid_steps?.[lang] || triageData.first_aid_steps || []).map((step: string) => step.replace(/dongak/gi, "tengadahkan kepala"))}
                        documents={triageData.recommended_documents?.[lang] || triageData.recommended_documents}
                        lang={lang} 
                        onHome={resetToHome}
                     />
                  </div>
               </motion.section>

               {/* Linear Scroll Separator 1 */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="flex flex-col items-center justify-center py-8 opacity-80"
               >
                  <p className="text-center font-bold text-slate-500 uppercase tracking-widest text-sm max-w-2xl">
                     {t[lang].transitionToFacilities}
                  </p>
                  <div className="w-px h-12 bg-slate-300 mt-6 mt-4"></div>
               </motion.div>

               {/* Section 2: Nearest Facilities Maps */}
               <motion.section 
                 id="facilities" 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="flex flex-col gap-6 scroll-mt-32 w-full"
               >
                 <div className="bg-white border border-black/10 rounded-2xl shadow-sm p-4 md:p-6 flex flex-col gap-4">
                   <h3 className="text-xl md:text-2xl font-serif italic font-black tracking-tight text-black mb-4 border-b border-black/10 pb-4">
                     {t[lang].nearestFacilities}
                   </h3>
                    
                   <div className="flex flex-col lg:flex-row gap-6 w-full">
                     {/* Left side: List */}
                     <div id="facility-cards-section" className="w-full lg:w-[40%] flex flex-col gap-4 h-[400px] lg:h-[600px] overflow-y-auto pr-2">
                       {userLocation && (
                         <FacilityList
                           triageData={triageData} 
                           userLocation={userLocation}
                           facilities={facilities}
                           setFacilities={setFacilities}
                           selectedFacility={selectedFacility}
                           setSelectedFacility={setSelectedFacility}
                           travelMode={travelMode}
                           lang={lang}
                           cityName={cityName}
                           prefetchedPlaces={prefetchedPlaces}
                           overrideType={overrideType}
                           setOverrideType={setOverrideType}
                         />
                       )}
                     </div>

                     {/* Right side: Map */}
                     <div className="w-full lg:w-[60%] relative rounded-2xl overflow-hidden border border-[#0082A6]/20 h-[400px] lg:h-[600px]">
                        {/* Control Panel Layer */}
                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
                          <div className="flex bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-slate-200">
                            <button onClick={() => setTravelMode("DRIVING")} className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-colors flex items-center gap-2 ${travelMode === 'DRIVING' ? 'bg-[#0082A6] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>🚗 <span className="hidden sm:inline">{lang === 'en' ? 'Drive' : 'Mobil'}</span></button>
                            <button onClick={() => setTravelMode("TWO_WHEELER")} className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-colors flex items-center gap-2 ${travelMode === 'TWO_WHEELER' ? 'bg-[#0082A6] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>🏍️ <span className="hidden sm:inline">{lang === 'en' ? 'Motor' : 'Motor'}</span></button>
                            <button onClick={() => setTravelMode("WALKING")} className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-colors flex items-center gap-2 ${travelMode === 'WALKING' ? 'bg-[#0082A6] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>🚶 <span className="hidden sm:inline">{lang === 'en' ? 'Walk' : 'Jalan'}</span></button>
                          </div>
                        </div>

                        {/* Map View Context */}
                        <div className="w-full h-full bg-slate-100 relative">
                          {!facilities.length && (
                            <div className="absolute inset-0 z-0 bg-slate-100 animate-pulse flex items-center justify-center">
                              <div className="w-8 h-8 border-4 border-[#0082A6] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          {!userLocation ? null : (
                          <Map
                            center={userLocation || undefined}
                            defaultZoom={14}
                            zoomControl={false}
                            mapId="DEMO_MAP_ID"
                            disableDefaultUI
                            colorScheme="LIGHT"
                            styles={MAP_STYLES}
                            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                            className="w-full h-full relative z-10"
                          >
                            <MapView userLocation={userLocation} facilities={facilities} selectedFacility={selectedFacility} travelMode={travelMode} facilityType={overrideType || triageData?.facility_type} isNavigating={false} />
                          </Map> 
                          )}

                          {selectedFacility && (
                            <div className="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur-md border border-[#0082A6]/20 rounded-xl p-4 flex flex-col sm:flex-row gap-3 z-20 shadow-lg animate-in slide-in-from-bottom-4 duration-300 mx-12">
                              <div className="flex-1 flex flex-col justify-center">
                                 <p className="font-bold text-[#0082A6] truncate">{selectedFacility.displayName}</p>
                                 <p className="text-xs text-slate-500">{selectedFacility.eta ? selectedFacility.eta + ' min' : ''}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  if (selectedFacility.location) {
                                    const modeStr = travelMode === 'WALKING' ? 'walking' : 'driving';
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.location.lat},${selectedFacility.location.lng}&travelmode=${modeStr}`, '_blank');
                                  }
                                }}
                                className="bg-[#0082A6] text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-[#006d8b] shadow-md transition-colors whitespace-nowrap"
                              >
                                <span className="text-sm md:text-base">📍</span> {t[lang].mapDirections} ↗
                              </button>
                            </div>
                          )}
                        </div>
                     </div>
                   </div>
                 </div>
               </motion.section>

               {/* Linear Scroll Separator 2 */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="flex flex-col items-center justify-center py-8 opacity-80"
               >
                  <p className="text-center font-bold text-slate-500 uppercase tracking-widest text-sm max-w-2xl">
                     {t[lang].transitionToReport}
                  </p>
                  <div className="w-px h-12 bg-slate-300 mt-6 mt-4"></div>
               </motion.div>

               {/* Section 3: Summary Generator */}
               <motion.section 
                 id="triage" 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="flex flex-col gap-6 w-full"
               >
                 <PreArrivalBriefing 
                    triageData={triageData} 
                    lang={lang} 
                    originalEmergencyText={originalEmergencyText}
                    incidentTime={submissionTime ?? undefined}
                 />
               </motion.section>

               {/* Complete Footer */}
               <div className="w-full text-center mt-20 pb-12">
                 <button 
                   onClick={() => {
                     setIsChatOpen(true);
                     setTimeout(() => {
                       document.getElementById('chat-input')?.focus();
                     }, 300);
                   }}
                   className="text-slate-500 hover:text-slate-900 font-bold tracking-widest text-xs uppercase underline transition-colors"
                 >
                   {t[lang].footerChatPrompt}
                 </button>
               </div>

             </div>
          </div>
        )}
      </main>
    </APIProvider>
  );
}
