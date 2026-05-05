import type {
  AiDecision,
  ChatIntent,
  ChatResponse,
  ChatTurnInput,
  QuestionField,
  QuickAction,
} from "./types";
import { emptyIntent, extractedToIntent, getAskedField, mergeIntent } from "./intent";
import { parseLocalIntent } from "./fallback";
import { rankRecommendations } from "./ranking";
import { normalizeText } from "./shared";
import type { Space } from "@/lib/data/contracts";

export const hasSearchContext = (intent: ChatIntent) => {
  const hasType = Boolean(intent.tipoEspaco || intent.tipoEvento);
  const hasCapacity = Boolean(intent.quantidadePessoas);

  return hasType && hasCapacity;
};

const canRecommend = (intent: ChatIntent, decision: AiDecision) => {
  const recommendationRequested =
    decision.intent === "search" &&
    (decision.action === "recommend" || decision.action === "no_exact_match");

  return recommendationRequested && hasSearchContext(intent);
};

const normalizeList = (items: string[]) => items.map((item) => normalizeText(item)).sort();

const arraysMatch = (left: string[], right: string[]) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

const hasSearchIntentMutation = (previous: ChatIntent, next: ChatIntent) => {
  if (normalizeText(previous.tipoEspaco ?? "") !== normalizeText(next.tipoEspaco ?? "")) return true;
  if (normalizeText(previous.tipoEvento ?? "") !== normalizeText(next.tipoEvento ?? "")) return true;
  if ((previous.quantidadePessoas ?? null) !== (next.quantidadePessoas ?? null)) return true;
  if (normalizeText(previous.cidadeIncluida ?? "") !== normalizeText(next.cidadeIncluida ?? "")) return true;
  if (
    !arraysMatch(normalizeList(previous.locations), normalizeList(next.locations)) ||
    !arraysMatch(normalizeList(previous.cidadesExcluidas), normalizeList(next.cidadesExcluidas))
  ) {
    return true;
  }

  return false;
};

const isAffirmationMessage = (message: string) =>
  /^(sim|s|isso|isso mesmo|ok|okay|certo|claro|pode|pode sim|pode mandar|manda|envia|quero sim)$/i.test(
    message.trim(),
  );

