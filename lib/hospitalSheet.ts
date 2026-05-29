import fs from 'fs';
import path from 'path';

export type KemenkesHospital = {
  name: string;      // From "Rumah Sakit" column
  province: string;  // From "Provinsi" column
  city: string;      // From "Kab/Kota" column (e.g., "Kota Bekasi", "Kab. Bekasi")
  address: string;   // From "Alamat" column
  phone: string;     // From "Telepon" column
  owner: string;     // From "Pemilik" column
  kelas: string;     // From "Kelas" column (A, B, C, or D)
  lat?: number;
  lng?: number;
};

export async function fetchKemenkesHospitals(): Promise<KemenkesHospital[]> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'kemenkes_hospitals.json');
    let rawContent = fs.readFileSync(filePath, 'utf-8');
    
    // Fix the raw content format (add {} and remove trailing comma if present)
    rawContent = rawContent.trim();
    if (rawContent.endsWith(',')) {
      rawContent = rawContent.slice(0, -1);
    }
    // Wrap to valid JSON object structure
    if (!rawContent.startsWith('{')) {
      rawContent = `{${rawContent}}`;
    }
    
    const parsedData = JSON.parse(rawContent);
    
    // Map object properties back to KemenkesHospital array
    const hospitals: KemenkesHospital[] = Object.keys(parsedData).map((key) => {
      const data = parsedData[key];
      return {
        name: key, // name is the key
        owner: data.pemilik || "",
        kelas: data.kelas || "",
        province: data.provinsi || "",
        city: data.kota || "",
        address: data.alamat || "",
        phone: data.telepon || "",
        lat: data.latitude,
        lng: data.longitude
      };
    });

    return hospitals;
  } catch (error) {
    console.error("fetchKemenkesHospitals Error reading local JSON:", error);
    return [];
  }
}
