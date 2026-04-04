import { NextRequest, NextResponse } from "next/server";

const sessions = new Map<string, { agentName: string; history: { role: string; text: string }[] }>();

const MENU_TEXT = `🤖 *AI Agents Marketplace*

Choose your assistant by typing your question:

🌾 *Krishi Mitra* — Crop advice, mandi prices, schemes
🧾 *GST Saathi* — Filing, ITC, HSN codes  
⚖️ *Kanoon Mitra* — Legal rights, RTI, FIR
⚕️ *Health Guide* — Symptoms, medicines, wellness
₹ *Artha Advisor* — Investments, loans, SIP
🎯 *Career Mitra* — Jobs, skills, career guidance

Just type your question and I'll connect you to the right expert!

_Powered by AI Agents Marketplace_`;

const AGENT_PROMPTS: Record<string, string> = {
  "Krishi Mitra 🌾": `You are Krishi Mitra, an expert Indian agricultural assistant. Help with crop advice, mandi prices, MSP, and government schemes like PM-KISAN, PMFBY, eNAM. Give state-specific advice when mentioned. Be VERY concise (2-3 sentences max). Reply in the same language as the user.`,
  "GST Saathi 🧾": `You are GST Saathi, an expert Indian GST assistant. Help with GST filing, ITC claims, HSN codes, GSTR deadlines, and e-way bills. Be concise (2-3 sentences max). Reply in the same language as the user.`,
  "Kanoon Mitra ⚖️": `You are Kanoon Mitra, an Indian legal information assistant. Help with consumer rights, tenant rights, RTI filing, FIR process, and basic Indian law. Be concise (2-3 sentences max). Reply in the same language as the user.`,
  "Health Guide ⚕️": `You are Health Guide, a health information assistant. Help with symptoms, medicines, wellness. Always recommend a doctor. Be concise (2-3 sentences max). Reply in the same language as the user.`,
  "Artha Advisor ₹": `You are Artha Advisor, an Indian personal finance assistant. Help with investments, SIP, loans, EMI, tax saving. Be concise (2-3 sentences max). Reply in the same language as the user.`,
  "Career Mitra 🎯": `You are Career Mitra, an Indian career guidance assistant. Help with career, jobs, resume, interviews. Be concise (2-3 sentences max). Reply in the same language as the user.`,
};

const GREETINGS = ["hi", "hello", "hey", "start", "help", "menu", "bye", "goodbye", "exit", "quit", "हेलो", "नमस्ते", "हाय", "namaste"];

function detectAgent(message: string): { name: string; prompt: string; isMenu?: boolean } {
  const msg = message.toLowerCase().trim();

  const isGreeting = GREETINGS.some(g => msg === g || msg.startsWith(g + " ")) || msg.length <= 3;
  if (isGreeting) {
    return { name: "AI Agents", prompt: "", isMenu: true };
  }

  if (
    msg.includes("crop") || msg.includes("farm") || msg.includes("kisan") ||
    msg.includes("mandi") || msg.includes("fasal") || msg.includes("kheti") ||
    msg.includes("wheat") || msg.includes("rice") || msg.includes("paddy") ||
    msg.includes("fertilizer") || msg.includes("seed") || msg.includes("irrigation") ||
    msg.includes("krishi") || msg.includes("agriculture") || msg.includes("agri") ||
    msg.includes("scheme") || msg.includes("pm-kisan") || msg.includes("pmkisan") ||
    msg.includes("pmfby") || msg.includes("enam") || msg.includes("sowing") ||
    msg.includes("harvest") || msg.includes("soil") || msg.includes("pesticide") ||
    msg.includes("फसल") || msg.includes("किसान") || msg.includes("खेती") ||
    msg.includes("मंडी") || msg.includes("बीज") || msg.includes("उर्वरक") ||
    msg.includes("सिंचाई") || msg.includes("कृषि") || msg.includes("योजना")
  ) {
    return { name: "Krishi Mitra 🌾", prompt: AGENT_PROMPTS["Krishi Mitra 🌾"] };
  }

  if (
    msg.includes("gst") || msg.includes("tax") || msg.includes("filing") ||
    msg.includes("itc") || msg.includes("gstr") || msg.includes("invoice") ||
    msg.includes("hsn") || msg.includes("input credit") || msg.includes("e-way") ||
    msg.includes("टैक्स") || msg.includes("जीएसटी") || msg.includes("रिटर्न")
  ) {
    return { name: "GST Saathi 🧾", prompt: AGENT_PROMPTS["GST Saathi 🧾"] };
  }

  if (
    msg.includes("law") || msg.includes("legal") || msg.includes("court") ||
    msg.includes("police") || msg.includes("fir") || msg.includes("kanoon") ||
    msg.includes("advocate") || msg.includes("lawyer") || msg.includes("rti") ||
    msg.includes("tenant") || msg.includes("landlord") || msg.includes("consumer") ||
    msg.includes("कानून") || msg.includes("वकील") || msg.includes("पुलिस") ||
    msg.includes("एफआईआर") || msg.includes("न्यायालय")
  ) {
    return { name: "Kanoon Mitra ⚖️", prompt: AGENT_PROMPTS["Kanoon Mitra ⚖️"] };
  }

  if (
    msg.includes("health") || msg.includes("doctor") || msg.includes("medicine") ||
    msg.includes("symptom") || msg.includes("fever") || msg.includes("pain") ||
    msg.includes("tablet") || msg.includes("disease") || msg.includes("diet") ||
    msg.includes("hospital") || msg.includes("prescription") ||
    msg.includes("बुखार") || msg.includes("दर्द") || msg.includes("दवाई") ||
    msg.includes("बीमारी") || msg.includes("डॉक्टर") || msg.includes("स्वास्थ्य")
  ) {
    return { name: "Health Guide ⚕️", prompt: AGENT_PROMPTS["Health Guide ⚕️"] };
  }

  if (
    msg.includes("invest") || msg.includes("loan") || msg.includes("sip") ||
    msg.includes("mutual fund") || msg.includes("emi") || msg.includes("finance") ||
    msg.includes("saving") || msg.includes("fd") || msg.includes("ppf") ||
    msg.includes("stock") || msg.includes("share") || msg.includes("insurance") ||
    msg.includes("पैसा") || msg.includes("निवेश") || msg.includes("लोन") ||
    msg.includes("बचत") || msg.includes("शेयर") || msg.includes("बीमा")
  ) {
    return { name: "Artha Advisor ₹", prompt: AGENT_PROMPTS["Artha Advisor ₹"] };
  }

  if (
    msg.includes("career") || msg.includes("job") || msg.includes("resume") ||
    msg.includes("skill") || msg.includes("college") || msg.includes("naukri") ||
    msg.includes("interview") || msg.includes("salary") || msg.includes("upsc") ||
    msg.includes("ssc") || msg.includes("placement") || msg.includes("internship") ||
    msg.includes("नौकरी") || msg.includes("करियर") || msg.includes("रिज्यूमे") ||
    msg.includes("इंटरव्यू") || msg.includes("वेतन")
  ) {
    return { name: "Career Mitra 🎯", prompt: AGENT_PROMPTS["Career Mitra 🎯"] };
  }

  return { name: "unknown", prompt: "", isMenu: false };
}

