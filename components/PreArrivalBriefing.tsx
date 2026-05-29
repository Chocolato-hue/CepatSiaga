"use client";

import { Share2, MonitorPlay, X, ClipboardType, Download, FileImage, FileText, UserPlus, Phone } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { buildIgdReport, formatIgdBriefingText, ReportExtras, translateRelation } from "@/lib/triageReport";

interface SavedContact {
  name: string;
  phone: string;
  relation: string;
}

interface PreArrivalBriefingProps {
  triageData: any;
  lang: "id" | "en";
  originalEmergencyText?: string;
  incidentTime?: string;
}

const vitalOptions = {
  usia: {
    en: ["Child", "Teenager", "Adult", "Elderly"],
    id: ["Anak", "Remaja", "Dewasa", "Lansia"],
    keys: ["child", "teenager", "adult", "elderly"]
  },
  sadar: {
    en: ["Yes", "No"],
    id: ["Ya", "Tidak"],
    keys: ["yes", "no"]
  },
  bernapas: {
    en: ["Yes", "No", "Unknown"],
    id: ["Ya", "Tidak", "Tidak Tahu"],
    keys: ["yes", "no", "unknown"]
  }
};

const allergyOptions = {
  en: ["None", "Penicillin", "Aspirin", "Ibuprofen", "Sulfa", "Other..."],
  id: ["Tidak ada", "Penisilin", "Aspirin", "Ibuprofen", "Sulfa", "Lainnya..."],
  keys: ["none", "penicillin", "aspirin", "ibuprofen", "sulfa", "other"]
};

const translateVital = (key: string, field: "usia" | "sadar" | "bernapas", lang: "id" | "en") => {
  if (!key) return "";
  const index = vitalOptions[field].keys.indexOf(key);
  if (index === -1) return key;
  return vitalOptions[field][lang][index];
};

const translateAllergy = (key: string, lang: "id" | "en") => {
  if (!key) return "";
  const index = allergyOptions.keys.indexOf(key);
  if (index === -1) return key;
  return allergyOptions[lang][index];
};

const getAllergyChips = (lang: "id" | "en") => allergyOptions[lang].map((label, i) => ({ label, key: allergyOptions.keys[i] }));


function loadSavedContacts(): SavedContact[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cepatsiaga_ec") || "[]");
  } catch {
    return [];
  }
}

function saveSavedContacts(contacts: SavedContact[]) {
  localStorage.setItem("cepatsiaga_ec", JSON.stringify(contacts));
}

function getTimestamp(): number {
  return Date.now();
}

