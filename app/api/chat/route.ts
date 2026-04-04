import { NextRequest, NextResponse } from "next/server";

// ─── SSE helper ───────────────────────────────────────────────────────────────

function sseChunk(text: string): string {
  const payload = JSON.stringify({
    candidates: [{ content: { parts: [{ text }] } }],
  });
  return `data: ${payload}\n\n`;
}

// ─── Provider definitions ─────────────────────────────────────────────────────

type Provider = {
  name: string;
  call: (
    messages: any[],
    system: string,
    file: any,
    controller: ReadableStreamDefaultController,
    encode: (s: string) => Uint8Array
  ) => Promise<boolean>;
};

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(
  messages: any[],
  system: string,
  file: any,
  controller: ReadableStreamDefaultController,
  encode: (s: string) => Uint8Array
): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false;

  const geminiMessages = messages.map((m: any, i: number) => {
    const isLastUser = m.role === "user" && i === messages.length - 1;
    const parts: any[] = [{ text: m.content }];
    if (isLastUser && file) {
      parts.push({
        inline_data: {
          mime_type: file.type === "image" ? "image/jpeg" : "application/pdf",
          data: file.base64,
        },
      });
    }
    return { role: m.role === "assistant" ? "model" : "user", parts };
  });

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: geminiMessages,
        system_instruction: { parts: [{ text: system }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          responseMimeType: "text/plain",
        },
      }),
    }
  );

  if (!res.ok || !res.body) {
    console.error("Gemini failed:", res.status);
    return false;
  }

  return await pipeSSEStream(res.body, controller, encode, (raw) => {
    const parsed = JSON.parse(raw);
    return parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  });
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(
  messages: any[],
  system: string,
  _file: any,
  controller: ReadableStreamDefaultController,
  encode: (s: string) => Uint8Array
): Promise<boolean> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return false;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 300,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    console.error("Groq failed:", res.status);
    return false;
  }

  return await pipeSSEStream(res.body, controller, encode, (raw) => {
    const parsed = JSON.parse(raw);
    return parsed?.choices?.[0]?.delta?.content ?? null;
  });
}

// ─── Mistral ──────────────────────────────────────────────────────────────────

async function callMistral(
  messages: any[],
  system: string,
  _file: any,
  controller: ReadableStreamDefaultController,
  encode: (s: string) => Uint8Array
): Promise<boolean> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return false;

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 300,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    console.error("Mistral failed:", res.status);
    return false;
  }

  return await pipeSSEStream(res.body, controller, encode, (raw) => {
    const parsed = JSON.parse(raw);
    return parsed?.choices?.[0]?.delta?.content ?? null;
  });
}

// ─── Generic SSE pipe ─────────────────────────────────────────────────────────

async function pipeSSEStream(
  body: ReadableStream<Uint8Array>,
  controller: ReadableStreamDefaultController,
  encode: (s: string) => Uint8Array,
  extractText: (raw: string) => string | null
): Promise<boolean> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let gotAnyText = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const text = extractText(raw);
        if (text) {
          gotAnyText = true;
          controller.enqueue(encode(sseChunk(text)));
        }
      } catch {}
    }
  }

  return gotAnyText;
}

// ─── Main stream factory ──────────────────────────────────────────────────────

function createStream(
  messages: any[],
  system: string,
  file: any
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encode = (s: string) => new TextEncoder().encode(s);

      const providers: Provider[] = [
        { name: "Gemini",  call: callGemini  },
        { name: "Groq",    call: callGroq    },
        { name: "Mistral", call: callMistral },
      ];

      // 🔀 Shuffle to distribute load evenly across all three keys
      const shuffled = providers.sort(() => Math.random() - 0.5);

      let succeeded = false;
      for (const provider of shuffled) {
        console.log(`Trying: ${provider.name}`);
        try {
          succeeded = await provider.call(
            messages,
            system,
            file,
            controller,
            encode
          );
          if (succeeded) {
            console.log(`Success: ${provider.name}`);
            break;
          }
        } catch (err) {
          console.error(`${provider.name} threw:`, err);
        }
      }

      if (!succeeded) {
        controller.enqueue(
          encode(
            sseChunk("⚠️ All AI services are busy. Please try again in a moment.")
          )
        );
      }

      controller.enqueue(encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, system, file } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const stream = createStream(
      messages,
      system || "You are a helpful assistant.",
      file ?? null
    );

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}