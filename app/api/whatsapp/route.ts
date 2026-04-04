import { NextRequest, NextResponse } from "next/server";

function detectAgent(message: string): { name: string; prompt: string } {
  const msg = message.toLowerCase();

  if (msg.includes("crop") || msg.includes("farm") || msg.includes("kisan") ||
      msg.includes("mandi") || msg.includes("fasal") || msg.includes("kheti") ||
      msg.includes("फसल") || msg.includes("किसान") || msg.includes("खेती")) {
    return {
      name: "Krishi Mitra 🌾",
      prompt: `You are Krishi Mitra, an expert Indian agricultural assistant. Help with crop advice, mandi prices, MSP, and government schemes like PM-KISAN. Be VERY concise (2-3 sentences). Reply in same language as user.`
    };
  }
  if (msg.includes("gst") || msg.includes("tax") || msg.includes("filing") ||
      msg.includes("itc") || msg.includes("return") || msg.includes("invoice")) {
    return {
      name: "GST Saathi 🧾",
      prompt: `You are GST Saathi, an expert Indian GST assistant. Help with filing, ITC, HSN codes, deadlines. Be concise (2-3 sentences). Reply in same language as user.`
    };
  }
  if (msg.includes("law") || msg.includes("legal") || msg.includes("court") ||
      msg.includes("police") || msg.includes("fir") || msg.includes("kanoon") ||
      msg.includes("कानून") || msg.includes("वकील")) {
    return {
      name: "Kanoon Mitra ⚖️",
      prompt: `You are Kanoon Mitra, an Indian legal information assistant. Help with consumer rights, tenant rights, RTI, FIR process. Be concise (2-3 sentences). Reply in same language as user.`
    };
  }
  if (msg.includes("health") || msg.includes("doctor") || msg.includes("medicine") ||
      msg.includes("symptom") || msg.includes("fever") || msg.includes("pain") ||
      msg.includes("बुखार") || msg.includes("दर्द") || msg.includes("दवाई")) {
    return {
      name: "Health Guide ⚕️",
      prompt: `You are Health Guide, a health information assistant. Help with symptoms, medicines, wellness. Be concise (2-3 sentences). Always suggest seeing a doctor. Reply in same language as user.`
    };
  }
  if (msg.includes("invest") || msg.includes("loan") || msg.includes("sip") ||
      msg.includes("mutual fund") || msg.includes("emi") || msg.includes("finance") ||
      msg.includes("पैसा") || msg.includes("निवेश") || msg.includes("लोन")) {
    return {
      name: "Artha Advisor ₹",
      prompt: `You are Artha Advisor, an Indian personal finance assistant. Help with investments, loans, SIP, tax saving. Be concise (2-3 sentences). Reply in same language as user.`
    };
  }
  if (msg.includes("career") || msg.includes("job") || msg.includes("resume") ||
      msg.includes("skill") || msg.includes("college") || msg.includes("naukri") ||
      msg.includes("नौकरी") || msg.includes("करियर")) {
    return {
      name: "Career Mitra 🎯",
      prompt: `You are Career Mitra, an Indian career guidance assistant. Help with career choices, skills, job prep, resume. Be concise (2-3 sentences). Reply in same language as user.`
    };
  }

  return {
    name: "AI Agents",
    prompt: `You are a helpful AI assistant. Reply ONLY with this menu:

🤖 *AI Agents Marketplace*
Choose your assistant:

🌾 *Krishi Mitra* — Crop advice, mandi prices, schemes
🧾 *GST Saathi* — Filing, ITC, HSN codes
⚖️ *Kanoon Mitra* — Legal rights, RTI, FIR
⚕️ *Health Guide* — Symptoms, medicines, wellness
₹ *Artha Advisor* — Investments, loans, SIP
🎯 *Career Mitra* — Jobs, skills, career guidance

Just type your question and I'll connect you to the right expert!`
  };
}

async function callGemini(userMessage: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Service unavailable. Please try again later.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

  const res = await fetch(url, {
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
  });

  if (!res.ok) return "Sorry, I couldn't process that. Please try again.";

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
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
    const aiResponse = await callGemini(userMessage, agent.prompt);

    const finalResponse = agent.name === "AI Agents"
      ? aiResponse
      : `*${agent.name}*\n\n${aiResponse}\n\n_Powered by AI Agents Marketplace_`;

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