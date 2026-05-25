"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  lang: "id" | "en";
}

export default function LocationSearch({ onLocationSelect, lang }: LocationSearchProps) {
  const placesLib = useMapsLibrary("places");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placesLib || !searchContainerRef.current) return;

    // Clear existing children logic if re-rendered
    searchContainerRef.current.innerHTML = '';

    // @ts-expect-error PlaceAutocompleteElement is valid in recent API versions
    const placeAutocomplete = new placesLib.PlaceAutocompleteElement({
      componentRestrictions: { country: 'id' },
      types: ['geocode']
    });

    placeAutocomplete.style.width = '100%';
    placeAutocomplete.style.border = 'none';
    placeAutocomplete.style.outline = 'none';
    
    // Attempt to set placeholder if the element exposes it, 
    // though Web Components typically wrap the input.
    // Use an attribute just in case depending on GMaps version:
    // (We'll leave styling inside the container)
    // placeAutocomplete.setAttribute("placeholder", lang === "en" ? "Change starting location..." : "Ubah lokasi asal...");

    searchContainerRef.current.appendChild(placeAutocomplete);

    const handlePlaceSelect = async (event: any) => {
      const place = event.place;
      await place.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] });
      
      if (place.location) {
        const lat = place.location.lat();
        const lng = place.location.lng();
        onLocationSelect({ lat, lng });
      }
    };

    placeAutocomplete.addEventListener('gmp-placeselect', handlePlaceSelect);

    return () => {
      placeAutocomplete.removeEventListener('gmp-placeselect', handlePlaceSelect);
      if (searchContainerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        searchContainerRef.current.innerHTML = '';
      }
    };
  }, [placesLib, onLocationSelect, lang]);

  return (
    <div className="relative w-full mb-4 group z-50">
       <div 
         ref={searchContainerRef}
         className="w-full bg-white border border-black/10 p-2 text-sm shadow-sm focus-within:shadow-md transition-shadow rounded-xl"
       >
         {/* PlaceAutocompleteElement will be injected here */}
       </div>
    </div>
  );
}
