import type { AiDecision, ChatIntent, QuestionField } from "./types";
import { canonicalizeLocation, emptyIntent, mergeIntent } from "./intent";
import { cityMatchers, isBaseCity, normalizeText, resourceMatchers, unique } from "./shared";

interface LocalParseOptions {
  previousAskedField?: QuestionField;
}

export const parseLocalIntent = (
  message: string,
  options: LocalParseOptions = {},
): Partial<ChatIntent> => {
  const normalized = normalizeText(message);
  const intent = emptyIntent();
  const fallbackNumberMatch =
    normalized.match(/(?:umas?|uns?|cerca de|por volta de|aproximadamente)\s*(\d{1,4})/) ??
    normalized.match(/\b(\d{1,4})\b/);

  const capacityMatch =
    normalized.match(/(\d{1,4})\s*(pessoas|participantes|lugares|convidados)/) ??
    normalized.match(/para\s*(\d{1,4})/) ??
    normalized.match(/(?:mais\s+(?:de|do\s+que)|acima\s+de|pelo\s+menos|minimo\s+de)\s*(\d{1,4})/);
  const budgetMatch =
    normalized.match(/(?:ate|maximo|max|orcamento|r\$)\s*(?:r\$)?\s*(\d{2,5})/) ??
    normalized.match(/(\d{2,5})\s*(reais|por hora|\/hora)/);

  if (capacityMatch) {
    intent.quantidadePessoas = Number(capacityMatch[1]);
  } else if (options.previousAskedField === "capacity" && fallbackNumberMatch) {
    intent.quantidadePessoas = Number(fallbackNumberMatch[1]);
  }

  if (budgetMatch) {
    intent.orcamentoMaximo = Number(budgetMatch[1]);
  } else if (options.previousAskedField === "budget" && fallbackNumberMatch) {
    intent.orcamentoMaximo = Number(fallbackNumberMatch[1]);
  }

  for (const city of cityMatchers) {
    if (city.aliases.some((alias) => normalized.includes(normalizeText(alias)))) {
      if (isBaseCity(city.label)) {
        continue;
      }

      if (/(nao quero|nao pode|evita|exceto|menos|fora|sem ser)/.test(normalized)) {
        intent.cidadesExcluidas.push(city.label);
      } else {
        intent.cidade = canonicalizeLocation(city.label);
        intent.cidadeIncluida = canonicalizeLocation(city.label);
        intent.locations = unique([city.label, ...intent.locations]);
      }
    }
  }

  for (const matcher of resourceMatchers) {
    if (matcher.pattern.test(message)) {
      intent.recursosDesejados.push(matcher.resource);
    }
  }

  if (/audit[oó]rio|auditorio/i.test(message)) {
    intent.tipoEspaco = "Auditório";
  }

  if (
    /palestra|apresenta(c|ç)(a|ã)o|evento corporativo|aula|treinamento|workshop|seminario/i.test(
      message,
    )
  ) {
    intent.tipoEvento = message.trim();
  } else if (/reuni[aã]o|encontro|board/i.test(message)) {
    intent.tipoEvento = "Reunião";
  } else if (/odont|consult[oó]rio|consulta|clinica/i.test(message)) {
    intent.tipoEspaco = "Consultório";
    intent.tipoEvento = "Consulta";
  }

  return intent;
};

export const buildFallbackDecision = (
  message: string,
  currentIntent: ChatIntent,
  previousAskedField?: QuestionField,
): AiDecision => {
  const fallbackIntent = mergeIntent(
    currentIntent,
    parseLocalIntent(message, { previousAskedField }),
  );
  const missingFields: string[] = [];

  if (!fallbackIntent.tipoEspaco && !fallbackIntent.tipoEvento) {
    missingFields.push("tipoEspaco");
  } else if (!fallbackIntent.quantidadePessoas) {
    missingFields.push("quantidadePessoas");
  }

  return {
    reply:
      "Tive uma instabilidade agora, mas posso continuar te ajudando se voce me disser o tipo de espaco, quantidade de pessoas, bairro ou orcamento.",
    intent: "unknown",
    action: "ask_followup",
    extracted: {
      tipoEspaco: fallbackIntent.tipoEspaco ?? null,
      tipoEvento: fallbackIntent.tipoEvento ?? null,
      cidade: fallbackIntent.cidadeIncluida ?? null,
      locations: fallbackIntent.locations,
      excludedLocations: fallbackIntent.cidadesExcluidas,
      quantidadePessoas: fallbackIntent.quantidadePessoas ?? null,
      recursosDesejados: fallbackIntent.recursosDesejados,
      orcamentoMaximo: fallbackIntent.orcamentoMaximo ?? null,
    },
    missingFields,
    confidence: 0,
  };
};
