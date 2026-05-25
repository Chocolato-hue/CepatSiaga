export const checkSatuSehatVerification = async (name: string, type: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/satusehat/verify?name=${encodeURIComponent(name)}&type=${type}`);
    if (res.ok) {
      const data = await res.json();
      return data.verified === true;
    }
  } catch (error) {
    console.error("Failed to verify with SatuSehat", error);
  }
  
  // Fallback pattern if API fails or no keys exist
  const n = name.toLowerCase();
  if (
  n.includes('rsud') ||
  n.includes('rsup') ||
  n.includes('puskesmas') ||
  n.includes('rumah sakit')
){
    return true;
  }
  return false;
};