// ✅ DIRECT GEMINI CALL (Fallback 1)
async function callGeminiDirect(userMessage: string, systemPrompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_WHATSAPP;
    if (!apiKey) return null;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          system_instruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }
  } catch (err) {
    console.error("Gemini direct error:", err);
  }
  return null;
}

// ✅ DIRECT GROQ CALL (Fallback 2)
async function callGroqDirect(userMessage: string, systemPrompt: string): Promise<string | null> {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return null;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
    }
  } catch (err) {
    console.error("Groq direct error:", err);
  }
  return null;
}

// ✅ DIRECT MISTRAL CALL (Fallback 3)
async function callMistralDirect(userMessage: string, systemPrompt: string): Promise<string | null> {
  try {
    const mistralKey = process.env.MISTRAL_API_KEY;
    if (!mistralKey) return null;

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
    }
  } catch (err) {
    console.error("Mistral direct error:", err);
  }
  return null;
}

// ✅ PRIMARY: Call /api/chat endpoint
async function callChatAPI(userMessage: string, systemPrompt: string): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: userMessage }],
        system: systemPrompt
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.reply || null;
    }
  } catch (err) {
    console.error("Chat API error:", err);
  }
  return null;
}

// ✅ MAIN AI FUNCTION WITH FALLBACKS
async function getAIResponse(userMessage: string, systemPrompt: string): Promise<string> {
  console.log("🤖 Getting AI response for:", userMessage.substring(0, 50));
  
  // Try 1: Call internal /api/chat endpoint
  let response = await callChatAPI(userMessage, systemPrompt);
  if (response) {
    console.log("✅ Response from /api/chat");
    return response;
  }
  console.log("⚠️ /api/chat failed, trying Gemini direct...");

  // Try 2: Direct Gemini
  response = await callGeminiDirect(userMessage, systemPrompt);
  if (response) {
    console.log("✅ Response from Gemini direct");
    return response;
  }
  console.log("⚠️ Gemini direct failed, trying Groq...");

  // Try 3: Direct Groq
  response = await callGroqDirect(userMessage, systemPrompt);
  if (response) {
    console.log("✅ Response from Groq direct");
    return response;
  }
  console.log("⚠️ Groq failed, trying Mistral...");

  // Try 4: Direct Mistral
  response = await callMistralDirect(userMessage, systemPrompt);
  if (response) {
    console.log("✅ Response from Mistral direct");
    return response;
  }

  // All failed
  console.log("❌ All AI services failed");
  return "⚠️ All AI services are currently busy. Please try again in a moment.";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userMessage = (formData.get("Body") as string) || "";
    const from = (formData.get("From") as string) || "";

    if (!userMessage.trim()) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Please send a message!</Message></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    const agent = detectAgent(userMessage);
    
    // If menu or unknown, just show menu
    if (agent.isMenu || agent.name === "unknown") {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${MENU_TEXT.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
</Response>`;
      return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    // Get AI response with fallbacks
    const aiResponse = await getAIResponse(userMessage, agent.prompt);

    const finalResponse = `*${agent.name}*\n\n${aiResponse}\n\n_Powered by AI Agents Marketplace_`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${finalResponse.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
</Response>`;

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, something went wrong. Please try again!</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}