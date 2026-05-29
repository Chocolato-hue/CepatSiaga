"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface FacilityListProps {
  triageData: any;
  userLocation: { lat: number; lng: number };
  facilities: any[];
  setFacilities: React.Dispatch<React.SetStateAction<any[]>>;
  selectedFacility: any | null;
  setSelectedFacility: React.Dispatch<React.SetStateAction<any | null>>;
  travelMode: "DRIVING" | "TWO_WHEELER" | "WALKING";
  lang: "id" | "en";
  cityName?: string | null;
  prefetchedPlaces?: any[] | null;
  overrideType: string | null;
  setOverrideType: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function FacilityList({ 
  triageData, 
  userLocation, 
  facilities,
  setFacilities,
  selectedFacility,
  setSelectedFacility,
  travelMode,
  lang,
  cityName,
  prefetchedPlaces,
  overrideType,
  setOverrideType
}: FacilityListProps) {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentType = overrideType || triageData.facility_type;

  useEffect(() => {
    if (!userLocation) return;
    
    const normalizedType = currentType?.toLowerCase().trim() || "";
    let type = "hospital";
    if (normalizedType.includes("clinic") || normalizedType.includes("klinik")) type = "clinic";
    if (normalizedType.includes("pharmacy") || normalizedType.includes("apotek")) type = "pharmacy";
    if (normalizedType.includes("police") || normalizedType.includes("polisi")) type = "police";

    const fetchFacilities = async () => {
      try {
        setLoading(true);
        setError("");
        
        const res = await fetch("/api/facilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: userLocation.lat,
            lng: userLocation.lng,
            type: type,
            city: cityName || ""
          })
        });

        if (!res.ok) {
          const bodyText = await res.text();
          console.error("Facility fetch error:", bodyText);
          throw new Error("Failed to fetch facilities");
        }

        const data = await res.json();
        const sorted = data.facilities || [];
        setFacilities(sorted);
      } catch (err: any) {
        setError(err.message || (lang === "en" ? "Failed to load facilities." : "Gagal memuat fasilitas."));
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, currentType, cityName]);

  const facilityTypes = [
    { id: "hospital", label: lang === "en" ? "🔴 Hospitals" : "🔴 Rumah Sakit" },
    { id: "clinic", label: lang === "en" ? "🔵 Clinics" : "🔵 Klinik" },
    { id: "pharmacy", label: lang === "en" ? "🟢 Pharmacies" : "🟢 Apotek" }
  ];

  const sortedByPopularity = [...facilities]
    .filter(fac => fac.userRatingCount && fac.userRatingCount > 0)
    .sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0));
    
  const top1Id = sortedByPopularity[0]?.id;
  const top2Id = sortedByPopularity[1]?.id;
  
  const getKelasColor = (kelas: string) => {
    const k = kelas?.toUpperCase();
    if (k === 'A') return "bg-teal-100 text-teal-700 border-teal-200";
    if (k === 'B') return "bg-blue-100 text-blue-700 border-blue-200";
    if (k === 'C') return "bg-amber-100 text-amber-700 border-amber-200";
    if (k === 'D') return "bg-gray-100 text-gray-700 border-gray-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <div className="flex flex-col h-full bg-white md:bg-[#FAFAFA] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-200">
      
      {/* Sticky Header / Category Tabs */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-slate-100 sticky top-0 z-10 flex-shrink-0">
        {overrideType && (
          <div className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-4 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 mb-3 w-full shadow-sm">
            <span className="text-sm">✨</span> 
            <span>Gemini {lang === 'en' ? 'recommends' : 'merekomendasikan'}: <strong className="text-sky-900 border-b border-sky-200 pb-0.5 ml-1">{facilityTypes.find(t => t.id === triageData.facility_type)?.label || triageData.facility_type}</strong></span>
          </div>
        )}
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center justify-start">
          {facilityTypes.map((type) => {
             const isActive = currentType === type.id;
             let icon = "";
             if (type.id === "hospital") icon = "🏥";
             if (type.id === "clinic") icon = "🩺";
             if (type.id === "pharmacy") icon = "💊";

             return (
              <button
                key={type.id}
                onClick={() => {
                  if (!isActive) {
                    setFacilities([]); // Clear immediately so skeleton shows up
                    setOverrideType(type.id === triageData.facility_type ? null : type.id);
                  }
                }}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? "bg-slate-800 text-white shadow-md shadow-slate-800/10"
                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <span className="text-sm">{icon}</span> {type.label.replace(/^[🔴🔵🟢]\s/, "")}
              </button>
             );
          })}
        </div>
      </div>

      {/* Facilities List Area (scrollable) */}
      <div className="flex flex-col overflow-y-auto flex-1 space-y-3 scrollbar-hide p-4 md:p-5 bg-slate-50 relative min-h-[300px]">
        {error && (
          <div className="text-red-500 p-4 bg-red-50 border border-red-100 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {(loading && facilities.length === 0) ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-36 border border-slate-100 shadow-sm"></div>
            ))}
          </div>
        ) : (!loading && facilities.length === 0 && !error) ? (
          <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm my-auto mx-4">
             <div className="text-3xl mb-3 opacity-50">🏥</div>
             <p className="text-slate-500 font-bold text-sm tracking-wide">
               {lang === "en" ? "No facilities found for this category nearby." : "Tidak ada fasilitas untuk kategori ini di sekitar lokasi Anda."}
             </p>
          </div>
        ) : facilities.map((fac, idx) => {
        const isSelected = selectedFacility?.id === fac.id;
        const isPrimary = idx === 0;
        const isTop1 = fac.id === top1Id && top1Id;
        const isTop2 = fac.id === top2Id && top2Id;
        
        const cardClass = isSelected 
          ? "border-2 border-sky-500 bg-sky-50/50 rounded-2xl p-4 relative cursor-pointer flex-shrink-0 flex flex-col shadow-[0_0_15px_-3px_rgba(14,165,233,0.3)] transition-all z-10 scale-[1.02]"
          : "border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition-all duration-200 rounded-2xl p-4 relative cursor-pointer flex-shrink-0 flex flex-col";

        const toTitleCase = (str: string) => {
          if (!str) return '';
          let replaced = str.toUpperCase()
            .replace(/\bRSU\b/g, 'Rumah Sakit Umum')
            .replace(/\bRSIA\b/g, 'Rumah Sakit Ibu dan Anak')
            .replace(/\bRSK JANTUNG\b/g, 'Rumah Sakit Khusus Jantung')
            .replace(/\bRSK PARU\b/g, 'Rumah Sakit Khusus Paru')
            .replace(/\bRSK JIWA\b/g, 'Rumah Sakit Khusus Jiwa')
            .replace(/\bRSK MATA\b/g, 'Rumah Sakit Khusus Mata')
            .replace(/\bRSK GM\b/g, 'Rumah Sakit Khusus Gigi dan Mulut')
            .replace(/\bRSK GIGI DAN MULUT\b/g, 'Rumah Sakit Khusus Gigi dan Mulut')
            .replace(/\bRSK BEDAH\b/g, 'Rumah Sakit Khusus Bedah')
            .replace(/\bRSK ORTHOPEDI\b/g, 'Rumah Sakit Khusus Orthopedi')
            .replace(/\bRS BERGERAK\b/g, 'Rumah Sakit Bergerak')
            .replace(/\bRSK THT-KL\b/g, 'Rumah Sakit Khusus THT-KL')
            .replace(/\bRSK THT\b/g, 'Rumah Sakit Khusus THT')
            .replace(/\bRSK KANKER\b/g, 'Rumah Sakit Khusus Kanker')
            .replace(/\bRSK OTAK\b/g, 'Rumah Sakit Khusus Otak')
            .replace(/\bRSK INFEKSI\b/g, 'Rumah Sakit Khusus Infeksi')
            .replace(/\bRSK GINJAL\b/g, 'Rumah Sakit Khusus Ginjal')
            .replace(/\bRSKO\b/g, 'Rumah Sakit Ketergantungan Obat')
            .replace(/\bRSUD\b/g, 'Rumah Sakit Umum Daerah')
            .replace(/\bRSUP\b/g, 'Rumah Sakit Umum Pusat')
            .replace(/\bRSB\b/g, 'Rumah Sakit Bersalin')
            .replace(/\bRS\b/g, 'Rumah Sakit');
            
          return replaced.toLowerCase().split(' ').map(word => {
            if (['dan', 'di', 'ke', 'dari'].includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
          }).join(' ');
        };

        return (
          <div 
            key={fac.id || idx} 
            onClick={() => {
              setSelectedFacility(fac);
              document.getElementById('map-container-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            style={{ animationDelay: `${idx * 100}ms` }}
            className={`${cardClass} animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both`}
          >
            <div className="flex-1">
              {isPrimary && !isSelected && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-2.5 bg-rose-50 px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  {lang === "en" ? "Fastest" : "Tercepat"}
                </span>
              )}
              {isSelected && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-2.5 bg-sky-100 px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                  {lang === "en" ? "Selected Route" : "Rute Dipilih"}
                </span>
              )}
              <h3 className="font-serif text-xl text-slate-800 font-bold leading-tight line-clamp-2">
                {toTitleCase(fac.displayName)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1 font-medium leading-relaxed">
                {toTitleCase(fac.formattedAddress)}
              </p>
              
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {fac.isOpenNow !== null ? (
                  <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md ${fac.isOpenNow ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                    {fac.isOpenNow ? "Buka" : "Tutup"}
                  </span>
                ) : null}
                <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  {overrideType || triageData.facility_type}
                </span>
                
                {fac.kelas && (
                  <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${getKelasColor(fac.kelas)}`}>
                    Kelas {fac.kelas}
                  </span>
                )}
                
                {(fac.kemenkes_verified || fac.isSatusehatVerified) && (
                  <span className="inline-flex items-center gap-1 bg-sky-600 text-white px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest shadow-sm">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-2" />
                    Verified
                  </span>
                )}
              </div>

              {fac.eta ? (
                <div className="flex p-0 mt-4 items-center gap-3 text-xs font-bold text-slate-800 uppercase tracking-widest">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-lg text-slate-600">
                    🕒 {fac.eta} MIN
                  </div>
                </div>
              ) : null}
            </div>
            
            {(fac.nationalPhoneNumber || (!fac.kemenkes_verified && fac.rating !== null)) && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                {fac.nationalPhoneNumber && (
                  <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1 uppercase tracking-widest truncate">
                    <span>📞</span> 
                    {fac.kemenkes_verified ? (
                       <a href={`tel:${fac.nationalPhoneNumber.replace(/\D/g, '')}`} className="text-sky-600 hover:text-sky-700 transition-colors">
                         {fac.nationalPhoneNumber}
                       </a>
                    ) : (
                       fac.nationalPhoneNumber
                    )}
                  </div>
                )}
                {!fac.kemenkes_verified && (
                  <>
                    {fac.rating ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-widest">
                          <div className={`font-bold flex items-center gap-1 ${
                            fac.rating >= 4.0 ? 'text-emerald-600' : 
                            fac.rating >= 3.0 ? 'text-amber-600' : 'text-rose-500'
                          }`}>
                            ⭐ {fac.rating} <span className="text-slate-300 font-normal ml-0.5">•</span> <span className="text-slate-400 font-bold ml-0.5">{fac.userRatingCount > 1000 ? (fac.userRatingCount/1000).toFixed(1) + 'rb' : fac.userRatingCount}</span>
                          </div>
                          {isTop1 && (
                            <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest ml-1">
                              🔥 Populer
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1 text-[10px]">
                          <div className="font-bold flex items-center gap-1 text-slate-400 uppercase tracking-widest">
                            ⭐ Unavailable
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {isSelected && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const userLat = userLocation.lat;
                  const userLng = userLocation.lng;
                  const msgText = lang === 'en' 
                    ? `I am in an emergency. My location: https://maps.google.com/?q=${userLat},${userLng} — I am heading to ${fac.displayName}`
                    : `Saya dalam keadaan darurat. Lokasi saya: https://maps.google.com/?q=${userLat},${userLng} — Saya menuju ${fac.displayName}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(msgText)}`;
                  window.open(url, '_blank');
                }}
                className="mt-4 w-full animate-in fade-in duration-300 bg-[#25D366] text-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] hover:bg-[#20BE5A] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {lang === 'en' ? "Share Location" : "Bagikan Lokasi"}
              </button>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
