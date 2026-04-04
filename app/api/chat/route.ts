import { NextRequest, NextResponse } from "next/server";

async function callAI(messages: any[], system: string): Promise<string> {
  // 👉 1. GEMINI
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("No Gemini API key");

    const geminiMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: geminiMessages,
          system_instruction: {
            parts: [{ text: system || "You are a helpful assistant. Return ONLY plain text, never JSON or objects." }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            // ⭐ CRITICAL: Force plain text
            responseMimeType: "text/plain",
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === "string") {
        // Clean any JSON that slips through
        return text.replace(/\{[^{}]*\}/g, '').trim();
      }
    } else {
      console.error("Gemini failed:", res.status);
    }
  } catch (err) {
    console.error("Gemini error:", err);
  }

  // 👉 2. GROQ
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: system + " Return ONLY plain text, never JSON or objects." },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text.replace(/\{[^{}]*\}/g, '').trim();
      }
    }
  } catch (err) {
    console.error("Groq error:", err);
  }

  // 👉 3. MISTRAL
  try {
    const mistralKey = process.env.MISTRAL_API_KEY;
    if (mistralKey) {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mistralKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small",
          messages: [
            { role: "system", content: system + " Return ONLY plain text, never JSON or objects." },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text.replace(/\{[^{}]*\}/g, '').trim();
      }
    }
  } catch (err) {
    console.error("Mistral error:", err);
  }

  return "⚠️ All AI services are busy. Try again.";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, system } = body;

    const reply = await callAI(messages, system);

    return NextResponse.json({
      reply: reply,
    });

  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}