import type { Space, SpaceCategory } from "@/lib/data/contracts";
import type { ChatIntent, ChatRecommendation, MatchMode } from "./types";
import { isBaseCity, normalizeText } from "./shared";

export const QUALITY_THRESHOLD = 62;

interface ScoredRecommendation {
  recommendation: ChatRecommendation;
  score: number;
  semanticScore: number;
  resourceScore: number;
}

interface RecommendationResult {
  matchMode: MatchMode;
  recommendations: ChatRecommendation[];
  reply: string;
}

const inferCategorySignal = (
  tipoEspaco?: string,
  tipoEvento?: string,
  quantidadePessoas?: number,
): SpaceCategory | undefined => {
  const reference = normalizeText(`${tipoEspaco ?? ""} ${tipoEvento ?? ""}`);
  if (!reference.trim()) return undefined;

  if (
    reference.includes("odont") ||
    reference.includes("consulta") ||
    reference.includes("clinica")
  ) {
    return "dental";
  }

  if (
    reference.includes("palestra") ||
    reference.includes("apresentacao") ||
    reference.includes("auditorio") ||
    reference.includes("evento") ||
    reference.includes("workshop")
  ) {
    return quantidadePessoas && quantidadePessoas <= 24 ? "meeting" : "auditorium";
  }

  if (
    reference.includes("reuniao") ||
    reference.includes("treinamento") ||
    reference.includes("board") ||
    reference.includes("encontro")
  ) {
    return quantidadePessoas && quantidadePessoas > 40 ? "auditorium" : "meeting";
  }

  return undefined;
};

const resourceMatches = (spaceResource: string, desired: string) =>
  normalizeText(spaceResource).includes(normalizeText(desired)) ||
  normalizeText(desired).includes(normalizeText(spaceResource));

const getCapacityScore = (requested: number, available: number) => {
  const ratio = available / requested;

  if (ratio >= 1) {
    if (ratio <= 1.2) return 1;
    if (ratio <= 1.6) return 0.93;
    if (ratio <= 2.5) return 0.84;
    return 0.72;
  }

  if (ratio >= 0.9) return 0.58 + (ratio - 0.9) * 2.4;
  if (ratio >= 0.75) return 0.24 + (ratio - 0.75) * 2.2;
  if (ratio >= 0.5) return 0.05 + (ratio - 0.5) * 0.76;

  return Math.max(0, ratio * 0.08);
};

const getSemanticScore = (space: Space, intent: ChatIntent) => {
  const inferredCategory = inferCategorySignal(
    intent.tipoEspaco,
    intent.tipoEvento,
    intent.quantidadePessoas,
  );
  const reference = normalizeText(`${intent.tipoEspaco ?? ""} ${intent.tipoEvento ?? ""}`);

  if (!reference.trim()) return 0.5;
  if (inferredCategory && space.category === inferredCategory) return 1;

  const hints: Record<Space["category"], string[]> = {
    auditorium: ["palestra", "apresentacao", "evento", "auditorio", "workshop"],
    meeting: ["reuniao", "treinamento", "encontro", "board", "time"],
    dental: ["odonto", "consulta", "clinica", "consultorio"],
  };

  if (hints[space.category].some((hint) => reference.includes(hint))) {
    return 0.7;
  }

  return 0.12;
};

const getLocationScore = (space: Space, intent: ChatIntent) => {
  if (!intent.cidadeIncluida || isBaseCity(intent.cidadeIncluida)) return 0.78;
  return normalizeText(space.location).includes(normalizeText(intent.cidadeIncluida)) ? 1 : 0.12;
};

const getResourceScore = (space: Space, intent: ChatIntent) => {
  if (intent.recursosDesejados.length === 0) return 0.78;

  const matched = intent.recursosDesejados.filter((desired) =>
    space.resources.some((resource) => resourceMatches(resource, desired)),
  ).length;

  return matched / intent.recursosDesejados.length;
};

const getBudgetScore = (space: Space, budget?: number) => {
  if (!budget) return 0.72;
  if (space.pricePerHour <= budget) return 1;

  const overRatio = (space.pricePerHour - budget) / budget;
  return Math.max(0, 1 - overRatio * 1.9);
};

const buildReasons = (
  space: Space,
  intent: ChatIntent,
  semanticScore: number,
  resourceScore: number,
  budgetScore: number,
) => {
  const reasons: string[] = [];

  if (space.capacity >= (intent.quantidadePessoas ?? 0)) {
    reasons.push(`Capacidade para ate ${space.capacity} pessoas`);
  } else {
    reasons.push(`Capacidade atual de ${space.capacity} pessoas`);
  }

  if (semanticScore >= 0.9) {
    reasons.push("Perfil do espaco bem alinhado com o tipo de uso pedido");
  }

  if (
    intent.cidadeIncluida &&
    !isBaseCity(intent.cidadeIncluida) &&
    normalizeText(space.location).includes(normalizeText(intent.cidadeIncluida))
  ) {
    reasons.push(`Na regiao de ${intent.cidadeIncluida}`);
  }

  if (intent.recursosDesejados.length > 0 && resourceScore > 0) {
    const matched = intent.recursosDesejados.filter((desired) =>
      space.resources.some((resource) => resourceMatches(resource, desired)),
    );
    if (matched.length > 0) {
      reasons.push(`Inclui ${matched.slice(0, 2).join(" e ")}`);
    }
  }

  if (intent.orcamentoMaximo && budgetScore === 1) {
    reasons.push(`Dentro de R$ ${intent.orcamentoMaximo}/hora`);
  }

  return reasons.slice(0, 3);
};

