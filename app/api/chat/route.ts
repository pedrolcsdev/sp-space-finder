import { NextResponse } from "next/server";
import { spaceCatalog } from "@/lib/data/spaceCatalog";
import {
  buildFallbackDecision,
  emptyIntent,
  resolveChatTurn,
  sanitizeIntent,
  type QuestionField,
} from "@/lib/chat/engine";
import { chatWithGroq } from "@/lib/chat/groq";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const previousSummary =
      typeof body?.conversationSummary === "string" ? body.conversationSummary.slice(-900) : "";
    const previousAskedField =
      typeof body?.previousAskedField === "string"
        ? (body.previousAskedField as QuestionField)
        : undefined;

    if (!message) {
      return NextResponse.json(
        {
          mode: "ask",
          reply: "Me diga em uma frase o tipo de espaco que voce precisa.",
          conversationalIntent: "unknown",
          action: "ask_followup",
          intent: emptyIntent(),
          conversationSummary: previousSummary,
          recommendations: [],
          followUpActions: [],
          askedField: "spaceType",
          confidence: 0,
        },
        { status: 400 },
      );
    }

    const baseIntent = sanitizeIntent(body?.intent) ?? emptyIntent();
    const aiDecision =
      (await chatWithGroq({
        message,
        conversationSummary: previousSummary,
        currentIntent: baseIntent,
        previousAskedField,
      })) ??
      buildFallbackDecision(message, baseIntent, previousAskedField);
    const spaces = await spaceCatalog.listSpaces();
    const response = resolveChatTurn(
      {
        message,
        previousSummary,
        baseIntent,
        aiDecision,
        previousAskedField,
      },
      spaces,
    );

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        mode: "ask",
        reply:
          "Tive uma instabilidade agora, mas posso te ajudar se voce me disser tipo de espaco, quantidade de pessoas, bairro ou orcamento.",
        conversationalIntent: "unknown",
        action: "ask_followup",
        intent: emptyIntent(),
        conversationSummary: "",
        recommendations: [],
        followUpActions: [],
        askedField: "refinement",
        confidence: 0,
      },
      { status: 500 },
    );
  }
}
