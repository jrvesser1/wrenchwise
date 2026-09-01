import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, supabaseAdmin } from "@/lib/server";

export async function POST(req: Request) {
  try {
    await requireUser(req);

    const { code, vehicle } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Code required" },
        { status: 400 }
      );
    }

    const sb = supabaseAdmin();

    const { data: docs, error: docsError } = await sb
      .from("repair_sources")
      .select("title,url,source_type,content")
      .eq("vehicle_key", vehicle?.key || "")
      .limit(20);

    if (docsError) {
      return NextResponse.json(
        { error: docsError.message },
        { status: 500 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({
      apiKey,
    });

    const response = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 900,

      system: `
You are a research assistant, not a mechanic.

Explain an OBD diagnostic code using reliable supplied source material when available.

Rules:
- Never invent repair procedures.
- Never claim a manufacturer procedure, TSB, recall, specification, or confirmed fix unless the supplied sources support it.
- Clearly identify information that is missing or uncertain.
- Prefer supplied repair_sources over unsupported general knowledge.
- Include safety considerations when appropriate.
- Return valid JSON with exactly these keys:
  meaning,
  diagnostic_steps,
  safety_notes,
  source_gaps
`,

      messages: [
        {
          role: "user",
          content: JSON.stringify({
            code,
            vehicle,
            sources: docs || [],
          }),
        },
      ],
    });

    const text = response.content
      .map((block) => {
        if (block.type === "text") {
          return block.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({ text });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "AI request failed";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
