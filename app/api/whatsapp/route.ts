import { NextRequest, NextResponse } from "next/server";

// ─── Session Store (in-memory, resets on redeploy) ────────────────────────────
const sessions = new Map<string, { agentName: string; history: { role: string; text: string }[] }>();

// ─── Types ────────────────────────────────────────────────────────────────────
interface AgentConfig {
  name: string;
  prompt: string;
  isMenu?: boolean;
}

// ─── Menu Text ────────────────────────────────────────────────────────────────
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

// ─── Agent Detection ──────────────────────────────────────────────────────────
function detectAgent(message: string): AgentConfig {
  const msg = message.toLowerCase().trim();

  // Greetings → show menu
  const greetings = ["hi", "hello", "hey", "start", "help", "menu", "हेलो", "नमस्ते", "हाय", "namaste"];
  if (greetings.some(g => msg === g || msg.startsWith(g + " ")) || msg.length <= 3) {
    return { name: "AI Agents", prompt: "", isMenu: true };
  }

  // Krishi Mitra
  if (msg.includes("crop") || msg.includes("farm") || msg.includes("kisan") ||
      msg.includes("mandi") || msg.includes("fasal") || msg.includes("kheti") ||
      msg.includes("wheat") || msg.includes("rice") || msg.includes("paddy") ||
      msg.includes("fertilizer") || msg.includes("seed") || msg.includes("irrigation") ||
      msg.includes("फसल") || msg.includes("किसान") || msg.includes("खेती") ||
      msg.includes("मंडी") || msg.includes("बीज") || msg.includes("उर्वरक")) {
    return {
      name: "Krishi Mitra 🌾",
      prompt: `You are Krishi Mitra, an expert Indian agricultural assistant. Help with crop advice, mandi prices, MSP, and government schemes like PM-KISAN, PMFBY, eNAM. Give state-specific advice when mentioned. Be VERY concise (2-3 sentences max). Reply in the same language as the user (Hindi or English).`
    };
  }

  // GST Saathi
  if (msg.includes("gst") || msg.includes("tax") || msg.includes("filing") ||
      msg.includes("itc") || msg.includes("gstr") || msg.includes("invoice") ||
      msg.includes("hsn") || msg.includes("input credit") || msg.includes("e-way") ||
      msg.includes("टैक्स") || msg.includes("जीएसटी") || msg.includes("रिटर्न")) {
    return {
      name: "GST Saathi 🧾",
      prompt: `You are GST Saathi, an expert Indian GST assistant. Help with GST filing, ITC claims, HSN codes, GSTR deadlines, and e-way bills. Be concise (2-3 sentences max). Reply in the same language as the user.`
    };
  }

  // Kanoon Mitra
  if (msg.includes("law") || msg.includes("legal") || msg.includes("court") ||
      msg.includes("police") || msg.includes("fir") || msg.includes("kanoon") ||
      msg.includes("advocate") || msg.includes("lawyer") || msg.includes("rti") ||
      msg.includes("tenant") || msg.includes("landlord") || msg.includes("consumer") ||
      msg.includes("कानून") || msg.includes("वकील") || msg.includes("पुलिस") ||
      msg.includes("एफआईआर") || msg.includes("न्यायालय")) {
    return {
      name: "Kanoon Mitra ⚖️",
      prompt: `You are Kanoon Mitra, an Indian legal information assistant. Help with consumer rights, tenant rights, RTI filing, FIR process, and basic Indian law (IPC, CrPC). Always mention relevant section numbers. Be concise (2-3 sentences max). Reply in the same language as the user.`
    };
  }

  // Health Guide
  if (msg.includes("health") || msg.includes("doctor") || msg.includes("medicine") ||
      msg.includes("symptom") || msg.includes("fever") || msg.includes("pain") ||
      msg.includes("tablet") || msg.includes("disease") || msg.includes("diet") ||
      msg.includes("hospital") || msg.includes("prescription") ||
      msg.includes("बुखार") || msg.includes("दर्द") || msg.includes("दवाई") ||
      msg.includes("बीमारी") || msg.includes("डॉक्टर") || msg.includes("स्वास्थ्य")) {
    return {
      name: "Health Guide ⚕️",
      prompt: `You are Health Guide, a health information assistant for Indian users. Help with symptoms, common medicines, wellness advice, and diet. Always recommend consulting a qualified doctor for serious issues. Be concise (2-3 sentences max). Reply in the same language as the user.`
    };
  }

  // Artha Advisor
  if (msg.includes("invest") || msg.includes("loan") || msg.includes("sip") ||
      msg.includes("mutual fund") || msg.includes("emi") || msg.includes("finance") ||
      msg.includes("saving") || msg.includes("fd") || msg.includes("ppf") ||
      msg.includes("stock") || msg.includes("share") || msg.includes("insurance") ||
      msg.includes("पैसा") || msg.includes("निवेश") || msg.includes("लोन") ||
      msg.includes("बचत") || msg.includes("शेयर") || msg.includes("बीमा")) {
    return {
      name: "Artha Advisor ₹",
      prompt: `You are Artha Advisor, an Indian personal finance assistant. Help with investments, SIP, mutual funds, home loans, EMI calculations, tax saving (80C, NPS), and insurance. Give rupee-specific advice. Be concise (2-3 sentences max). Reply in the same language as the user.`
    };
  }

  // Career Mitra
  if (msg.includes("career") || msg.includes("job") || msg.includes("resume") ||
      msg.includes("skill") || msg.includes("college") || msg.includes("naukri") ||
      msg.includes("interview") || msg.includes("salary") || msg.includes("upsc") ||
      msg.includes("ssc") || msg.includes("placement") || msg.includes("internship") ||
      msg.includes("नौकरी") || msg.includes("करियर") || msg.includes("रिज्यूमे") ||
      msg.includes("इंटरव्यू") || msg.includes("वेतन")) {
    return {
      name: "Career Mitra 🎯",
      prompt: `You are Career Mitra, an Indian career guidance assistant. Help with career choices, skill development, job preparation, resume tips, government exam prep (UPSC, SSC, banking), and entrepreneurship. Be concise (2-3 sentences max). Reply in the same language as the user.`
    };
  }

  // Default → show menu
  return { name: "AI Agents", prompt: "", isMenu: true };
}