export default function PreArrivalBriefing({
  triageData,
  lang,
  originalEmergencyText,
  incidentTime,
}: PreArrivalBriefingProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFormGenerated, setIsFormGenerated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const [formData, setFormData] = useState({
    usia: "",
    sadar: "",
    bernapas: "",
    alergi: [] as string[],
    alergiLainnya: "",
    emergencyContact: null as SavedContact | null,
  });

  // Emergency contact sub-state
  const [savedContacts, setSavedContacts] = useState<SavedContact[]>(() => loadSavedContacts());
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" });

  const fullscreenRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close download menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const report = buildIgdReport(triageData || {}, lang);
  const severity = triageData?.severity?.toUpperCase() || "KRITIS";
  const notDoneActions = (triageData?.do_not_do?.[lang] || triageData?.do_not_do)?.map((s: string) => `❌ ${s}`).join("\n") || "-";

  const getAllergiValue = () => {
    const selectedKeys = formData.alergi.filter((k) => k !== "other");
    const selectedTranslates = selectedKeys.map(k => translateAllergy(k, lang));
    const hasCustom = formData.alergi.includes("other");
    const custom = hasCustom && formData.alergiLainnya ? [formData.alergiLainnya] : [];
    const all = [...selectedTranslates, ...custom];
    return all.length > 0 ? all.join(", ") : report.allergies_medications;
  };

  const extras: ReportExtras = {
    usia: translateVital(formData.usia, "usia", lang),
    sadar: translateVital(formData.sadar, "sadar", lang),
    bernapas: translateVital(formData.bernapas, "bernapas", lang),
    alergi: getAllergiValue(),
    emergencyContact: formData.emergencyContact,
    incidentTime,
  };

  const briefingText = formatIgdBriefingText(report, triageData || {}, extras, lang);

  const toggleAlergi = (key: string) => {
    setFormData((prev) => {
      const has = prev.alergi.includes(key);
      const isNone = key === "none";
      if (isNone) {
        return { ...prev, alergi: has ? [] : [key], alergiLainnya: "" };
      }
      const without = prev.alergi.filter((a) => a !== "none");
      return {
        ...prev,
        alergi: has ? without.filter((a) => a !== key) : [...without, key],
      };
    });
  };

  const handleSaveContact = () => {
    if (!newContact.name || !newContact.phone) return;
    const updated = [...savedContacts, newContact];
    setSavedContacts(updated);
    saveSavedContacts(updated);
    setFormData((prev) => ({ ...prev, emergencyContact: newContact }));
    setNewContact({ name: "", phone: "", relation: "" });
    setShowAddContact(false);
  };

  const handleDeleteContact = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const c = savedContacts[index];
    const updated = savedContacts.filter((_, i) => i !== index);
    setSavedContacts(updated);
    saveSavedContacts(updated);
    if (formData.emergencyContact?.phone === c.phone) {
      setFormData((prev) => ({ ...prev, emergencyContact: null }));
    }
  };

  const handleEditContact = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const c = savedContacts[index];
    setNewContact(c);
    setShowAddContact(true);
    handleDeleteContact(e, index);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(briefingText)}`, "_blank");
  };

  const formatClinicalSummary = () => {
    const contactStr = formData.emergencyContact
      ? `${formData.emergencyContact.name}${formData.emergencyContact.relation ? ` (${translateRelation(formData.emergencyContact.relation, lang)})` : ""} — ${formData.emergencyContact.phone}`
      : (lang === "en" ? "Not Provided" : "Tidak Ada");

    const vl = lang === "en" ? { conscious: "Conscious", breathing: "Breathing", age: "Age" } : { conscious: "Sadar", breathing: "Napas", age: "Usia" };
    const sev = triageData?.severity?.toUpperCase() || "KRITIS";
    const systemText = lang === "en" ? "ER PRE-ARRIVAL TRIAGE (CepatSiaga)" : "TRIASE KEDATANGAN IGD (CepatSiaga)";

    const lines = [
      `• System: ${systemText}`,
      `• Severity: ${sev}`,
      `• Vitals: ${vl.conscious}: ${translateVital(formData.sadar, "sadar", lang) || "Yes"} | ${vl.breathing}: ${translateVital(formData.bernapas, "bernapas", lang) || "Yes"} | ${vl.age}: ${translateVital(formData.usia, "usia", lang) || "-"}`,
      `• Emergency Contact: ${contactStr}`,
      ``,
      `${report.igd_report_summary || ""}`
    ];
    return lines.join("\n");
  };

  const generateCanvases = (): HTMLCanvasElement[] => {
    const scale = 2; // For high DPI
    const w = 794;
    const h = 1123; // A4 relative pixel height at 96 DPI
    
    const canvases: HTMLCanvasElement[] = [];
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    
    const startNewPage = () => {
      canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      
      // Footer for new pages
      ctx.fillStyle = "#bbbbbb";
      ctx.font = "bold 10px Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Provisional summary report only — Not a formal medical diagnosis.", w / 2, h - 30);
      ctx.textAlign = "left";
      
      canvases.push(canvas);
      return ctx;
    };

    startNewPage();

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, simulate = false) => {
      let currY = y;
      const paragraphs = text.split("\n");
      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
           currY += lineHeight;
           continue;
        }
        const words = paragraph.split(" ");
        let line = "";
        for (const word of words) {
          const testLine = line + word + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== "") {
            if (!simulate) ctx.fillText(line, x, currY);
            line = word + " ";
            currY += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (!simulate) ctx.fillText(line, x, currY);
        currY += lineHeight; // Add extra space for paragraph
      }
      return currY;
    };

    let currentPageY = 30; // Start offset

    const drawGridBlock = (title: string, content: string, x: number, y: number, wid: number, hgt: number) => {
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, wid, hgt);
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(x, y, wid, 20);
      ctx.fillStyle = "#1A1A1A";
      ctx.font = "bold 10px Helvetica, Arial, sans-serif";
      ctx.fillText(title.toUpperCase(), x + 5, y + 14);
      ctx.fillStyle = "#1A1A1A";
      ctx.font = "11px Helvetica, Arial, sans-serif";
      
      const contentStr = content || "-";
      wrapText(contentStr, x + 10, y + 35, wid - 20, 15);
    };

    // Header 
    ctx.fillStyle = "#D8F8FF";
    ctx.fillRect(30, currentPageY, w - 60, 80);
    ctx.fillStyle = "#0082A6";
    ctx.font = "bold 24px Helvetica, Arial, sans-serif";
    ctx.fillText(lang === "en" ? "SUMMARY MEDICAL REPORT" : "RINGKASAN LAPORAN MEDIS", 50, currentPageY + 40);
    ctx.font = "10px Helvetica, Arial, sans-serif";
    ctx.fillStyle = "#0082A6";
    const timestamp = formattedTime || new Date().toLocaleString();
    ctx.fillText(lang === "en" ? `TIME LOG: ${timestamp}` : `WAKTU LOG: ${timestamp}`, 50, currentPageY + 65);

    currentPageY += 100;
    
    // Clinical Blocks
    const colW = (w - 70) / 2;
    drawGridBlock(lang === "en" ? "Chief Complaint" : "Keluhan Utama", report.chief_complaint || "-", 30, currentPageY, colW, 80);
    drawGridBlock(lang === "en" ? "Assumed Etiology" : "Kondisi Diduga", report.suspected_condition || "-", 30 + colW + 10, currentPageY, colW, 80);
    currentPageY += 90;

    const vl = lang === "en" ? { conscious: "Conscious", breathing: "Breathing", age: "Age", bleeding: "Bleeding/Injury" } : { conscious: "Kesadaran", breathing: "Pernapasan", age: "Usia", bleeding: "Perdarahan/Luka" };
    drawGridBlock(lang === "en" ? "Vitals Indicators Check" : "Cek Indikator Vital", 
       `${vl.conscious}: ${translateVital(formData.sadar, "sadar", lang) || report.consciousness}\n${vl.breathing}: ${translateVital(formData.bernapas, "bernapas", lang) || report.breathing}\n${vl.age}: ${translateVital(formData.usia, "usia", lang) || "-"}\n${vl.bleeding}: ${report.bleeding_or_injury || "-"}`, 
       30, currentPageY, w - 60, 90);
    currentPageY += 100;

    drawGridBlock(lang === "en" ? "Administered First-Aid Interventions" : "Intervensi P3K Diberikan", 
       report.first_aid_given || "-", 30, currentPageY, w - 60, 100);
    currentPageY += 110;
    
    drawGridBlock(lang === "en" ? "Critical Red Flags" : "Tanda Bahaya Kritis", 
       report.red_flags || "-", 30, currentPageY, w - 60, 80);
    currentPageY += 90;
    
    drawGridBlock(lang === "en" ? "Allergies / Meds" : "Alergi / Obat", 
       getAllergiValue() || "-", 30, currentPageY, w - 60, 60);
    currentPageY += 70;
    
    drawGridBlock(lang === "en" ? "Tell ER Doctor" : "Sampaikan ke Dokter",
       report.tell_doctor || "-", 30, currentPageY, w - 60, 80);
    currentPageY += 90;
    
    drawGridBlock(lang === "en" ? "Do Not Do" : "Jangan Lakukan",
       notDoneActions || "-", 30, currentPageY, w - 60, 80);
    currentPageY += 90;
    
    // Summary Box Logic (supports multi-page pagination)
    const summaryText = formatClinicalSummary();
    ctx.font = "11px Helvetica, Arial, sans-serif";
    const requiredHeight = wrapText(summaryText, 40, currentPageY + 35, w - 80, 15, true) - (currentPageY + 35) + 30;
    
    // Check if it fits on page 1
    if (currentPageY + Math.max(requiredHeight, 150) > h - 60) {
      // Need a new page for Clinical Summary
      startNewPage();
      currentPageY = 40;
    }

    drawGridBlock(lang === "en" ? "Clinical Summary" : "Ringkasan Klinis",
       summaryText || "-", 30, currentPageY, w - 60, Math.max(requiredHeight, 150));
    
    return canvases;
  };

  const handleDownloadJPEG = async () => {
    setIsDownloading(true);
    setShowDownloadMenu(false);
    try {
      const canvases = generateCanvases();
      // Combine canvases into one long JPEG if possible, or just download the first page
      // Here we download the first page for JPEG simplicity
      const canvas = canvases[0];
      const link = document.createElement("a");
      link.download = `laporan-igd-${getTimestamp()}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
    } catch (e) {
      console.error("JPEG export failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setShowDownloadMenu(false);
    try {
      const { jsPDF } = await import("jspdf");
      const canvases = generateCanvases();
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      
      canvases.forEach((canvas, index) => {
        if (index > 0) pdf.addPage();
        const pdfH = (canvas.height * pdfW) / canvas.width;
        const imgData = canvas.toDataURL("image/jpeg", 0.9);
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
      });

      pdf.save(`laporan-igd-${getTimestamp()}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedTime = incidentTime
    ? new Date(incidentTime).toLocaleString(lang === "id" ? "id-ID" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const reportSections = [
    ...(formattedTime ? [{ label: lang === "en" ? "Report time" : "Waktu laporan", value: formattedTime }] : []),
    {
      label: lang === "en" ? "Emergency contact" : "Kontak darurat",
      value: formData.emergencyContact
        ? `${formData.emergencyContact.name}${formData.emergencyContact.relation ? ` (${translateRelation(formData.emergencyContact.relation, lang)})` : ""} — ${formData.emergencyContact.phone}`
        : (lang === "en" ? "Not Provided" : "Tidak Ada"),
    },
    { label: lang === "en" ? "Chief complaint" : "Keluhan utama", value: report.chief_complaint },
    { label: lang === "en" ? "Suspected condition" : "Kondisi diduga", value: report.suspected_condition },
    { label: lang === "en" ? "Onset" : "Onset / waktu", value: report.onset_duration },
    { label: lang === "en" ? "Consciousness" : "Kesadaran", value: translateVital(formData.sadar, "sadar", lang) || report.consciousness },
    { label: lang === "en" ? "Breathing" : "Pernapasan", value: translateVital(formData.bernapas, "bernapas", lang) || report.breathing },
    { label: lang === "en" ? "Bleeding / injury" : "Pendarahan / luka", value: report.bleeding_or_injury },
    { label: lang === "en" ? "Age group" : "Kelompok usia", value: translateVital(formData.usia, "usia", lang) || "-" },
    { label: lang === "en" ? "Allergies / meds" : "Alergi / obat", value: getAllergiValue() },
    { label: lang === "en" ? "First aid done" : "P3K dilakukan", value: report.first_aid_given },
    { label: lang === "en" ? "Red flags" : "Tanda bahaya", value: report.red_flags },
    { label: lang === "en" ? "Tell ER doctor" : "Sampaikan ke dokter IGD", value: report.tell_doctor },
  ];

  return (
    <>
      <div className="bg-[#D8F8FF] border border-[#0082A6]/20 rounded-2xl shadow-sm p-6 text-slate-800 mt-6">
        <div className="mb-4">
          <h3 className="text-xl font-serif font-black uppercase tracking-widest text-black">
            {lang === "en" ? "Summary Medical Report" : "Ringkasan Laporan Medis"}
          </h3>
          <p className="text-sm font-medium text-[#0082A6]/80 mt-1">
            {lang === "en"
              ? "Structured triage handoff for ER staff — saves time at registration."
              : "Triase terstruktur untuk petugas IGD — mempercepat registrasi dan penanganan."}
          </p>
          {formattedTime && (
            <p className="text-xs font-bold text-[#0082A6]/60 mt-1 uppercase tracking-widest">
              🕐 {formattedTime}
            </p>
          )}
          {originalEmergencyText && (
            <p className="text-xs text-[#0082A6]/60 mt-2 italic line-clamp-2">
              {lang === "en" ? "Original report: " : "Laporan awal: "}
              {originalEmergencyText}
            </p>
          )}
        </div>

        {!isFormGenerated ? (
          <div className="mb-6 bg-white border border-[#0082A6]/10 p-5 rounded-xl shadow-sm">
            <h4 className="font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2 text-[#0082A6]">
              <ClipboardType className="w-4 h-4" />
              {lang === "en" ? "Patient snapshot (optional)" : "Data pasien singkat (opsional)"}
            </h4>

            <div className="flex flex-col gap-5">
              {/* Usia, sadar, bernapas */}
              {[
                { key: "usia" as const, label: lang === "en" ? "Age group?" : "Usia korban?", keys: vitalOptions.usia.keys },
                { key: "sadar" as const, label: lang === "en" ? "Conscious?" : "Masih sadar?", keys: vitalOptions.sadar.keys },
                { key: "bernapas" as const, label: lang === "en" ? "Breathing?" : "Masih bernapas?", keys: vitalOptions.bernapas.keys },
              ].map((row) => (
                <div key={row.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 justify-between">
                   <label className="text-sm font-medium w-36 border-b sm:border-0 border-black/10 pb-1 sm:pb-0">{row.label}</label>
                   <div className="flex gap-2 text-xs flex-wrap">
                     {row.keys.map((k) => (
                      <button
                        key={k}
                        onClick={() => setFormData({ ...formData, [row.key]: k })}
                        className={`px-3 py-1.5 border font-bold ${
                          formData[row.key as keyof typeof formData] === k
                            ? "bg-black text-white border-black"
                            : "bg-transparent text-black border-black/30 hover:border-black"
                        }`}
                      >
                        {translateVital(k, row.key, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Allergies */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium border-b border-black/10 pb-1">
                  {lang === "en" ? "Allergies / medications?" : "Alergi / obat-obatan?"}
                </label>
                <div className="flex gap-2 flex-wrap text-xs">
                  {getAllergyChips(lang).map(({ label, key: chipKey }) => (
                    <button
                      key={chipKey}
                      onClick={() => toggleAlergi(chipKey)}
                      className={`px-3 py-1.5 border font-bold transition-colors ${
                        formData.alergi.includes(chipKey)
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-transparent text-black border-black/30 hover:border-black"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {formData.alergi.includes("other") && (
                  <input
                    type="text"
                    placeholder={lang === "en" ? "Type allergy / medication..." : "Tulis alergi / obat..."}
                    value={formData.alergiLainnya}
                    onChange={(e) => setFormData({ ...formData, alergiLainnya: e.target.value })}
                    className="mt-1 w-full border border-black/40 px-3 py-2 text-xs focus:outline-none focus:border-black"
                  />
                )}
              </div>

              {/* Emergency Contact */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium border-b border-black/10 pb-1 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  {lang === "en" ? "Emergency contact?" : "Kontak darurat?"}
                </label>

                {/* Saved contacts */}
                {savedContacts.length > 0 && (
                  <div className="flex gap-2 flex-wrap text-xs">
                    {savedContacts.map((c, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1 border transition-colors ${
                          formData.emergencyContact?.phone === c.phone
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-transparent text-black border-black/30 hover:border-black"
                        }`}
                      >
                        <button
                          onClick={() => setFormData({ ...formData, emergencyContact: formData.emergencyContact?.phone === c.phone ? null : c })}
                          className="px-3 py-1.5 font-bold outline-none"
                        >
                          {c.name}{c.relation ? ` · ${translateRelation(c.relation, lang)}` : ""}
                        </button>
                        <div className="flex items-center gap-0.5 pr-2">
                          <button onClick={(e) => handleEditContact(e, i)} className="p-1 hover:bg-black/10 rounded-sm" title={lang === "en" ? "Edit" : "Edit"}>
                            <ClipboardType className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => handleDeleteContact(e, i)} className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded-sm" title={lang === "en" ? "Delete" : "Hapus"}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new contact toggle */}
                {!showAddContact ? (
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="flex items-center gap-1.5 text-xs text-black/50 hover:text-black font-bold uppercase tracking-widest w-fit"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {lang === "en" ? "Add new contact" : "Tambah kontak baru"}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 bg-black/5 p-3 border border-black/20">
                    {[
                      { key: "name", placeholder: lang === "en" ? "Full name" : "Nama lengkap" },
                      { key: "phone", placeholder: lang === "en" ? "Phone number" : "Nomor telepon" },
                      { key: "relation", placeholder: lang === "en" ? "Relation (optional)" : "Hubungan (opsional)" },
                    ].map((f) => (
                      <input
                        key={f.key}
                        type={f.key === "phone" ? "tel" : "text"}
                        placeholder={f.placeholder}
                        value={newContact[f.key as keyof typeof newContact]}
                        onChange={(e) => setNewContact({ ...newContact, [f.key]: e.target.value })}
                        className="w-full border border-black/30 px-3 py-2 text-xs focus:outline-none focus:border-black bg-white"
                      />
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveContact}
                        className="flex-1 bg-black text-white text-xs font-bold uppercase tracking-widest py-2 hover:bg-black/80"
                      >
                        {lang === "en" ? "Save & Select" : "Simpan & Pilih"}
                      </button>
                      <button
                        onClick={() => setShowAddContact(false)}
                        className="px-4 text-xs font-bold uppercase tracking-widest border border-black/30 hover:border-black"
                      >
                        {lang === "en" ? "Cancel" : "Batal"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsFormGenerated(true)}
              className="mt-6 w-full bg-blue-600 text-white font-black uppercase text-xs tracking-widest py-3 border border-black hover:bg-blue-700 transition-colors shadow-[2px_2px_0_0_#000]"
            >
              {lang === "en" ? "Generate ER Report" : "Generate Laporan IGD"}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-white border border-black p-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">
                  {lang === "en" ? "Severity" : "Tingkat"}
                </span>
                <p className="font-black text-[#FF3B30] text-lg">{severity}</p>
              </div>
              <div className="bg-white border border-black p-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">
                  {lang === "en" ? "Suspected" : "Diduga"}
                </span>
                <p className="font-bold text-sm">{report.suspected_condition}</p>
              </div>
            </div>

            <div className="bg-white border border-[#1A1A1A]/20 p-4 font-sans text-xs md:text-sm rounded-sm mb-4 max-h-[280px] overflow-y-auto shadow-inner space-y-3 leading-[1.4]">
              {reportSections.map((s) => (
                <div key={s.label}>
                  <span className="font-bold text-[#1A1A1A]/70 uppercase text-[9px] tracking-widest">{s.label}</span>
                  <p className="mt-0.5 text-[#1A1A1A]">{s.value}</p>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1A1A1A]/10">
                <span className="font-bold text-[#1A1A1A]/70 uppercase text-[9px] tracking-widest">
                  {lang === "en" ? "Do not do" : "Jangan lakukan"}
                </span>
                <p className="mt-0.5 font-bold text-[#FF3B30]">{notDoneActions}</p>
              </div>
            </div>

            <div className="bg-white border border-[#1A1A1A]/20 p-4 font-sans text-[11px] md:text-xs whitespace-pre-wrap rounded-sm mb-6 max-h-[250px] overflow-y-auto shadow-inner text-[#1A1A1A] leading-[1.4]">
              {formatClinicalSummary()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold px-4 py-3 border border-black hover:scale-[1.02] transition-transform uppercase text-xs tracking-widest shadow-[2px_2px_0_0_#000]"
              >
                <Share2 className="w-4 h-4" />
                {lang === "en" ? "Share via WhatsApp" : "Kirim via WhatsApp"}
              </button>

              {/* View & Download button with dropdown */}
              <div className="relative" ref={downloadMenuRef}>
                <div className="flex border border-black shadow-[2px_2px_0_0_#000]">
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-black text-white font-bold px-4 py-3 hover:scale-[1.02] transition-transform uppercase text-xs tracking-widest"
                  >
                    <MonitorPlay className="w-4 h-4" />
                    {lang === "en" ? "View & Download" : "Lihat & Unduh"}
                  </button>
                  <button
                    onClick={() => setShowDownloadMenu((v) => !v)}
                    className="bg-black text-white px-3 border-l border-white/20 hover:bg-white/10 transition-colors"
                    title="Download options"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {showDownloadMenu && (
                  <div className="absolute right-0 bottom-full mb-1 bg-white border border-black shadow-[2px_2px_0_0_#000] z-30 min-w-[160px]">
                    <button
                      onClick={handleDownloadJPEG}
                      disabled={isDownloading}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                    >
                      <FileImage className="w-4 h-4" />
                      {isDownloading ? "..." : "Download JPEG"}
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors border-t border-black/10"
                    >
                      <FileText className="w-4 h-4" />
                      {isDownloading ? "..." : "Download PDF"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen view */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white text-black flex flex-col overflow-y-auto">
          {/* Fullscreen toolbar */}
          <div className="sticky top-0 z-10 bg-white border-b-2 border-black flex items-center justify-between px-6 py-3 gap-3">
            <span className="font-black uppercase text-xs tracking-widest">
              {lang === "en" ? "ER Pre-Arrival Briefing" : "Laporan IGD"}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadJPEG}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-2 border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                <FileImage className="w-3.5 h-3.5" />
                {isDownloading ? "..." : "JPEG"}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                {isDownloading ? "..." : "PDF"}
              </button>
              <button onClick={() => setIsFullscreen(false)} className="p-2 hover:bg-black/5 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Capturable content */}
          <div ref={fullscreenRef} className="max-w-2xl mx-auto w-full p-8 md:p-12 bg-white">
            <h2 className="text-4xl md:text-5xl font-black font-serif italic mb-2 uppercase">
              {lang === "en" ? "ER Pre-Arrival Briefing" : "Laporan Kedatangan IGD"}
            </h2>
            {formattedTime && (
              <p className="text-sm text-black/40 font-bold mb-4">🕐 {formattedTime}</p>
            )}
            <p className="text-2xl font-black text-[#FF3B30] mb-8 pb-6 border-b-4 border-[#1A1A1A]">{severity}</p>

            <div className="flex flex-col gap-6 text-lg md:text-xl font-sans text-[#1A1A1A] leading-[1.4] pb-6 border-b border-[#1A1A1A]/10">
              {reportSections.map((s) => (
                <div key={s.label} className="border-b border-[#1A1A1A]/10 pb-4">
                  <span className="text-sm font-bold text-[#1A1A1A]/60 uppercase tracking-widest">{s.label}</span>
                  <p className="font-medium mt-1 text-[#1A1A1A]">{s.value}</p>
                </div>
              ))}
              <div className="pb-4">
                <span className="text-sm font-bold text-[#1A1A1A]/60 uppercase tracking-widest">
                  {lang === "en" ? "Do not do" : "Jangan lakukan"}
                </span>
                <p className="font-bold mt-1 text-[#FF3B30]">{notDoneActions}</p>
              </div>
            </div>

            <div className="mt-6 mb-8 font-sans text-base md:text-lg whitespace-pre-wrap text-[#1A1A1A] leading-[1.4]">
              {formatClinicalSummary()}
            </div>

            <div className="mt-12 pt-6 border-t-4 border-[#1A1A1A] text-sm text-[#1A1A1A]/60 font-bold uppercase tracking-widest text-center">
              {lang === "en"
                ? "CepatSiaga AI — triage aid, not a medical diagnosis"
                : "CepatSiaga AI — bantuan triase, bukan diagnosis resmi"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
