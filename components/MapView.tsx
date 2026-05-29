"use client";

import { useEffect, useState } from "react";
import { useMap, Marker, InfoWindow, useMapsLibrary } from "@vis.gl/react-google-maps";

const createSVGMarker = (type: string, isSelected: boolean) => {
  let bg = "#F97316";
  let pulseColor = "225, 29, 72";
  let iconPath = `<circle cx="28" cy="28" r="8" fill="white"/>`;
  
  if (type === "hospital") {
    bg = "#E11D48"; // Rose/Red
    pulseColor = "225, 29, 72";
    iconPath = `
      <rect x="24" y="19" width="8" height="18" fill="white" rx="1.5"/>
      <rect x="19" y="24" width="18" height="8" fill="white" rx="1.5"/>
    `;
  } else if (type === "clinic") {
    bg = "#0EA5E9"; // Sky
    pulseColor = "14, 165, 233";
    iconPath = `
      <circle cx="28" cy="28" r="10" fill="transparent" stroke="white" stroke-width="3"/>
      <circle cx="28" cy="28" r="4" fill="white"/>
    `;
  } else if (type === "pharmacy") {
    bg = "#10B981"; // Emerald
    pulseColor = "16, 185, 129";
    iconPath = `
      <rect x="18" y="21" width="20" height="14" rx="7" fill="transparent" stroke="white" stroke-width="3"/>
      <line x1="18" y1="28" x2="38" y2="28" stroke="white" stroke-width="3"/>
    `;
  }

  const s = isSelected ? 1.4 : 1.0;
  const size = 56 * s;
  const center = size / 2;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 56 56">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>
        <style>
          @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes pulseGlow {
            0% { filter: drop-shadow(0 4px 6px rgba(${pulseColor}, 0.2)); }
            50% { filter: drop-shadow(0 8px 16px rgba(${pulseColor}, 0.6)); }
            100% { filter: drop-shadow(0 4px 6px rgba(${pulseColor}, 0.2)); }
          }
          .marker-circle {
            transform-origin: center;
            animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both, pulseGlow 2s infinite ease-in-out 0.5s;
          }
          ${isSelected ? '.marker-circle { animation: none; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4)); transform: scale(1.05); }' : ''}
        </style>
        <g class="marker-circle">
          <circle cx="28" cy="28" r="20" fill="white" filter="url(#shadow)"/>
          <circle cx="28" cy="28" r="18.5" fill="${bg}"/>
          ${iconPath}
        </g>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(center, center)
  };
};

const createUserSVGMarker = (color: string) => ({
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="${color}" opacity="0.3"/>
      <circle cx="16" cy="16" r="8" fill="white" stroke="${color}" stroke-width="3"/>
    </svg>
  `)}`,
  scaledSize: new google.maps.Size(32, 32),
  anchor: new google.maps.Point(16, 16)
});

export default function MapView({ userLocation, facilities, selectedFacility, setSelectedFacility, travelMode = "DRIVING", facilityType, isNavigating }: any) {
  const map = useMap();
  const coreLib = useMapsLibrary("core");
  const [openInfoWindowId, setOpenInfoWindowId] = useState<string | null>(null);

  useEffect(() => {
    if (!map || !userLocation || !coreLib) return;
    
    map.setTilt(0);
    map.setHeading(0);

    if (isNavigating) {
      map.panTo(userLocation);
      return;
    }

    if (!selectedFacility && facilities.length > 0) {
      const bounds = new coreLib.LatLngBounds();
      bounds.extend(userLocation);
      facilities.forEach((f: any) => {
        if (f.location) bounds.extend(f.location);
      });
      map.fitBounds(bounds, 50);
    } else if (selectedFacility && selectedFacility.location) {
      map.setCenter(selectedFacility.location);
      map.setZoom(15);
    } else if (!selectedFacility) {
      map.setCenter(userLocation);
      map.setZoom(14);
    }
  }, [map, userLocation, coreLib, facilities, selectedFacility, isNavigating]);

  if (!userLocation) return null;

  return (
    <>
      <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={() => {
            if (userLocation && map) {
              map.panTo(userLocation);
              map.setZoom(15);
            }
          }} 
          className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center font-bold text-xl hover:bg-slate-50 transition-colors"
          title="My Location"
        >
          🎯
        </button>
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 14) + 1)} 
          className="w-10 h-10 bg-white shadow-[2px_2px_0px_0px_#000] border border-black flex items-center justify-center font-bold text-xl hover:bg-slate-50 transition-colors"
        >
          +
        </button>
        <button 
          onClick={() => map?.setZoom((map.getZoom() || 14) - 1)} 
          className="w-10 h-10 bg-white shadow-[2px_2px_0px_0px_#000] border border-black flex items-center justify-center font-bold text-xl hover:bg-slate-50 transition-colors"
        >
          -
        </button>
      </div>

      <Marker 
        position={userLocation} 
        zIndex={100}
        icon={createUserSVGMarker("#2563EB")}
      />

      {facilities.map((fac: any, idx: number) => {
        const isSelected = selectedFacility?.id === fac.id;
        
        const typeStr = facilityType || "hospital";
        const icon = createSVGMarker(typeStr, isSelected);

        const isInfoWindowOpen = openInfoWindowId === fac.id;

        return (
          <div key={fac.id || idx}>
            <Marker 
              position={fac.location} 
              title={fac.displayName}
              zIndex={isSelected ? 50 : 10}
              icon={icon}
              onClick={() => {
                if (setSelectedFacility) setSelectedFacility(fac);
                setOpenInfoWindowId(fac.id);
              }}
            />
            {isInfoWindowOpen && (
              <InfoWindow 
                position={fac.location}
                onCloseClick={() => {
                  setOpenInfoWindowId("CLOSED_" + fac.id);
                }}
                headerContent={null}
              >
                <div className="flex flex-col p-3 min-w-[240px] max-w-[280px]">
                  <h3 className="font-serif italic text-lg text-slate-800 font-black leading-tight mb-1.5">{fac.displayName}</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4 pr-2">
                    {fac.formattedAddress}
                  </p>
                  
                  {fac.eta && fac.distance && (
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-sky-50 text-sky-700 border border-sky-100 font-bold px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest">
                          {fac.eta} min
                        </span>
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          {(fac.distance / 1000).toFixed(1)} km
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.displayName + ' ' + fac.formattedAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center gap-2 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl shadow-md shadow-sky-600/20 text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]"
                  >
                    Buka di Maps <span className="text-sm leading-none">↗</span>
                  </a>
                </div>
              </InfoWindow>
            )}
          </div>
        );
      })}
    </>
  );
}
