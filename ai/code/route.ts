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
      .select("title, url, source_type, content")
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

Explain an OBD diagnostic code using only reliable supplied source material when available.

Never claim a manufacturer procedure, TSB, recall, specification, diagnosis, or repair unless the supplied sources support it.

If the supplied sources do not contain enough information, clearly say that the information is missing.

Return valid JSON with exactly these keys:

{
  "meaning": "...",
  "diagnostic_steps": [],
  "safety_notes": [],
  "source_gaps": []
}
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

    let text = "";

    for (const block of response.content) {
      if (block.type === "text") {
        text += block.text;
      }
    }

    return NextResponse.json({
      text,
    });
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
