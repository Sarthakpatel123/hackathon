import { NextRequest, NextResponse } from "next/server";

const sessions = new Map<string, { agentName: string; history: { role: string; text: string }[] }>();

interface AgentConfig {
  name: string;
  prompt: string;
  isMenu?: boolean;
}

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

const GREETINGS = ["hi", "hello", "hey", "start", "help", "menu", "हेलो", "नमस्ते", "हाय", "namaste"];

function detectAgent(message: string): AgentConfig {
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

  // No keyword match — return unknown (handled in POST with session fallback)
  return { name: "unknown", prompt: "", isMenu: false };
}

async function callGemini(
  userMessage: string,
  systemPrompt: string,
  history: { role: string; text: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Service unavailable. Please try again later.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

  const recentHistory = history.slice(-4);
  const contents = [
    ...recentHistory.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      console.error("Gemini error:", res.status, await res.text());
      return "Sorry, I couldn't process that. Please try again.";
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
  } catch (err) {
    console.error("Gemini fetch error:", err);
    return "Sorry, something went wrong. Please try again.";
  }
}

function truncate(text: string, max = 1500): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twimlResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(truncate(message))}</Message>
</Response>`;
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userMessage = ((formData.get("Body") as string) || "").trim();
    const from = (formData.get("From") as string) || "unknown";

    if (!userMessage) {
      return twimlResponse("Please send a message! Type *menu* to see all agents.");
    }

    const isExplicitMenu = GREETINGS.some(g =>
      userMessage.toLowerCase().trim() === g ||
      userMessage.toLowerCase().trim().startsWith(g + " ")
    ) || userMessage.trim().length <= 3;

    // If explicit greeting/menu command — always show menu and reset session
    if (isExplicitMenu) {
      sessions.delete(from);
      return twimlResponse(MENU_TEXT);
    }

    const agent = detectAgent(userMessage);
    const existingSession = sessions.get(from);

    // If no keyword matched but user has an active session — continue with that agent
    if (agent.name === "unknown") {
      if (existingSession?.agentName && AGENT_PROMPTS[existingSession.agentName]) {
        const aiResponse = await callGemini(
          userMessage,
          AGENT_PROMPTS[existingSession.agentName],
          existingSession.history
        );
        existingSession.history.push({ role: "user", text: userMessage });
        existingSession.history.push({ role: "assistant", text: aiResponse });
        if (existingSession.history.length > 10) existingSession.history = existingSession.history.slice(-10);
        sessions.set(from, existingSession);
        return twimlResponse(`*${existingSession.agentName}*\n\n${aiResponse}\n\n_Type *menu* for other agents_`);
      }
      // No session and no keyword match — show menu
      return twimlResponse(MENU_TEXT);
    }

    // Keyword matched a specific agent
    const session = existingSession || { agentName: "", history: [] };

    // If switching to a different agent, clear history
    if (session.agentName && session.agentName !== agent.name) {
      session.history = [];
    }
    session.agentName = agent.name;

    const aiResponse = await callGemini(userMessage, agent.prompt, session.history);
    session.history.push({ role: "user", text: userMessage });
    session.history.push({ role: "assistant", text: aiResponse });
    if (session.history.length > 10) session.history = session.history.slice(-10);
    sessions.set(from, session);

    return twimlResponse(`*${agent.name}*\n\n${aiResponse}\n\n_Type *menu* for other agents_`);

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return twimlResponse("Sorry, something went wrong. Please try again!");
  }
}