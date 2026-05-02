import type { AiDecision, ChatIntent, ChatResponse, ChatTurnInput, QuestionField } from "./types";
import { emptyIntent, extractedToIntent, getAskedField, mergeIntent } from "./intent";
import { parseLocalIntent } from "./fallback";
import { rankRecommendations } from "./ranking";
import type { Space } from "@/lib/data/contracts";

const canRecommend = (intent: ChatIntent, decision: AiDecision) => {
  const hasType = Boolean(intent.tipoEspaco || intent.tipoEvento);
  const hasCapacity = Boolean(intent.quantidadePessoas);
  const recommendationRequested =
    decision.intent === "search" &&
    (decision.action === "recommend" || decision.action === "no_exact_match");

  return recommendationRequested && hasType && hasCapacity;
};

const hasValueForField = (intent: ChatIntent, field: QuestionField) => {
  switch (field) {
    case "spaceType":
      return Boolean(intent.tipoEspaco || intent.tipoEvento);
    case "location":
      return Boolean(intent.cidadeIncluida || intent.locations.length > 0);
    case "capacity":
      return Boolean(intent.quantidadePessoas);
    case "budget":
      return Boolean(intent.orcamentoMaximo);
    case "refinement":
      return false;
  }
};

const getNextCriticalField = (intent: ChatIntent): QuestionField | null => {
  if (!hasValueForField(intent, "spaceType")) return "spaceType";
  if (!hasValueForField(intent, "capacity")) return "capacity";
  return null;
};

const followUpByField: Record<QuestionField, string> = {
  spaceType: "Que tipo de espaco combina melhor com o que voce precisa?",
  location: "Se quiser, posso refinar por bairro ou regiao dentro de Sao Luis.",
  capacity: "Para quantas pessoas voce precisa do espaco?",
  budget: "Se quiser, eu tambem posso considerar uma faixa de valor por hora. Qual teto faz sentido?",
  refinement: "Me passa mais um detalhe para eu refinar a busca.",
};

const normalizeReply = (reply: string, fallback: string) => {
  const trimmed = reply.trim();
  if (!trimmed) return fallback;

  const questionMarks = (trimmed.match(/\?/g) ?? []).length;
  if (questionMarks > 1) {
    return fallback;
  }

  return trimmed;
};

