import { NextRequest, NextResponse } from "next/server";

// ─── In-memory sessions (phone → session) ─────────────────────────────────────
// NOTE: This resets on server restart / Vercel cold start.
// For persistence, replace with Supabase or Redis.

const sessions = new Map<
  string,
  { agentName: string; history: { role: string; text: string }[] }
>();

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentConfig {
  name: string;
  prompt: string;
  isMenu?: boolean;
}

// ─── Menu text ────────────────────────────────────────────────────────────────

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

// ─── Agent prompts ────────────────────────────────────────────────────────────

const AGENT_PROMPTS: Record<string, string> = {
  "Krishi Mitra 🌾": `You are Krishi Mitra, an expert Indian agricultural assistant. Help with crop advice, mandi prices, MSP, and government schemes like PM-KISAN, PMFBY, eNAM. Give state-specific advice when mentioned. Be VERY concise (2-3 sentences max). Reply in the same language as the user.`,
  "GST Saathi 🧾": `You are GST Saathi, an expert Indian GST assistant. Help with GST filing, ITC claims, HSN codes, GSTR deadlines, and e-way bills. Be concise (2-3 sentences max). Reply in the same language as the user.`,
  "Kanoon Mitra ⚖️": `You are Kanoon Mitra, an Indian legal information assistant. Help with consumer rights, tenant rights, RTI filing, FIR process, and basic Indian law. Be concise (2-3 sentences max). Reply in the same language as the user.`,
  "Health Guide ⚕️": `You are Health Guide, a health information assistant. Help with symptoms, medicines, wellness. Always recommend a doctor. Be concise (2-3 sentences max). Reply in the same language as the user.`,
  "Artha Advisor ₹": `You are Artha Advisor, an Indian personal finance assistant. Help with investments, SIP, loans, EMI, tax saving. Be concise (2-3 sentences max). Reply in the same language as the user.`,
  "Career Mitra 🎯": `You are Career Mitra, an Indian career guidance assistant. Help with career, jobs, resume, interviews. Be concise (2-3 sentences max). Reply in the same language as the user.`,
};

// ─── Agent detection ──────────────────────────────────────────────────────────

function detectAgent(message: string): AgentConfig {
  const msg = message.toLowerCase().trim();

  const greetings = ["hi", "hello", "hey", "start", "help", "menu", "हेलो", "नमस्ते", "हाय", "namaste"];
  if (greetings.some((g) => msg === g || msg.startsWith(g + " ")) || msg.length <= 3) {
    return { name: "AI Agents", prompt: "", isMenu: true };
  }

  if (
    msg.includes("crop") || msg.includes("farm") || msg.includes("kisan") ||
    msg.includes("mandi") || msg.includes("fasal") || msg.includes("kheti") ||
    msg.includes("wheat") || msg.includes("rice") || msg.includes("paddy") ||
    msg.includes("fertilizer") || msg.includes("seed") || msg.includes("irrigation") ||
    msg.includes("फसल") || msg.includes("किसान") || msg.includes("खेती") ||
    msg.includes("मंडी") || msg.includes("बीज") || msg.includes("उर्वरक")
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

  // Default: show menu for unrecognized messages
  return { name: "AI Agents", prompt: "", isMenu: true };
}

// ─── AI providers ─────────────────────────────────────────────────────────────

async function callGemini(
  userMessage: string,
  systemPrompt: string,
  history: { role: string; text: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY_WHATSAPP; // ✅ fixed typo (was WHATSAPPY)
  if (!apiKey) throw new Error("Gemini API key missing");

  const contents = [
    ...history.slice(-4).map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
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
    }
  );

  if (!res.ok) throw new Error(`Gemini error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function callGroq(
  userMessage: string,
  systemPrompt: string,
  history: { role: string; text: string }[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing");

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-4).map((h) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text,
    })),
    { role: "user", content: userMessage },
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty response");
  return text;
}

async function callMistral(
  userMessage: string,
  systemPrompt: string,
  history: { role: string; text: string }[]
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("Mistral API key missing");

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-4).map((h) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text,
    })),
    { role: "user", content: userMessage },
  ];

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Mistral error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Mistral returned empty response");
  return text;
}

// ─── Multi-provider fallback with random rotation ─────────────────────────────

async function callAIWithFallback(
  userMessage: string,
  systemPrompt: string,
  history: { role: string; text: string }[]
): Promise<string> {
  const providers = [
    {
      name: "Gemini",
      enabled: !!process.env.GEMINI_API_KEY_WHATSAPP,
      fn: () => callGemini(userMessage, systemPrompt, history),
    },
    {
      name: "Groq",
      enabled: !!process.env.GROQ_API_KEY,
      fn: () => callGroq(userMessage, systemPrompt, history),
    },
    {
      name: "Mistral",
      enabled: !!process.env.MISTRAL_API_KEY,
      fn: () => callMistral(userMessage, systemPrompt, history),
    },
  ]
    .filter((p) => p.enabled)
    // 🔀 Shuffle to spread load evenly across all keys
    .sort(() => Math.random() - 0.5);

  for (const provider of providers) {
    try {
      console.log(`🔄 Trying: ${provider.name}`);
      const response = await provider.fn();
      console.log(`✅ Success: ${provider.name}`);
      return response;
    } catch (err) {
      console.error(`❌ ${provider.name} failed:`, err instanceof Error ? err.message : err);
    }
  }

  return "Sorry, all AI services are currently unavailable. Please try again in a few moments.";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userMessage = ((formData.get("Body") as string) || "").trim();
    const from = (formData.get("From") as string) || "unknown";

    if (!userMessage) {
      return twimlResponse("Please send a message! Type *menu* to see all agents.");
    }

    const agent = detectAgent(userMessage);

    if (agent.isMenu) {
      // If user already has an active session, keep using that agent
      const existingSession = sessions.get(from);
      if (existingSession?.agentName && existingSession.history.length > 0) {
        const prompt = AGENT_PROMPTS[existingSession.agentName];
        if (prompt) {
          const aiResponse = await callAIWithFallback(userMessage, prompt, existingSession.history);
          existingSession.history.push({ role: "user", text: userMessage });
          existingSession.history.push({ role: "assistant", text: aiResponse });
          if (existingSession.history.length > 10) {
            existingSession.history = existingSession.history.slice(-10);
          }
          sessions.set(from, existingSession);
          return twimlResponse(`*${existingSession.agentName}*\n\n${aiResponse}\n\n_Type *menu* for other agents_`);
        }
      }
      // No active session — show menu
      sessions.delete(from);
      return twimlResponse(MENU_TEXT);
    }

    // Get or create session
    const session = sessions.get(from) || { agentName: "", history: [] };

    // Reset history if user switched to a different agent
    if (session.agentName && session.agentName !== agent.name) {
      session.history = [];
    }
    session.agentName = agent.name;

    const aiResponse = await callAIWithFallback(userMessage, agent.prompt, session.history);

    session.history.push({ role: "user", text: userMessage });
    session.history.push({ role: "assistant", text: aiResponse });
    if (session.history.length > 10) {
      session.history = session.history.slice(-10);
    }
    sessions.set(from, session);

    return twimlResponse(`*${agent.name}*\n\n${aiResponse}\n\n_Type *menu* for other agents_`);

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return twimlResponse("Sorry, something went wrong. Please try again!");
  }
}