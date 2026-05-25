export interface IgdTriageReport {
  chief_complaint: string;
  suspected_condition: string;
  onset_duration: string;
  consciousness: string;
  breathing: string;
  bleeding_or_injury: string;
  allergies_medications: string;
  first_aid_given: string;
  red_flags: string;
  tell_doctor: string;
  igd_report_summary: string;
}

export function buildIgdReport(triageData: any, lang: "id" | "en"): IgdTriageReport {
  const isEn = lang === "en";
  const fallback = (id: string, en: string) => (isEn ? en : id);
  
  const getProp = (key: string) => {
    const val = triageData?.[key];
    if (val && typeof val === 'object' && val[lang]) return val[lang];
    return val;
  };

  return {
    chief_complaint:
      getProp('chief_complaint') ||
      getProp('short_condition') ||
      fallback("Keluhan darurat", "Emergency complaint"),
    suspected_condition:
      getProp('suspected_condition') ||
      getProp('short_condition') ||
      fallback("Belum diklasifikasi", "Not classified"),
    onset_duration:
      getProp('onset_duration') ||
      fallback("Tidak diketahui", "Unknown"),
    consciousness:
      getProp('consciousness') ||
      fallback("Perlu evaluasi di IGD", "Needs ER assessment"),
    breathing:
      getProp('breathing') ||
      fallback("Perlu evaluasi di IGD", "Needs ER assessment"),
    bleeding_or_injury:
      getProp('bleeding_or_injury') ||
      fallback("Tidak disebutkan", "Not stated"),
    allergies_medications:
      getProp('allergies_medications') ||
      fallback("Tidak diketahui", "Unknown"),
    first_aid_given:
      getProp('first_aid_given') ||
      getProp('igd_report_summary') ||
      fallback("P3K sesuai panduan aplikasi", "First aid per app guidance"),
    red_flags:
      getProp('red_flags') ||
      (triageData.severity === "Critical"
        ? fallback("Kondisi kritis — prioritas IGD", "Critical — ER priority")
        : fallback("Pantau perburukan", "Watch for deterioration")),
    tell_doctor:
      getProp('tell_doctor') ||
      fallback(
        "Sampaikan keluhan, waktu kejadian, dan P3K yang sudah dilakukan",
        "State complaint, time of onset, and first aid already done"
      ),
    igd_report_summary:
      getProp('igd_report_summary') ||
      "",
  };
}

export interface ReportExtras {
  usia?: string;
  sadar?: string;
  bernapas?: string;
  alergi?: string;
  emergencyContact?: { name: string; phone: string; relation?: string } | null;
  incidentTime?: string;
}

export function translateRelation(relation: string, lang: "id" | "en"): string {
  if (!relation) return relation;
  
  const idToEn: Record<string, string> = {
    ibu: "Mother",
    ayah: "Father",
    bapak: "Father",
    "kakak/adik": "Sibling",
    kakak: "Sibling",
    adik: "Sibling",
    suami: "Husband",
    istri: "Wife",
    anak: "Child",
    saudara: "Relative",
    teman: "Friend",
  };
  
  const enToId: Record<string, string> = {
    mother: "Ibu",
    father: "Ayah",
    sibling: "Kakak/Adik",
    husband: "Suami",
    wife: "Istri",
    child: "Anak",
    relative: "Saudara",
    friend: "Teman",
  };

  const key = relation.toLowerCase().trim();
  
  if (lang === "en") {
    return idToEn[key] || relation;
  } else {
    return enToId[key] || relation;
  }
}

function formatTime(iso: string, lang: "id" | "en"): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(lang === "id" ? "id-ID" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function formatIgdBriefingText(
  report: IgdTriageReport,
  triageData: Record<string, unknown>,
  extras: ReportExtras,
  lang: "id" | "en"
): string {
  const severity = String(triageData.severity || "KRITIS").toUpperCase();
  const facility = String(triageData.facility_type || "hospital").toUpperCase();
  const timeStr = extras.incidentTime ? formatTime(extras.incidentTime, lang) : "-";
  const contactStr = extras.emergencyContact
    ? `${extras.emergencyContact.name}${extras.emergencyContact.relation ? ` (${translateRelation(extras.emergencyContact.relation, lang)})` : ""} — ${extras.emergencyContact.phone}`
    : (lang === "en" ? "Not Provided" : "Tidak Ada");

  if (lang === "en") {
    return `🏥 ER PRE-ARRIVAL TRIAGE (CepatSiaga)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIEF COMPLAINT : ${report.chief_complaint}
SUSPECTED       : ${report.suspected_condition}
ONSET           : ${report.onset_duration}
SEVERITY        : ${severity} | ROUTE: ${facility}
REPORT TIME     : ${timeStr}

VITAL CONTEXT
- Consciousness : ${extras.sadar || report.consciousness}
- Breathing     : ${extras.bernapas || report.breathing}
- Bleeding/Injury: ${report.bleeding_or_injury}
- Age group     : ${extras.usia || "-"}

FIRST AID DONE
${report.first_aid_given}

DO NOT DO
${Array.isArray(triageData.do_not_do) ? (triageData.do_not_do as string[]).join("; ") : "-"}

ALLERGIES / MEDS
${extras.alergi || report.allergies_medications}

RED FLAGS
${report.red_flags}

TELL ER DOCTOR
${report.tell_doctor}

EMERGENCY CONTACT
${contactStr}

CLINICAL SUMMARY
${report.igd_report_summary}

Not a formal diagnosis — triage aid only
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  return `🏥 LAPORAN TRIASE KEDATANGAN IGD (CepatSiaga)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
KELUHAN UTAMA  : ${report.chief_complaint}
KONDISI DIDUGA : ${report.suspected_condition}
ONSET/WAKTU    : ${report.onset_duration}
TINGKAT        : ${severity} | TUJUAN: ${facility}
WAKTU LAPORAN  : ${timeStr}

STATUS PENTING
- Kesadaran      : ${extras.sadar || report.consciousness}
- Pernapasan     : ${extras.bernapas || report.breathing}
- Pendarahan/Luka: ${report.bleeding_or_injury}
- Kelompok usia  : ${extras.usia || "-"}

P3K YANG DILAKUKAN
${report.first_aid_given}

JANGAN DILAKUKAN
${Array.isArray(triageData.do_not_do) ? (triageData.do_not_do as string[]).join("; ") : "-"}

ALERGI / OBAT
${extras.alergi || report.allergies_medications}

TANDA BAHAYA
${report.red_flags}

SAMPAIKAN KE DOKTER IGD
${report.tell_doctor}

KONTAK DARURAT
${contactStr}

RINGKASAN KLINIS
${report.igd_report_summary}

Bukan diagnosis resmi — bantuan triase darurat
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}