// ─── Gemini API Call ──────────────────────────────────────────────────────────
async function callGemini(
  userMessage: string,
  systemPrompt: string,
  history: { role: string; text: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Service unavailable. Please try again later.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

  // Build conversation history (last 4 messages for context)
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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
    return text;
  } catch (err) {
    console.error("Gemini fetch error:", err);
    return "Sorry, something went wrong. Please try again.";
  }
}

// ─── Truncate for WhatsApp (1600 char limit) ──────────────────────────────────
function truncate(text: string, max = 1500): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

// ─── Escape XML ───────────────────────────────────────────────────────────────
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── TwiML Response ───────────────────────────────────────────────────────────
function twimlResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(truncate(message))}</Message>
</Response>`;
  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

// ─── Main Webhook Handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userMessage = ((formData.get("Body") as string) || "").trim();
    const from = (formData.get("From") as string) || "unknown";

    // Empty message guard
    if (!userMessage) {
      return twimlResponse("Please send a message! Type *menu* to see all agents.");
    }

    // Detect which agent to use
    const agent = detectAgent(userMessage);

    // Show menu directly without calling Gemini
    if (agent.isMenu) {
      // Reset session when menu is shown
      sessions.delete(from);
      return twimlResponse(MENU_TEXT);
    }

    // Get or create session for this user
    const session = sessions.get(from) || { agentName: "", history: [] };

    // If user switched agents, clear history
    if (session.agentName && session.agentName !== agent.name) {
      session.history = [];
    }
    session.agentName = agent.name;

    // Call Gemini with history context
    const aiResponse = await callGemini(userMessage, agent.prompt, session.history);

    // Update session history
    session.history.push({ role: "user", text: userMessage });
    session.history.push({ role: "assistant", text: aiResponse });

    // Keep session history manageable (last 10 messages)
    if (session.history.length > 10) {
      session.history = session.history.slice(-10);
    }
    sessions.set(from, session);

    // Format final response
    const finalResponse = `*${agent.name}*\n\n${aiResponse}\n\n_Type *menu* for other agents_`;

    return twimlResponse(finalResponse);

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return twimlResponse("Sorry, something went wrong. Please try again!");
  }
}