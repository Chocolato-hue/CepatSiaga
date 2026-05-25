"use client";

import { useEffect, useState } from "react";
import { useMapsLibrary, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { MapPin, Navigation, Clock, Activity, CheckCircle2 } from "lucide-react";
import { getTextSearchParams, isValidFacility } from "@/lib/places";
import { checkSatuSehatVerification } from "@/lib/satusehat";

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
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const routesLib = useMapsLibrary("routes");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentType = overrideType || triageData.facility_type;

  useEffect(() => {
    if (!placesLib || !routesLib || !userLocation) return;
    
    let type = "hospital";
    if (currentType === "clinic") type = "medical_clinic";
    if (currentType === "pharmacy") type = "pharmacy";
    if (currentType === "police") type = "police";

    const fetchFacilities = async () => {
      try {
        setLoading(true);
        // Only use prefetched if not overriden
        let foundPlaces = (!overrideType && prefetchedPlaces) ? prefetchedPlaces : [];

        if (foundPlaces.length === 0) {
          // searchByText mirrors the Google Maps search bar — far more accurate
          // than searchNearby with includedTypes, which uses loose type tagging.
          const searchParams = getTextSearchParams(currentType, userLocation.lat, userLocation.lng);
          const response = await placesLib.Place.searchByText(searchParams).catch(() => ({ places: [] }));
          
          let combinedPlaces = [...(response.places || [])];
          
          // Filter duplicates and valid names
          const seenAddresses = new Set();
          const seenCoords = new Set();
          foundPlaces = combinedPlaces.filter((p: any) => {
            if (!isValidFacility(p, currentType)) return false;
            
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
            if (seenAddresses.has(p.formattedAddress)) return false;
            seenAddresses.add(p.formattedAddress);
            return true;
          }).slice(0, 10);
        } else {
          // ensure we don't do too many routes, cap at 10
          foundPlaces = foundPlaces.slice(0, 10);
        }
        
        // Calculate ETA for each
        const placesWithRoutes = await Promise.all(
          foundPlaces.map(async (place) => {
            if (!place.location) return place;
            const isVerified = await checkSatuSehatVerification(place.displayName || "", currentType);
            
            try {
              const routeResponse = await routesLib.Route.computeRoutes({
                origin: userLocation,
                destination: place.location,
                travelMode: travelMode === "TWO_WHEELER" ? "DRIVING" : travelMode,
                routingPreference: travelMode === "DRIVING" || travelMode === "TWO_WHEELER" ? "TRAFFIC_AWARE" : undefined,
                fields: ["durationMillis", "distanceMeters", "path"]
              });
              
              const route = routeResponse.routes?.[0];
              const extractedLocation = place.location ? {
                lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
                lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
              } : null;

              return {
                id: place.id,
                displayName: place.displayName,
                location: extractedLocation,
                formattedAddress: place.formattedAddress,
                nationalPhoneNumber: place.nationalPhoneNumber,
                isOpenNow: typeof place.isOpen === 'function' ? place.isOpen() : null,
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                eta: route?.durationMillis ? Math.ceil((route.durationMillis as unknown as number) / 60000) : null,
                distance: route?.distanceMeters,
                path: route?.path,
                isSatusehatVerified: isVerified
              };
            } catch (e) {
              const extractedLocation = place.location ? {
                lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
                lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
              } : null;

              return {
                id: place.id,
                displayName: place.displayName,
                location: extractedLocation,
                formattedAddress: place.formattedAddress,
                nationalPhoneNumber: place.nationalPhoneNumber,
                isOpenNow: typeof place.isOpen === 'function' ? place.isOpen() : null,
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                isSatusehatVerified: isVerified
              };
            }
          })
        );
        
        const validPlaces = (placesWithRoutes as any[]).filter((p: any) => {
           // We removed the overly strict rating filters to ensure closest hospitals (e.g. Rumah Sakit Advent)
           // are not accidentally hidden due to having fewer than 100 reviews on Google Maps. 
           // We will instead use the hybrid scoring below to naturally sort better options.
           if (p.rating != null && p.userRatingCount != null) {
              if (currentType === "hospital") {
                if (p.rating < 2.5 || p.userRatingCount < 10) {
                  return false;
                }
              }

              if (currentType === "clinic") {
                if (p.rating < 2.5 || p.userRatingCount < 5) {
                  return false;
                }
              }

              if (currentType === "pharmacy") {
                if (p.rating < 2.5 || p.userRatingCount < 5) {
                  return false;
                }
              }
           }
           return true;
        });
        
        // Use all valid places; fall back to unfiltered if too few pass
        let placesToUse =
          validPlaces.length >= 2
            ? validPlaces
            : placesWithRoutes;

        // Sort like Google Maps: closest + highest rating (SatuSehat is a badge only, not a filter)
        const sorted = placesToUse
          .map((p: any) => {
             // Primary: distance/ETA (same weight as GMaps "nearest")
             let baseScore = (p.eta || 999) + ((p.distance || 0) / 1000 * 1.0);
             
             // Small penalty if outside of the target city
             if (cityName && p.formattedAddress && !p.formattedAddress.toLowerCase().includes(cityName.toLowerCase())) {
                 baseScore += 30;
             }
             
             // Small bonus for Satusehat Verification (badge, not filter)
             if (p.isSatusehatVerified) {
                 baseScore -= 5;
             }

             // Rating bonus — mirrors GMaps weighting: nearby high-rated rises above nearby low-rated
             if (p.rating && p.rating >= 3.5) {
                 const ratingBoost = (p.rating - 3.5) * 3; // e.g. 4.5 stars = -3pts
                 const popularityBoost = Math.min((p.userRatingCount || 0) / 500, 4); // max 4pts
                 baseScore -= (ratingBoost + popularityBoost);
             }

             return { ...p, score: baseScore };
          })
          .sort((a, b) => a.score - b.score)
          .slice(0, 5);
        setFacilities(sorted);
        
        if (sorted.length > 0 && !selectedFacility) {
          setSelectedFacility(sorted[0]);
        }
      } catch (err: any) {
        setError(err.message || (lang === "en" ? "Failed to load facilities." : "Gagal memuat fasilitas."));
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesLib, routesLib, userLocation, currentType, overrideType, travelMode]);

  const facilityTypes = [
    { id: "hospital", label: lang === "en" ? "🔴 Hospitals" : "🔴 Rumah Sakit" },
    { id: "clinic", label: lang === "en" ? "🔵 Clinics" : "🔵 Klinik" },
    { id: "pharmacy", label: lang === "en" ? "🟢 Pharmacies" : "🟢 Apotek" }
  ];

  if (loading && facilities.length === 0) {
    return (
      <div className="space-y-4 animate-pulse pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-32 border border-slate-100"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-xl">{error}</div>;
  }

  const sortedByPopularity = [...facilities]
    .filter(fac => fac.userRatingCount && fac.userRatingCount > 0)
    .sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0));
    
  const top1Id = sortedByPopularity[0]?.id;
  const top2Id = sortedByPopularity[1]?.id;

  return (
    <div className="space-y-4">
      {/* Pills and Badge */}
      <div className="mb-6 space-y-4">
        {overrideType && (
          <div className="text-xs bg-[#2563EB]/10 text-[#2563EB] px-3 py-2 rounded-lg font-medium inline-flex items-center gap-2">
            <span>✨</span> Gemini merekomendasikan <strong>{facilityTypes.find(t => t.id === triageData.facility_type)?.label || triageData.facility_type}</strong> untuk kondisi ini
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {facilityTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                if (type.id !== currentType) {
                  setOverrideType(type.id === triageData.facility_type ? null : type.id);
                  setFacilities([]);
                }
              }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                currentType === type.id
                  ? "bg-black text-white"
                  : "bg-white text-black/50 border border-black/10 hover:border-black/30"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-hide py-2">
        {facilities.map((fac, idx) => {
        const isSelected = selectedFacility?.id === fac.id;
        const isPrimary = idx === 0;
        const isTop1 = fac.id === top1Id && top1Id;
        const isTop2 = fac.id === top2Id && top2Id;
        
        const cardClass = isSelected 
          ? "border-2 border-blue-500 bg-blue-50 border-l-4 border-l-blue-600 rounded-none p-3 relative cursor-pointer flex-shrink-0 flex flex-col"
          : "border border-slate-200 bg-white hover:border-black/30 transition-all duration-200 rounded-none p-3 relative cursor-pointer flex-shrink-0 flex flex-col";

        return (
          <div 
            key={fac.id || idx} 
            onClick={() => {
              setSelectedFacility(fac);
              document.getElementById('map-container-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={cardClass}
          >
            <div className="flex-1">
              {isPrimary && !isSelected && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#FF3B30] mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse"></div>
                  {lang === "en" ? "Fastest" : "Rekomendasi Tercepat"}
                </span>
              )}
              {isSelected && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563EB] mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#2563EB]"></div>
                  {lang === "en" ? "Selected Route" : "Rute Dipilih"}
                </span>
              )}
              <h3 className="font-serif text-xl text-black leading-tight italic line-clamp-1">
                {fac.displayName}
              </h3>
              <p className="text-xs text-black/50 mt-1 line-clamp-1 font-medium">
                {fac.formattedAddress}
              </p>
              
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {fac.isOpenNow !== null ? (
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${fac.isOpenNow ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#FF3B30]/10 text-[#FF3B30]"}`}>
                    {fac.isOpenNow ? "Buka" : "Tutup"}
                  </span>
                ) : null}
                <span className="px-2 py-0.5 bg-black/5 text-[9px] font-bold uppercase tracking-widest text-black/60">
                  {triageData.facility_type}
                </span>
                {fac.isSatusehatVerified && (
                  <span className="inline-flex items-center gap-1 bg-[#10B981] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-2" />
                    Satusehat Verified
                  </span>
                )}
              </div>

              <div className="flex p-0 mt-3 items-center gap-4 text-xs font-bold text-black uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  {fac.eta ? `${fac.eta} min` : "N/A"}
                </div>
                <div className="w-[1px] h-3 bg-black/20"></div>
                <div className="flex items-center gap-1 text-black/40">
                  {fac.distance ? `${(fac.distance / 1000).toFixed(1)} km` : "N/A"}
                </div>
              </div>
            </div>
            
            {(fac.nationalPhoneNumber || fac.rating) && (
              <div className="mt-4 pt-3 border-t border-black/5 flex flex-col gap-1">
                {fac.nationalPhoneNumber && (
                  <div className="text-[10px] font-bold text-black flex items-center gap-1 uppercase tracking-wide truncate">
                    <span>📞</span> {fac.nationalPhoneNumber}
                  </div>
                )}
                {fac.rating && (
                  <div className="mt-1 flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <div className={`font-bold flex items-center gap-1 ${
                        fac.rating >= 4.0 ? 'text-green-600' : 
                        fac.rating >= 3.0 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        ⭐ {fac.rating} <span className="text-black/30 font-normal ml-1">•</span> <span className="text-black/60 font-semibold ml-1">{fac.userRatingCount > 1000 ? (fac.userRatingCount/1000).toFixed(1) + 'rb' : fac.userRatingCount}</span>
                      </div>
                      {isTop1 && (
                        <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded-sm font-bold uppercase tracking-widest border border-red-200">
                          ❤️ Populer
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>

      {/* WhatsApp Share Button Feature */}
      {selectedFacility && (
         <button 
           onClick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             const userLat = userLocation.lat;
             const userLng = userLocation.lng;
             const msgText = lang === 'en' 
               ? `I am in an emergency. My location: https://maps.google.com/?q=${userLat},${userLng} — I am heading to ${selectedFacility.displayName}`
               : `Saya dalam keadaan darurat. Lokasi saya: https://maps.google.com/?q=${userLat},${userLng} — Saya menuju ${selectedFacility.displayName}`;
             const url = `https://wa.me/?text=${encodeURIComponent(msgText)}`;
             window.open(url, '_blank');
           }}
           className="mt-4 w-full animate-in fade-in duration-300 bg-[#25D366] text-white rounded-none border border-black shadow-[4px_4px_0_0_#000] px-5 py-4 flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs hover:bg-[#20BE5A] transition-colors active:translate-y-1 active:translate-x-1 active:shadow-none"
         >
           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
           </svg>
           {lang === 'en' ? "Share Location" : "Bagikan Lokasi"}
         </button>
      )}
    </div>
  );
}