import { KemenkesHospital } from "./hospitalSheet";

function normalizeName(name: string): string {
  let normalized = name.toLowerCase().trim();
  const prefixes = [
    "rumah sakit umum daerah",
    "rumah sakit umum",
    "rumah sakit",
    "rsud",
    "rsia",
    "rsup",
    "rsd",
    "rs",
  ];
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.substring(prefix.length).trim();
      break;
    }
  }
  return normalized;
}

// Longest Common Subsequence (or Substring). The prompt says Longest Common Substring.
// Let's implement Longest Common Substring length.
function longestCommonSubstring(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  let maxLen = 0;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > maxLen) {
          maxLen = dp[i][j];
        }
      } else {
        dp[i][j] = 0;
      }
    }
  }
  return maxLen;
}

function calculateSimilarityScore(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;
  const lcs = longestCommonSubstring(name1, name2);
  const maxLength = Math.max(name1.length, name2.length);
  if (maxLength === 0) return 0;
  return lcs / maxLength;
}

export function fuzzyMatchHospital(
  googlePlaceName: string,
  googleCityContext: string,
  kemenkesHospitals: KemenkesHospital[]
): KemenkesHospital | null {
  const normalizedPlaceName = normalizeName(googlePlaceName);
  const isTargetKotaBekasi = googleCityContext.toLowerCase().includes("kota bekasi");

  let bestMatch: KemenkesHospital | null = null;
  let highestScore = 0;

  for (const hospital of kemenkesHospitals) {
    // STRICT BEKASI REGIONAL BOUNDARY RULE
    const kemenkesCity = hospital.city.toLowerCase();
    const isKemenkesKotaBekasi = kemenkesCity.includes("kota bekasi");
    const isKemenkesKabBekasi = kemenkesCity.includes("kab") && kemenkesCity.includes("bekasi");

    // If context is Kota Bekasi, ONLY match if kemenkes row is Kota Bekasi
    if (isTargetKotaBekasi && !isKemenkesKotaBekasi) {
      continue;
    }
    // If context is NOT Kota Bekasi (e.g. Kabupaten Bekasi), prevent matching with Kota Bekasi
    // The prompt: "if the user's geocoded location is "Kota Bekasi", it must match exclusively against rows containing "Kota Bekasi" in the city column. It must never merge or confuse them with general "Bekasi"."
    if (!isTargetKotaBekasi && isKemenkesKotaBekasi && googleCityContext.toLowerCase().includes("bekasi")) {
      continue;
    }

    const normalizedKemenkesName = normalizeName(hospital.name);
    const score = calculateSimilarityScore(normalizedPlaceName, normalizedKemenkesName);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = hospital;
    }
  }

  if (highestScore > 0.6) {
    return bestMatch;
  }

  return null;
}
