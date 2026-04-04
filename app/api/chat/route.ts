import { NextRequest, NextResponse } from "next/server";

async function callAI(messages: any[], system: string) {

  // 👉 1. GEMINI
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    const geminiMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey!,
        },
        body: JSON.stringify({
          contents: geminiMessages,
          system_instruction: {
            parts: [{ text: system || "You are a helpful assistant." }],
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } else {
      console.error("Gemini failed:", res.status);
    }
  } catch (err) {
    console.error("Gemini error:", err);
  }

  // 👉 2. GROQ
  try {
    const groqKey = process.env.GROQ_API_KEY;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content;
    } else {
      console.error("Groq failed:", res.status);
    }
  } catch (err) {
    console.error("Groq error:", err);
  }

  // 👉 3. MISTRAL
  try {
    const mistralKey = process.env.MISTRAL_API_KEY;

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small",
        messages,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content;
    } else {
      console.error("Mistral failed:", res.status);
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
      reply,
    });

  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}