import { NextResponse } from "next/server";
import { spaceCatalog } from "@/lib/data/spaceCatalog";
import {
  buildFallbackDecision,
  buildRecommendationResponse,
  emptyIntent,
  hasSearchContext,
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
    const forceRecommend = body?.forceRecommend === true;
    const baseIntent = sanitizeIntent(body?.intent) ?? emptyIntent();

    if (!message && !forceRecommend) {
      return NextResponse.json(
        {
          mode: "ask",
          reply: "Me diga em uma frase o tipo de espaco que voce precisa.",
          conversationalIntent: "unknown",
          action: "ask_followup",
          intent: baseIntent,
          conversationSummary: previousSummary,
          recommendations: [],
          quickActions: [],
          followUpKind: "required",
          askedField: "spaceType",
          confidence: 0,
        },
        { status: 400 },
      );
    }

    if (forceRecommend && hasSearchContext(baseIntent)) {
      const spaces = await spaceCatalog.listSpaces();
      return NextResponse.json(
        buildRecommendationResponse(spaces, baseIntent, previousSummary, 1),
      );
    }

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
        quickActions: [],
        followUpKind: "required",
        askedField: "refinement",
        confidence: 0,
      },
      { status: 500 },
    );
  }
}
