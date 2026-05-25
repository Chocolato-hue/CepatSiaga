"use client";

import { useEffect, useRef } from "react";
import { useMap, Marker, useMapsLibrary } from "@vis.gl/react-google-maps";

const createSVGMarker = (color: string) => ({
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0 C7.16 0 0 7.16 0 16 C0 28 16 40 16 40 C16 40 32 28 32 16 C32 7.16 24.84 0 16 0Z" 
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `)}`,
  scaledSize: new google.maps.Size(32, 40),
  anchor: new google.maps.Point(16, 40)
});

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

export default function MapView({ userLocation, facilities, selectedFacility, travelMode = "DRIVING", facilityType, isNavigating }: any) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const coreLib = useMapsLibrary("core");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const fallbackLineRef = useRef<google.maps.Polyline | null>(null);

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
    } else if (!selectedFacility) {
      map.setCenter(userLocation);
      map.setZoom(14);
    }
  }, [map, userLocation, coreLib, facilities, selectedFacility, isNavigating]);

  useEffect(() => {
    if (!map || !routesLib || !coreLib) return;

    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    if (!selectedFacility?.location?.lat || !selectedFacility?.location?.lng || !userLocation?.lat || !userLocation?.lng) {
      if (fallbackLineRef.current) fallbackLineRef.current.setMap(null);
      return;
    }

    if (isNavigating) return;

    if (fallbackLineRef.current) fallbackLineRef.current.setMap(null);

    routesLib.Route.computeRoutes({
      origin: { lat: userLocation.lat, lng: userLocation.lng },
      destination: { lat: selectedFacility.location.lat, lng: selectedFacility.location.lng },
      travelMode: travelMode === "TWO_WHEELER" ? "DRIVING" : (travelMode as any),
      routingPreference: travelMode === "DRIVING" || travelMode === "TWO_WHEELER" ? "TRAFFIC_AWARE" : undefined,
      fields: ["path", "viewport"],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const mainPolylines = routes[0].createPolylines();
        mainPolylines.forEach((p: google.maps.Polyline) => {
          const path = p.getPath();
          const glowLine = new google.maps.Polyline({
            path: path,
            strokeColor: "#EF4444",
            strokeWeight: 11,
            strokeOpacity: 0.15,
            map: map,
            zIndex: 1
          });
          
          p.setOptions({
             strokeColor: "#EF4444",
             strokeOpacity: 1,
             strokeWeight: 7,
             zIndex: 2,
             map: map,
             icons: [{
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, fillOpacity: 1, scale: 2 },
                offset: '100%',
                repeat: '100px'
             }]
          });
          
          polylinesRef.current.push(glowLine, p);
        });
        
        if (routes[0].viewport) map.fitBounds(routes[0].viewport);
      }
    }).catch(e => {
       console.log("Route rendering failed:", e);
       // Silent Fallback
       fallbackLineRef.current = new google.maps.Polyline({
          path: [
            userLocation, 
            selectedFacility.location
          ],
          strokeColor: "#EF4444",
          strokeOpacity: 0.8,
          strokeWeight: 4,
          icons: [{
             icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4 },
             offset: "0",
             repeat: "20px"
          }],
          map: map
       });
    });

  }, [routesLib, map, selectedFacility, userLocation, coreLib, travelMode, isNavigating]);

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
        
        let bg = "#F97316";
        if (facilityType === "hospital") bg = "#EF4444";
        else if (facilityType === "clinic") bg = "#3B82F6";
        else if (facilityType === "pharmacy") bg = "#10B981";

        const icon = createSVGMarker(bg);
        if (isSelected) {
            icon.scaledSize = new google.maps.Size(40, 50);
            icon.anchor = new google.maps.Point(20, 50);
        }

        return (
          <Marker 
            key={fac.id || idx} 
            position={fac.location} 
            title={fac.displayName}
            zIndex={isSelected ? 50 : 10}
            icon={icon}
          />
        );
      })}
    </>
  );
}
