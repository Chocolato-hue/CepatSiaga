"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MAP_STYLES } from "@/lib/mapStyles";
import { Volume2, VolumeX, Square, CheckCircle, Navigation, Copy } from "lucide-react";

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; 
}

function NavigasiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const destLat = parseFloat(searchParams.get("lat") || "0");
  const destLng = parseFloat(searchParams.get("lng") || "0");
  const name = searchParams.get("name") || "";
  const address = searchParams.get("address") || "";
  const initialId = searchParams.get("id") || "";
  const initialUserLat = parseFloat(searchParams.get("userLat") || "0");
  const initialUserLng = parseFloat(searchParams.get("userLng") || "0");
  const lang = searchParams.get("lang") || "id";
  const tMode = searchParams.get("travelMode") || "DRIVING";
  
  const othersParam = searchParams.get("others");
  const initialOthers = othersParam ? JSON.parse(othersParam) : [];

  const [userLoc, setUserLoc] = useState({ lat: initialUserLat, lng: initialUserLng });
  const [targetLoc, setTargetLoc] = useState({ lat: destLat, lng: destLng });
  const [targetName, setTargetName] = useState(name);
  const [targetAddress, setTargetAddress] = useState(address);
  const [targetId, setTargetId] = useState(initialId);
  const [alternatives, setAlternatives] = useState<any[]>(initialOthers);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isArrived, setIsArrived] = useState(false);
  const [lastInstruction, setLastInstruction] = useState("");
  const [distanceKm, setDistanceKm] = useState(0);
  
  const watchIdRef = useRef<number | null>(null);
  const distanceFlagRef = useRef({ m500: false, m50: false });
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = (idText: string, enText: string) => {
    const text = lang === 'en' ? enText : idText;
    setTimeout(() => setLastInstruction(text), 0);
    if (!synthRef.current || isMuted) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? "en-US" : "id-ID";
    // Slightly lower pitch/rate for a calmer, more professional tone
    utterance.pitch = 0.9;
    utterance.rate = 0.9;
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    // Start navigation
    speak("Tetap tenang, Anda tidak sendirian. Kita sudah di jalur yang tepat menuju fasilitas medis. Fokus pada jalan.", "Stay calm, you are not alone. We are on the right path to the medical facility. Keep your focus on the road.");
    distanceFlagRef.current = { m500: false, m50: false };

    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setUserLoc({ lat: newLat, lng: newLng });
          
          const distMeters = haversineDistance(newLat, newLng, targetLoc.lat, targetLoc.lng);
          setDistanceKm(distMeters / 1000);
          
          if (distMeters < 50 && !distanceFlagRef.current.m50) {
            distanceFlagRef.current.m50 = true;
            setIsArrived(true);
            speak("Anda sudah tiba. Tim medis sudah siap membantu.", "You have arrived. The medical team is ready to assist.");
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
          } else if (distMeters < 500 && !distanceFlagRef.current.m500) {
            distanceFlagRef.current.m500 = true;
            speak("Tujuan sudah sangat dekat. Silakan bersiap, bantuan medis segera tiba.", "The destination is very close. Please prepare, medical help is just ahead.");
          }
        },
        (err) => console.log(err),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (synthRef.current) synthRef.current.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLoc, isMuted, lang]);

  // Rough ETA based on 30km/h
  const etaMinutes = Math.ceil((distanceKm / 30) * 60);

  const handleStop = () => {
    if (synthRef.current) synthRef.current.cancel();
    router.push("/");
  };

  const handleSwitchTarget = (other: any) => {
    if (other.lat && other.lng) {
      // Put currently selected target back into the alternatives array
      const oldTargetLocal = {
        id: targetId,
        lat: targetLoc.lat,
        lng: targetLoc.lng,
        name: targetName,
        eta: etaMinutes
      };
      
      const newAlts = alternatives.filter((a: any) => a.id !== other.id);
      if (oldTargetLocal.id) {
        newAlts.push(oldTargetLocal);
      }
      setAlternatives(newAlts);
      
      setTargetId(other.id);
      setTargetLoc({ lat: other.lat, lng: other.lng });
      setTargetName(other.name);
      setTargetAddress(""); // usually simplified
      distanceFlagRef.current = { m500: false, m50: false };
      speak(`Rute diperbarui ke ${other.name}. Jangan khawatir, ini adalah jalur tercepat berikutnya dari lokasi Anda sekarang.`, `Route updated to ${other.name}. Do not worry, this is the best alternative path from your current location.`);
    }
  };

  if (isArrived) {
    return (
      <div className="fixed inset-0 bg-[#10B981] flex flex-col items-center justify-center text-white z-50 animate-in fade-in zoom-in duration-500">
        <CheckCircle className="w-32 h-32 mb-8 animate-bounce" />
        <h1 className="text-5xl font-black font-serif italic mb-4">{lang === 'en' ? 'You have arrived.' : 'Anda telah tiba.'}</h1>
        <p className="text-xl font-medium mb-12">{targetName}</p>
        <button 
          onClick={handleStop}
          className="bg-white text-[#10B981] px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
        >
          {lang === 'en' ? 'Back to Home' : 'Kembali ke Beranda'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50">
      {/* HUD - Right on Desktop, Bottom on Mobile */}
      <div className="w-full lg:w-[30%] lg:order-2 h-auto lg:h-full bg-white border-l border-black/10 shadow-2xl flex flex-col pt-6 pb-4 px-5 z-20">
        {/* Header */}
        <div className="mb-4">
          <div className="text-[10px] font-bold text-black opacity-40 mb-1 tracking-widest uppercase">
            {lang === 'en' ? 'Currently Navigating To' : 'Sedang Menuju'}
          </div>
          <h2 className="text-xl font-bold leading-tight text-black line-clamp-2">{targetName}</h2>
          {targetAddress && <p className="text-xs font-medium text-black/50 mt-0.5 line-clamp-1">{targetAddress}</p>}
        </div>
        
        {/* ETA + Distance Row */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-[#2563EB] text-white p-3 rounded-none">
            <div className="text-[9px] font-bold tracking-widest uppercase opacity-70 mb-1">
              {lang === 'en' ? 'ETA' : 'Waktu Tiba'}
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black tabular-nums">{etaMinutes}</span>
              <span className="text-xs font-bold mb-0.5">min</span>
            </div>
          </div>
          <div className="flex-1 bg-black/5 p-3 rounded-none">
            <div className="text-[9px] font-bold tracking-widest uppercase text-black/40 mb-1">
              {lang === 'en' ? 'Distance' : 'Jarak'}
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black tabular-nums text-black">{distanceKm.toFixed(1)}</span>
              <span className="text-xs font-bold text-black/50 mb-0.5">km</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-black/40 mb-1">
            <span>{lang === 'en' ? 'Progress' : 'Progres'}</span>
            <span>{distanceKm > 0 ? `${distanceKm.toFixed(1)} km left` : '—'}</span>
          </div>
          <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#2563EB] rounded-full transition-all duration-1000"
              style={{ width: distanceKm > 0 ? `${Math.max(5, Math.min(95, 100 - (distanceKm / Math.max(distanceKm, 0.1)) * 100))}%` : '5%' }}
            />
          </div>
        </div>

        {/* Voice Assistant */}
        <div className="bg-black text-white p-3 rounded-none shadow-[2px_2px_0_0_#ccc] mb-4">
          <div className="flex items-center gap-2 mb-1.5 opacity-50">
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest">{lang === 'en' ? 'Voice Assistant' : 'Asisten Suara'}</span>
          </div>
          <p className="font-serif italic text-base leading-snug line-clamp-3">&quot;{lastInstruction || (lang === 'en' ? 'Starting navigation...' : 'Memulai navigasi...')}&quot;</p>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-bold text-black opacity-40 mb-2 tracking-widest uppercase">
              {lang === 'en' ? 'Alternatives' : 'Fasilitas Alternatif'}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x scrollbar-hide">
              {alternatives.map((alt: any, i: number) => (
                <button 
                  key={i}
                  onClick={() => handleSwitchTarget(alt)}
                  className="snap-start min-w-[140px] flex-shrink-0 border border-slate-200 bg-white p-3 text-left hover:border-black transition-all rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_0px_#000] group"
                >
                  <div className="font-bold text-black text-xs line-clamp-1 mb-1.5 group-hover:text-blue-600 transition-colors">{alt.name}</div>
                  <div className="flex items-center gap-2">
                    {alt.eta && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-black/5 px-2 py-0.5 text-black/60">
                        {alt.eta} MIN
                      </span>
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#2563EB]">↗</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="mt-auto flex gap-3 pt-3 border-t border-black/10">
          <button 
            onClick={() => {
              setIsMuted(!isMuted);
              if (synthRef.current && !isMuted) synthRef.current.cancel();
            }}
            className="flex-1 border border-black bg-white py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black/5"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isMuted ? (lang === 'en' ? 'Unmute' : 'Suarakan') : (lang === 'en' ? 'Mute' : 'Bisukan')}
          </button>
          <button 
            onClick={handleStop}
            className="flex-1 bg-[#FF3B30] text-white py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-[#FF3B30]/90"
          >
            <Square className="w-4 h-4 fill-current" />
            {lang === 'en' ? 'Stop & Home' : 'Akhiri & Kembali'}
          </button>
        </div>
      </div>

      {/* MAP - Left on Desktop, Top on Mobile */}
      <div className="w-full lg:w-[70%] lg:order-1 h-[50vh] lg:h-screen relative z-10">
        <Map
          defaultCenter={userLoc}
          defaultZoom={16}
          zoomControl={false}
          mapId="2c793709f64f0dcb968f2b27"
          disableDefaultUI
          colorScheme="LIGHT"
          styles={MAP_STYLES}
        >
          <NavigationMapView 
             userLoc={userLoc} 
             targetLoc={targetLoc} 
             tMode={tMode} 
             targetName={targetName}
             etaMinutes={etaMinutes}
          />
        </Map>
      </div>
    </div>
  );
}

function NavigationMapView({ userLoc, targetLoc, targetName, etaMinutes }: any) {
  const map = useMap();
  const geometryLib = useMapsLibrary("geometry");
  const coreLib = useMapsLibrary("core");
  const prevLocRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (map) {
      map.setCenter(userLoc);
      map.setTilt(45);
      
      if (prevLocRef.current && geometryLib && (prevLocRef.current.lat !== userLoc.lat || prevLocRef.current.lng !== userLoc.lng)) {
        const p1 = new coreLib!.LatLng(prevLocRef.current.lat, prevLocRef.current.lng);
        const p2 = new coreLib!.LatLng(userLoc.lat, userLoc.lng);
        const distance = geometryLib.spherical.computeDistanceBetween(p1, p2);
        if (distance > 1) { // Only update heading if moved a bit to prevent jitter
           const heading = geometryLib.spherical.computeHeading(p1, p2);
           map.setHeading(heading);
        }
      } else if (!prevLocRef.current) {
        map.setHeading(0);
      }
      
      prevLocRef.current = userLoc;
    }
  }, [userLoc, map, geometryLib, coreLib]);

  return (
    <>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#10B981] text-white px-4 py-3 rounded-full shadow-lg border border-black/10 animate-in slide-in-from-top-4 duration-500">
        <Navigation className="w-4 h-4 fill-white animate-pulse" />
        <span className="text-xs font-bold">{targetName} ({etaMinutes} min)</span>
      </div>

      <div className="absolute bottom-8 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 16) + 1)} 
          className="w-12 h-12 bg-white shadow-[2px_2px_0px_0px_#ccc] border border-black/10 flex items-center justify-center font-bold text-2xl hover:bg-slate-50 rounded-full"
        >
          +
        </button>
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 16) - 1)} 
          className="w-12 h-12 bg-white shadow-[2px_2px_0px_0px_#ccc] border border-black/10 flex items-center justify-center font-bold text-2xl hover:bg-slate-50 rounded-full"
        >
          -
        </button>
      </div>

      <AdvancedMarker position={userLoc} zIndex={100}>
         <div className="relative flex items-center justify-center w-8 h-8">
            <div className="absolute w-full h-full bg-[#2563EB] rounded-full animate-ping opacity-30"></div>
            <div className="absolute w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="w-2.5 h-2.5 bg-[#2563EB] rounded-full"></div>
            </div>
         </div>
      </AdvancedMarker>

      <AdvancedMarker position={targetLoc} zIndex={50}>
         <div className="bg-black text-white px-3 py-1.5 rounded-sm font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-1.5 border border-white/20">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            {etaMinutes} min
         </div>
      </AdvancedMarker>
    </>
  );
}

export default function NavigasiPage() {
  if (!GOOGLE_MAPS_KEY) return <div>Maps API Key Required</div>;
  
  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly" libraries={["places", "geometry"]}>
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-50">Memuat...</div>}>
        <NavigasiContent />
      </Suspense>
    </APIProvider>
  );
}