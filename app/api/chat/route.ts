import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { messages, system } = body;

    const geminiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiPayload = {
      contents: geminiMessages,
      system_instruction: {
        parts: [{ text: system || "You are a helpful assistant." }],
      },
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7,
      },
    };

    // FIX: Update to a 2026-active model ID
    const model = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json();
      console.error("Gemini API Error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Model error" },
        { status: geminiRes.status }
      );
    }

    return new NextResponse(geminiRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}