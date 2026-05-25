export const HOSPITALS_KEYWORDS = [
  'rumah sakit', 'hospital', 'siloam', 'hermina', 'mitra keluarga', 'eka hospital', 'advent', 'borromeus', 'santosa'
];
export const CLINICS_KEYWORDS = ['klinik', 'puskesmas', 'poliklinik', 'clinic', 'health center'];
export const PHARMACIES_KEYWORDS = ['apotek', 'apotik', 'pharmacy', 'kimia farma', 'century', 'guardian', 'k24', 'k-24'];
export const POLICE_KEYWORDS = ['polsek', 'polres', 'polresta', 'kepolisian', 'police', 'polda', 'polisi'];

export const HARD_BLACKLIST = [
  'atm', 'bank', 'toko', 'warung', 'cafe', 'resto',
  'hotel', 'mall', 'mart', 'spa', 'salon', 'jamu',
  'herbal', 'gym', 'fitness', 'kantor', 'gedung',
  'lobby', 'gate', 'pos gatur', 'dokter gigi', 'bidan',
  'pintu masuk', 'pintu keluar', 'parkir', 'masjid', 
  'indomaret', 'alfamart', 'gigi', 'kecantikan', 'estetika',
  'bpjs', 'laboratorium', 'pramita', 'prodia', 'parahita', 'poskamling',
  'security', 'satpam', 'tower', 'paviliun', 'sekolah', 'kampus',
  'entrance', 'laundry', 'building', 'mushola', 'kantin', 'cafe'
];

export const isValidFacility = (place: any, facilityType: string) => {
  if (!place || !place.displayName) return false;
  const name = place.displayName.toLowerCase();
  
  const hasBlacklisted = HARD_BLACKLIST.some(w => {
    return new RegExp(`\\b${w}\\b`).test(name);
  });
  if (hasBlacklisted) return false;

  const matchRs = /\b(rs|rsu|rsia|rsup|rsud|rsab|rspad|rsk|rskm)\b/.test(name);
  const isHospital = matchRs || HOSPITALS_KEYWORDS.some(w => name.includes(w));

  if (facilityType === 'hospital') {
      const hasClinic = CLINICS_KEYWORDS.some(w => name.includes(w));
      if (!isHospital && hasClinic) return false; 
      if (name.includes('klinik') || name.includes('puskesmas') || name.includes('apotek')) return false;
      return true;
  }
  
  if (facilityType === 'clinic') {
      if (isHospital) return false;
      return true;
  }

  if (facilityType === 'pharmacy') {
      if (isHospital || CLINICS_KEYWORDS.some(w => name.includes(w))) return false;
      return true;
  }

  if (facilityType === 'police') {
      if (name.includes('pos ') || name.includes('satpam')) return false; 
      return true;
  }

  return true;
};

const PLACE_FIELDS = [
  "id", "displayName", "location", "formattedAddress",
  "regularOpeningHours", "nationalPhoneNumber", "rating", "userRatingCount"
];

/**
 * Returns params for Place.searchByText() — mirrors exactly what Google Maps
 * returns when a user types e.g. "rumah sakit" in the search bar.
 * Much more accurate than searchNearby with includedTypes.
 */
export const getTextSearchParams = (type: string, lat: number, lng: number) => {
  const config: Record<string, { textQuery: string; radius: number }> = {
    hospital: { textQuery: "rumah sakit",    radius: 10000 },
    clinic:   { textQuery: "klinik puskesmas", radius: 6000 },
    pharmacy: { textQuery: "apotek",          radius: 4000 },
    police:   { textQuery: "kantor polisi",   radius: 8000 },
  };

  const { textQuery, radius } = config[type] ?? config.hospital;

  return {
    textQuery,
    locationBias: { center: { lat, lng }, radius },
    maxResultCount: 20,
    fields: PLACE_FIELDS,
    rankPreference: "DISTANCE" as const,
  };
};

/**
 * @deprecated Use getTextSearchParams + Place.searchByText instead.
 * Kept only as a fallback in case the text search quota is exceeded.
 */
export const getSearchNearbyParams = (
  type: string,
  lat: number,
  lng: number
) => {
  const baseParams: any = {
    locationRestriction: { center: { lat, lng } },
    maxResultCount: 20,
    fields: PLACE_FIELDS,
    rankPreference: "DISTANCE",
  };

  switch (type) {
    case 'clinic':
      return {
        ...baseParams,
        locationRestriction: { center: { lat, lng }, radius: 6000 },
        includedTypes: ['medical_clinic'],
        excludedTypes: ['atm', 'bank', 'store', 'pharmacy', 'spa', 'beauty_salon', 'dentist'],
      };
    case 'pharmacy':
      return {
        ...baseParams,
        locationRestriction: { center: { lat, lng }, radius: 4000 },
        includedTypes: ['pharmacy'],
        excludedTypes: ['atm', 'bank', 'store', 'supermarket', 'convenience_store', 'hospital', 'medical_clinic'],
      };
    case 'police':
      return {
        ...baseParams,
        locationRestriction: { center: { lat, lng }, radius: 8000 },
        includedTypes: ['police'],
        excludedTypes: ['atm', 'bank', 'store', 'local_government_office'],
      };
    case 'hospital':
    default:
      return {
        ...baseParams,
        locationRestriction: { center: { lat, lng }, radius: 10000 },
        includedTypes: ['hospital'],
        excludedTypes: ['atm', 'bank', 'store', 'restaurant', 'lodging', 'medical_clinic', 'pharmacy', 'dentist'],
      };
  }
};
