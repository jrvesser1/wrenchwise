import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, supabaseAdmin } from "@/lib/server";

export async function POST(req: Request) {
  try {
    // Make sure the user is authenticated
    await requireUser(req);

    const { code, vehicle } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Code required" },
        { status: 400 }
      );
    }

    // Get repair source material from Supabase
    const sb = supabaseAdmin();

    const { data: docs, error: docsError } = await sb
      .from("repair_sources")
      .select("title, url, source_type, content")
      .eq("vehicle_key", vehicle?.key || "")
      .limit(20);

    if (docsError) {
      console.error("Supabase repair_sources error:", docsError);
    }

    // Create Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Ask Claude to analyze the diagnostic code
    const response = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 900,

      system: `
You are a research assistant, not a mechanic.

Explain an OBD diagnostic trouble code using the supplied source material whenever available.

Rules:
- Do not invent facts.
- Do not claim a manufacturer procedure, TSB, recall, specification, repair procedure, or fix unless the supplied sources support it.
- Clearly identify information that is missing or uncertain.
- Include practical diagnostic steps only when they are supported by the available information.
- Include appropriate safety notes.
- Return a clear JSON object with these keys:
  meaning
  diagnostic_steps
  safety_notes
  source_gaps
      `.trim(),

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

    // Extract text from Anthropic's response.
    // This avoids the TypeScript type-predicate error
    // caused by the SDK's TextBlock type.
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return NextResponse.json({
      text,
    });
  } catch (error: unknown) {
    console.error("AI request failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "AI request failed";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