const buildConversationSummary = (
  previousSummary: string,
  message: string,
  intent: ChatIntent,
  aiDecision: AiDecision,
) => {
  const facts = [
    intent.tipoEspaco ? `tipo de espaco: ${intent.tipoEspaco}` : undefined,
    intent.tipoEvento ? `tipo de evento: ${intent.tipoEvento}` : undefined,
    intent.quantidadePessoas ? `pessoas: ${intent.quantidadePessoas}` : undefined,
    intent.cidadeIncluida ? `regiao: ${intent.cidadeIncluida}` : undefined,
    intent.cidadesExcluidas.length > 0 ? `evitar: ${intent.cidadesExcluidas.join(", ")}` : undefined,
    intent.recursosDesejados.length > 0 ? `recursos: ${intent.recursosDesejados.join(", ")}` : undefined,
    intent.orcamentoMaximo ? `orcamento: R$ ${intent.orcamentoMaximo}/hora` : undefined,
  ].filter(Boolean);

  const next = [
    previousSummary,
    `Mensagem recente: "${message}".`,
    `Leitura da IA: intencao ${aiDecision.intent}, acao ${aiDecision.action}.`,
    facts.length > 0 ? `Contexto atual: ${facts.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return next.length > 900 ? next.slice(next.length - 900) : next;
};

const buildFollowUpActions = (intent: ChatIntent) => {
  const actions: string[] = [];

  if (!intent.cidadeIncluida) actions.push("Refinar por bairro");
  if (!intent.orcamentoMaximo) actions.push("Informar orcamento");
  if (!intent.recursosDesejados.length) actions.push("Adicionar recursos");
  if (intent.quantidadePessoas) actions.push("Ajustar lotacao");

  return actions.slice(0, 3);
};

export const resolveChatTurn = (
  input: ChatTurnInput,
  spaces: Space[],
): ChatResponse => {
  const repairedIntentPatch = parseLocalIntent(input.message, {
    previousAskedField: input.previousAskedField,
  });
  const extractedIntent = extractedToIntent(input.aiDecision.extracted);
  const nextIntent =
    input.aiDecision.intent === "cancel"
      ? emptyIntent()
      : mergeIntent(
          mergeIntent(input.baseIntent, extractedIntent),
          repairedIntentPatch,
        );
  const nextSummary =
    input.aiDecision.intent === "cancel"
      ? ""
      : buildConversationSummary(
          input.previousSummary,
          input.message,
          nextIntent,
          input.aiDecision,
        );

  if (input.aiDecision.intent === "cancel") {
    return {
      mode: "reply",
      reply: input.aiDecision.reply,
      conversationalIntent: input.aiDecision.intent,
      action: "reply_only",
      intent: emptyIntent(),
      conversationSummary: "",
      recommendations: [],
      followUpActions: [],
      confidence: input.aiDecision.confidence,
      resetContext: true,
    };
  }

  if (canRecommend(nextIntent, input.aiDecision)) {
    const recommendationResult = rankRecommendations(spaces, nextIntent);
    const action =
      recommendationResult.matchMode === "no_exact_match" ? "no_exact_match" : "recommend";

    return {
      mode: "recommend",
      reply: recommendationResult.reply,
      conversationalIntent: input.aiDecision.intent,
      action,
      intent: nextIntent,
      conversationSummary: nextSummary,
      recommendations: recommendationResult.recommendations,
      followUpActions: buildFollowUpActions(nextIntent),
      confidence: input.aiDecision.confidence,
      matchMode: recommendationResult.matchMode,
    };
  }

  if (input.aiDecision.action === "ask_followup" || input.aiDecision.intent === "search") {
    const askedField: QuestionField = getAskedField(input.aiDecision, nextIntent);

    if (hasValueForField(nextIntent, askedField)) {
      const nextCriticalField = getNextCriticalField(nextIntent);

      if (!nextCriticalField) {
        const recommendationResult = rankRecommendations(spaces, nextIntent);
        const action =
          recommendationResult.matchMode === "no_exact_match" ? "no_exact_match" : "recommend";

        return {
          mode: "recommend",
          reply: recommendationResult.reply,
          conversationalIntent: "search",
          action,
          intent: nextIntent,
          conversationSummary: nextSummary,
          recommendations: recommendationResult.recommendations,
          followUpActions: buildFollowUpActions(nextIntent),
          confidence: input.aiDecision.confidence,
          matchMode: recommendationResult.matchMode,
        };
      }

      return {
        mode: "ask",
        reply: followUpByField[nextCriticalField],
        conversationalIntent: "search",
        action: "ask_followup",
        intent: nextIntent,
        conversationSummary: nextSummary,
        recommendations: [],
        followUpActions: [],
        askedField: nextCriticalField,
        confidence: input.aiDecision.confidence,
      };
    }

    return {
      mode: "ask",
      reply: normalizeReply(input.aiDecision.reply, followUpByField[askedField]),
      conversationalIntent: input.aiDecision.intent,
      action: "ask_followup",
      intent: nextIntent,
      conversationSummary: nextSummary,
      recommendations: [],
      followUpActions: [],
      askedField,
      confidence: input.aiDecision.confidence,
    };
  }

  return {
    mode: "reply",
    reply: input.aiDecision.reply,
    conversationalIntent: input.aiDecision.intent,
    action: "reply_only",
    intent: nextIntent,
    conversationSummary: nextSummary,
    recommendations: [],
    followUpActions: [],
    confidence: input.aiDecision.confidence,
  };
};