const shouldForceRecommend = (
  input: ChatTurnInput,
  nextIntent: ChatIntent,
  aiDecision: AiDecision,
) => {
  if (!hasSearchContext(nextIntent)) return false;
  if (aiDecision.intent === "cancel" || aiDecision.intent === "thanks" || aiDecision.intent === "casual") {
    return false;
  }
  if (canRecommend(nextIntent, aiDecision)) return true;

  if (input.previousAskedField && hasValueForField(nextIntent, input.previousAskedField)) {
    return true;
  }

  if (hasSearchContext(input.baseIntent) && hasSearchIntentMutation(input.baseIntent, nextIntent)) {
    return true;
  }

  if (isAffirmationMessage(input.message) && hasSearchContext(input.baseIntent)) {
    return true;
  }

  return aiDecision.action === "reply_only";
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

const buildRefinementQuickActions = (intent: ChatIntent): QuickAction[] => {
  const actions: QuickAction[] = [];

  if (!intent.cidadeIncluida) {
    actions.push({
      label: "Adicionar bairro",
      kind: "refine_location",
      message: "Quero refinar por bairro.",
    });
  }

  if (!intent.orcamentoMaximo) {
    actions.push({
      label: "Informar orcamento",
      kind: "refine_budget",
      message: "Quero informar um orcamento maximo.",
    });
  }

  if (!intent.recursosDesejados.length) {
    actions.push({
      label: "Adicionar recursos",
      kind: "refine_resources",
      message: "Quero adicionar recursos desejados.",
    });
  }

  if (intent.quantidadePessoas) {
    actions.push({
      label: "Ajustar lotacao",
      kind: "refine_capacity",
      message: "Quero ajustar a lotacao.",
    });
  }

  return actions.slice(0, 4);
};

const buildOptionalQuickActions = (intent: ChatIntent): QuickAction[] => [
  {
    label: "Ver opcoes agora",
    kind: "search_now",
  },
  ...buildRefinementQuickActions(intent).slice(0, 3),
];

const buildOptionalFollowUpReply = (intent: ChatIntent) => {
  const refinements: string[] = [];

  if (!intent.cidadeIncluida) refinements.push("bairro");
  if (!intent.orcamentoMaximo) refinements.push("orcamento");
  if (!intent.recursosDesejados.length) refinements.push("recursos");

  if (refinements.length === 0) {
    return "Ja encontrei algumas opcoes. Se quiser, ainda posso ajustar a lotacao antes de mostrar.";
  }

  const refinementText =
    refinements.length === 1
      ? refinements[0]
      : `${refinements.slice(0, -1).join(", ")} ou ${refinements.at(-1)}`;

  return `Ja encontrei algumas opcoes. Quer refinar por ${refinementText}?`;
};

export const buildRecommendationResponse = (
  spaces: Space[],
  intent: ChatIntent,
  conversationSummary: string,
  confidence: number,
): ChatResponse => {
  const recommendationResult = rankRecommendations(spaces, intent);
  const action =
    recommendationResult.matchMode === "no_exact_match" ? "no_exact_match" : "recommend";

  return {
    mode: "recommend",
    reply: recommendationResult.reply,
    conversationalIntent: "search",
    action,
    intent,
    conversationSummary,
    recommendations: recommendationResult.recommendations,
    quickActions: buildRefinementQuickActions(intent),
    confidence,
    matchMode: recommendationResult.matchMode,
  };
};

const buildOptionalFollowUpResponse = (
  intent: ChatIntent,
  conversationSummary: string,
  confidence: number,
): ChatResponse => ({
  mode: "ask",
  reply: buildOptionalFollowUpReply(intent),
  conversationalIntent: "search",
  action: "ask_followup",
  intent,
  conversationSummary,
  recommendations: [],
  quickActions: buildOptionalQuickActions(intent),
  followUpKind: "optional",
  askedField: "refinement",
  confidence,
});

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
      quickActions: [],
      confidence: input.aiDecision.confidence,
      resetContext: true,
    };
  }

  if (shouldForceRecommend(input, nextIntent, input.aiDecision)) {
    return buildRecommendationResponse(
      spaces,
      nextIntent,
      nextSummary,
      input.aiDecision.confidence,
    );
  }

  if (input.aiDecision.action === "ask_followup" || input.aiDecision.intent === "search") {
    const askedField: QuestionField = getAskedField(input.aiDecision, nextIntent);

    if (hasValueForField(nextIntent, askedField)) {
      const nextCriticalField = getNextCriticalField(nextIntent);

      if (!nextCriticalField) {
        return buildOptionalFollowUpResponse(
          nextIntent,
          nextSummary,
          input.aiDecision.confidence,
        );
      }

      return {
        mode: "ask",
        reply: followUpByField[nextCriticalField],
        conversationalIntent: "search",
        action: "ask_followup",
        intent: nextIntent,
        conversationSummary: nextSummary,
        recommendations: [],
        quickActions: [],
        followUpKind: "required",
        askedField: nextCriticalField,
        confidence: input.aiDecision.confidence,
      };
    }

    if (hasSearchContext(nextIntent)) {
      return buildOptionalFollowUpResponse(
        nextIntent,
        nextSummary,
        input.aiDecision.confidence,
      );
    }

    return {
      mode: "ask",
      reply: normalizeReply(input.aiDecision.reply, followUpByField[askedField]),
      conversationalIntent: input.aiDecision.intent,
      action: "ask_followup",
      intent: nextIntent,
      conversationSummary: nextSummary,
      recommendations: [],
      quickActions: [],
      followUpKind: "required",
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
    quickActions: [],
    confidence: input.aiDecision.confidence,
  };
};
