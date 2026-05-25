import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let lang = 'id';
  try {
    const body = await req.json();
    lang = body.lang || 'id';
    const { messages, condition } = body;
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ text: lang === 'en' ? "I'm here for you. Are they still conscious?" : "Tenang, saya di sini. Apakah pasien masih sadar?" });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const ambulanceNumber = "119";
    
    const sysPrompt = `You are "CepatSiaga", a highly reassuring, fast, and supportive AI paramedic assistant.
The user is currently facing a medical emergency regarding: ${condition}.
Your role is to guide them calmly while waiting for medical help.

RULES:
- Keep responses VERY SHORT: 1–3 sentences only. Never use markdown (no asterisks, bold, bullets).
- Be warm, clear, and action-focused.
- Ask one follow-up question per turn to assess the situation step by step (e.g. consciousness, breathing, bleeding).
- If the situation sounds life-threatening (unconscious, not breathing, severe bleeding, chest pain, stroke signs, seizure), 
  IMMEDIATELY tell the user to call the emergency ambulance number ${ambulanceNumber} (${lang === 'en' ? 'Indonesia emergency' : 'ambulans darurat Indonesia'}) 
  and include the number prominently in your response.
- Do not provide long medical disclaimers.
- Respond in ${lang === 'en' ? 'English' : 'Indonesian'}.

Example responses:
"Tenang, saya di sini. Apakah pasien masih sadar dan bisa menjawab?"
"Segera hubungi ambulans darurat di 119 sekarang. Jaga pasien tetap diam dan tidak bergerak."
"Apakah ada pendarahan aktif saat ini?"
`;

    const historyText = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const finalPrompt = `${sysPrompt}\n\nChat History:\n${historyText}\n\nAssistant:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: finalPrompt,
    });
    
    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    
    // Handle Quota/Rate Limit (429)
    if (error.status === 429 || error?.response?.status === 429 || error?.message?.includes("429")) {
      return NextResponse.json(
        { text: lang === 'en' ? "Service is currently busy. Please wait a moment." : "Layanan sedang sibuk. Mohon tunggu sejenak." }, 
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { text: lang === 'en' ? "Please try again." : "Silakan coba lagi." }, 
      { status: 500 }
    );
  }
}
