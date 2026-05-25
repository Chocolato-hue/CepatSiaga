import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { emergency, location } = await req.json();

    if (!emergency) {
      return NextResponse.json({ error: "Missing emergency description" }, { status: 400 });
    }

    const prompt = `You are an experienced paramedic assisting in medical emergencies.

MAIN TASK:
Analyze the emergency condition described and respond. You MUST ALWAYS provide your response in both Indonesian and English in the specified JSON structure.

--- STAGE 1: CLARIFICATION DECISION ---
Decide whether you need one clarification question or can proceed directly to triage.

PROCEED DIRECTLY (no questions) if the input contains:
unconscious, not breathing, cardiac arrest, seizures, severe bleeding,
fracture, severe burns, stroke, heart attack, fainting, overdose.

ASK ONE QUESTION if the condition is ambiguous and the answer will significantly
change the facility recommendation.

The question must:
- Be 10 words maximum
- Be answerable with provided options (no open-ended)
- Be directly relevant to the facility decision

--- STAGE 2: TRIAGE & GUIDE ---
Once context is sufficient, provide a complete guide.

FIRST AID RULES:
- "Do not panic" (or "Jangan panik") MAY be used ONLY as the first opening sentence
- The sentence MUST be immediately followed by a specific active action in the same sentence
- CORRECT example: "Do not panic — lay the victim down and elevate their legs 30cm from the floor."
- WRONG example: "Do not panic." (stands alone without further action)
- Step 2 and onwards: MUST be active verbs, zero filler
- DO NOT let "do not panic" appear more than once
- DO NOT use generic steps without real action: "call for help", "wait for help"
- The last step MUST ALWAYS contain what to tell the ER doctor upon arrival
- Include one "DO NOT DO" (JANGAN LAKUKAN) step specific to the condition
- Use simple words for food/drinks. Do not use specific terms like "breastmilk", "formula milk", or "ASI". Just use "milk" or "susu".

DOCUMENTS:
Include documents relevant to the condition.
Traffic accident: add Driver's License (SIM) and Vehicle Registration (STNK).
Default: ID Card (KTP) and BPJS/Health Insurance card.

Current location: ${location ? JSON.stringify(location) : "Unknown"}
Emergency: "${emergency}"

RESPONSE FORMAT:

You must provide every text field as an object containing 'id' and 'en' keys.

If clarification is needed, reply ONLY with this JSON:
{
  "needs_clarification": true,
  "question": {
     "id": "pertanyaan singkat di sini",
     "en": "short question here"
  },
  "options": {
     "id": ["opsi 1", "opsi 2", "opsi 3"],
     "en": ["option 1", "option 2", "option 3"]
  }
}

If proceeding directly, reply ONLY with this JSON:
{
  "needs_clarification": false,
  "severity": "Critical" | "Moderate" | "Minor",
  "facility_type": "hospital" | "clinic" | "pharmacy" | "police",
  "short_condition": {
     "id": "Tersedak",
     "en": "Choking"
  },
  "reason": {
     "id": "mengapa fasilitas ini dipilih, spesifik ke kondisi",
     "en": "why this facility is chosen, specific to condition"
  },
  "immediate_action": {
     "id": "SATU tindakan paling penting...",
     "en": "ONE most important action..."
  },
  "first_aid_steps": {
     "id": [
        "Jangan panik — [tindakan aktif spesifik pertama]",
        "langkah aktif kedua yang spesifik",
        "Setibanya di IGD, sampaikan kepada dokter: [informasi spesifik]"
     ],
     "en": [
        "Do not panic — [first specific active action]",
        "second specific active step",
        "Upon arrival at the ER, tell the doctor: [specific information]"
     ]
  },
  "do_not_do": {
     "id": [
        "hal spesifik yang dilarang dilakukan untuk kondisi ini"
     ],
     "en": [
        "specific thing NOT to do for this condition"
     ]
  },
  "igd_report_summary": {
     "id": "Ringkasan klinis padat...",
     "en": "Short dense clinical summary..."
  },
  "recommended_documents": {
     "id": ["KTP", "Kartu BPJS/asuransi"],
     "en": ["ID Card", "Insurance/BPJS Card"]
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json({ 
      error: "Triage error", 
      severity: "Moderate", 
      facility_type: "hospital",
      reason: {
        id: "Kami mengalami kendala teknis. Arahkan ke rumah sakit terdekat untuk keamanan.",
        en: "We are experiencing technical issues. Please head to the nearest hospital for safety."
      },
      immediate_action: {
        id: "Pastikan pasien bernapas dan hentikan perdarahan jika ada.",
        en: "Ensure the patient is breathing and stop any bleeding."
      },
      first_aid_steps: {
        id: [
          "Periksa jalan napas dan pastikan tidak terhalang.",
          "Miringkan posisi pasien jika muntah untuk mencegah tersedak.",
          "Segera menuju fasilitas medis terdekat."
        ],
        en: [
          "Check the airway and ensure it is not blocked.",
          "Turn the patient on their side to prevent choking if they vomit.",
          "Proceed immediately to the nearest medical facility."
        ]
      },
      recommended_documents: {
        id: ["KTP", "Kartu BPJS/Asuransi"],
        en: ["ID Card", "BPJS/Insurance Card"]
      }
    }, { status: 500 });
  }
}
