import { NextRequest, NextResponse } from "next/server";
import { fetchKemenkesHospitals, KemenkesHospital } from "@/lib/hospitalSheet";

type FetchError = {
  error: string;
};

// ─── HOSPITAL: Kemenkes sheet → geocode → distance matrix ───────────────────

// Normalize city string: remove "Kota ", "Kab. ", "Kabupaten ", lowercase
// Sheet convention: "Kota X" = kota, plain "X" = kabupaten
// Google geocode may return "Kabupaten X" or "Kab. X" — strip to bare "X"
function stripKabPrefix(s: string): string {
  return s.toLowerCase().replace(/^(kabupaten |kab\. |kab )/, "").trim();
}

function cityMatches(sheetCity: string, targetRaw: string): boolean {
  const sheet  = sheetCity.toLowerCase().trim();
  // Strip any kabupaten prefix from Google's geocoded city
  const target = stripKabPrefix(targetRaw.toLowerCase().trim());

  // Sheet says "Kota X" — only match if target also says "kota X"
  if (sheet.startsWith("kota ")) return target === sheet;

  // Sheet says plain "X" (kabupaten) — reject if target explicitly says kota
  if (target.startsWith("kota ")) return false;

  // Both are kabupaten-style — compare bare names
  return target === sheet;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

async function fetchHospitalsFromKemenkes(
  lat: number,
  lng: number,
  city: string,
  apiKey: string
) {
  // 1. Load Kemenkes sheet
  const allHospitals = await fetchKemenkesHospitals();

  const validHospitals = allHospitals.filter((h) => h.lat !== undefined && h.lng !== undefined);

  if (validHospitals.length === 0) return [];

  // 2. Perform local Haversine distance calculation and sort by distance
  const withDistance = validHospitals.map(h => {
    const distKm = getDistanceFromLatLonInKm(lat, lng, h.lat!, h.lng!);
    const distMeters = distKm * 1000;
    // Urban speed approximation ~22 km/h
    const estimatedMins = Math.ceil(distKm / 22 * 60) + 2; // +2 mins overhead
    return { ...h, straightLineDistanceKm: distKm, distanceMeters: distMeters, estimatedEtaMins: Math.max(1, estimatedMins) };
  });
  
  withDistance.sort((a, b) => a.straightLineDistanceKm - b.straightLineDistanceKm);
  
  // Take top 15 nearest hospitals
  const shortlist = withDistance.slice(0, 15);

  // 4. Build final list using local metrics
  const facilities = shortlist.map((k, idx) => {
    const eta = k.estimatedEtaMins;
    const distanceMeters = k.distanceMeters;
    
    // Simple score: ETA + (distance / 1000)
    let score = eta + (distanceMeters / 1000);

    return {
      id: `kemenkes-${k.name}`, // Create a generic ID for frontend React key
      displayName: k.name,
      location: { lat: k.lat, lng: k.lng },
      formattedAddress: k.address,
      nationalPhoneNumber: k.phone || null,
      rating: null,
      userRatingCount: null,
      isOpenNow: true, 
      eta,
      distance: distanceMeters,
      kemenkes_verified: true,
      kelas: k.kelas || null,
      owner: k.owner || null,
      score,
    };
  });

  // Sort by the live ETA score
  facilities.sort((a, b) => a.score - b.score);
  return facilities.slice(0, 5);
}

// ─── CLINIC / PHARMACY: unchanged Google Places logic ───────────────────────

async function fetchPlacesByType(
  lat: number,
  lng: number,
  type: string,
  apiKey: string
) {
  const textQuery =
    type === "clinic" ? "klinik puskesmas" : "apotek";

  const placesRes = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.location,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.regularOpeningHours",
      },
      body: JSON.stringify({
        textQuery,
        locationBias: {
          circle: { center: { latitude: lat, longitude: lng }, radius: 6000 },
        },
        maxResultCount: 20,
        languageCode: "id",
        rankPreference: "DISTANCE",
      }),
    }
  );

  if (!placesRes.ok) throw new Error("Places API error");
  const placesData = await placesRes.json();
  let places = placesData.places || [];

  // Dedup + basic filter
  const seenAddresses = new Set<string>();
  const seenCoords = new Set<string>();
  const genericTerms = ["pelayanan", "rawat inap", "rawat jalan", "poli ", "unit ", "instalasi"];

  places = places
    .filter((p: any) => {
      if (!p.formattedAddress || !p.location) return false;
      const coordKey = `${p.location.latitude.toFixed(5)},${p.location.longitude.toFixed(5)}`;
      if (seenCoords.has(coordKey)) return false;
      seenCoords.add(coordKey);
      if (seenAddresses.has(p.formattedAddress)) return false;
      seenAddresses.add(p.formattedAddress);
      const name = p.displayName?.text?.toLowerCase() || "";
      if (genericTerms.some((t) => name.includes(t))) return false;
      if (name.includes("atm") || name.includes("bank") || name.includes("salon")) return false;
      return true;
    })
    .slice(0, 10);

  const facilities = places.map((p: any) => {
    const distKm = getDistanceFromLatLonInKm(lat, lng, p.location.latitude, p.location.longitude);
    const distanceMeters = distKm * 1000;
    const eta = Math.max(1, Math.ceil(distKm / 22 * 60) + 2); // 22 km/h + 2 mins overhead

    let score = eta + (distanceMeters / 1000);
    if (p.rating >= 3.5) {
      score -= (p.rating - 3.5) * 3 + Math.min((p.userRatingCount ?? 0) / 500, 4);
    }

    return {
      id: p.id,
      displayName: p.displayName?.text,
      location: { lat: p.location.latitude, lng: p.location.longitude },
      formattedAddress: p.formattedAddress,
      nationalPhoneNumber: p.nationalPhoneNumber ?? null,
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      isOpenNow: p.regularOpeningHours?.openNow ?? null,
      eta,
      distance: distanceMeters,
      score,
    };
  });

  facilities.sort((a: any, b: any) => a.score - b.score);
  return facilities.slice(0, 5);
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, type, city = "" } = body;

    if (!lat || !lng || !type) {
      return NextResponse.json({ error: "Missing lat, lng, or type" }, { status: 400 });
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_KEY ||
      process.env.GOOGLE_MAPS_PLATFORM_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing Google Maps API Key" }, { status: 500 });
    }

    let facilities: any[] = [];

    if (type === "hospital") {
      facilities = await fetchHospitalsFromKemenkes(lat, lng, city, apiKey);
    } else if (type === "clinic" || type === "pharmacy") {
      facilities = await fetchPlacesByType(lat, lng, type, apiKey);
    }

    return NextResponse.json({ facilities });
  } catch (err: any) {
    console.error("API Error in /facilities:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}