const scoreSpace = (space: Space, intent: ChatIntent): ScoredRecommendation => {
  const capacityScore = intent.quantidadePessoas
    ? getCapacityScore(intent.quantidadePessoas, space.capacity)
    : 0.65;
  const semanticScore = getSemanticScore(space, intent);
  const locationScore = getLocationScore(space, intent);
  const resourceScore = getResourceScore(space, intent);
  const budgetScore = getBudgetScore(space, intent.orcamentoMaximo);

  const overall =
    capacityScore * 0.48 +
    semanticScore * 0.24 +
    locationScore * 0.16 +
    resourceScore * 0.08 +
    budgetScore * 0.04;
  const score = Math.round(overall * 100);

  return {
    score,
    semanticScore,
    resourceScore,
    recommendation: {
      ...space,
      matchPercent: score,
      matchPercentage: score,
      reasons: buildReasons(space, intent, semanticScore, resourceScore, budgetScore),
    },
  };
};

const buildExactReply = (intent: ChatIntent, recommendations: ChatRecommendation[]) => {
  const lead = recommendations[0];
  const scope: string[] = [];

  if (intent.cidadeIncluida && !isBaseCity(intent.cidadeIncluida)) {
    scope.push(`na regiao de ${intent.cidadeIncluida}`);
  }
  if (intent.cidadesExcluidas.length > 0) {
    scope.push(`evitando ${intent.cidadesExcluidas.join(", ")}`);
  }

  const summary = scope.length > 0 ? `Encontrei opcoes coerentes ${scope.join(" e ")}. ` : "";
  return `${summary}A primeira sugestao e ${lead.name}, e deixei outras alternativas reais para voce comparar.`;
};

const buildNoExactMatchReply = (intent: ChatIntent, recommendations: ChatRecommendation[]) => {
  const requestedCapacity = intent.quantidadePessoas
    ? `${intent.quantidadePessoas} pessoas`
    : "o que voce pediu";

  if (recommendations.length === 0) {
    return `Nao encontrei nenhum espaco viavel para ${requestedCapacity} na base atual.`;
  }

  return "Nao encontrei um espaco que atenda perfeitamente ao que voce pediu. Vou te mostrar as alternativas reais mais proximas disponiveis agora.";
};

const filterAllowedSpaces = (spaces: Space[], intent: ChatIntent) =>
  spaces.filter((space) => {
    const location = normalizeText(space.location);
    return !intent.cidadesExcluidas.some((city) =>
      location.includes(normalizeText(city)),
    );
  });

const rankAlternativeSpaces = (spaces: Space[], intent: ChatIntent) =>
  spaces
    .map((space) => {
      const scored = scoreSpace(space, intent);
      return {
        ...scored,
        capacityGap: Math.max(0, (intent.quantidadePessoas ?? 0) - space.capacity),
      };
    })
    .sort((left, right) => {
      if (right.recommendation.capacity !== left.recommendation.capacity) {
        return right.recommendation.capacity - left.recommendation.capacity;
      }
      if (right.semanticScore !== left.semanticScore) {
        return right.semanticScore - left.semanticScore;
      }
      if (left.capacityGap !== right.capacityGap) {
        return left.capacityGap - right.capacityGap;
      }
      return left.recommendation.pricePerHour - right.recommendation.pricePerHour;
    })
    .slice(0, 3)
    .map((item) => item.recommendation);

export const rankRecommendations = (
  spaces: Space[],
  intent: ChatIntent,
): RecommendationResult => {
  const allowedSpaces = filterAllowedSpaces(spaces, intent);
  const exactMatches = allowedSpaces
    .map((space) => scoreSpace(space, intent))
    .filter((item) => item.score >= QUALITY_THRESHOLD)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.recommendation.pricePerHour - right.recommendation.pricePerHour;
    })
    .slice(0, 3)
    .map((item) => item.recommendation);

  if (exactMatches.length > 0) {
    return {
      matchMode: "exact",
      recommendations: exactMatches,
      reply: buildExactReply(intent, exactMatches),
    };
  }

  const alternatives = rankAlternativeSpaces(allowedSpaces, intent);
  return {
    matchMode: "no_exact_match",
    recommendations: alternatives,
    reply: buildNoExactMatchReply(intent, alternatives),
  };
};
