import type { StructuredExtracted, ChatIntent, AiDecision, QuestionField } from "./types";
import { cityMatchers, isBaseCity, normalizeText, unique } from "./shared";

const parseNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const parsed = Number(value.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const sanitizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? unique(
        value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim()),
      )
    : [];

const sanitizeLocationArray = (value: unknown) =>
  sanitizeStringArray(value)
    .map(canonicalizeLocation)
    .filter((item) => !isBaseCity(item));

export const canonicalizeLocation = (value: string) => {
  const normalized = normalizeText(value);
  const found = cityMatchers.find((city) =>
    city.aliases.some((alias) => normalized.includes(normalizeText(alias))),
  );

  return found?.label ?? value.trim();
};

const toRegionPreference = (value?: string | null) => {
  if (!value?.trim()) return undefined;
  const canonical = canonicalizeLocation(value);
  return isBaseCity(canonical) ? undefined : canonical;
};

export const emptyIntent = (): ChatIntent => ({
  locations: [],
  recursosDesejados: [],
  cidadesExcluidas: [],
});

export const sanitizeIntent = (value: unknown): ChatIntent | null => {
  if (!value || typeof value !== "object") return null;

  const input = value as Partial<ChatIntent>;
  const cidade =
    toRegionPreference(input.cidadeIncluida) ?? toRegionPreference(input.cidade);
  const locations = sanitizeLocationArray(input.locations);

  return {
    tipoEspaco:
      typeof input.tipoEspaco === "string" && input.tipoEspaco.trim()
        ? input.tipoEspaco.trim()
        : undefined,
    tipoEvento:
      typeof input.tipoEvento === "string" && input.tipoEvento.trim()
        ? input.tipoEvento.trim()
        : undefined,
    cidade,
    cidadeIncluida: cidade,
    locations: unique([...(cidade ? [cidade] : []), ...locations]),
    quantidadePessoas: parseNumber(input.quantidadePessoas),
    recursosDesejados: sanitizeStringArray(input.recursosDesejados),
    orcamentoMaximo: parseNumber(input.orcamentoMaximo),
    cidadesExcluidas: sanitizeLocationArray(input.cidadesExcluidas).filter(
      (item) => normalizeText(item) !== normalizeText(cidade ?? ""),
    ),
  };
};

export const sanitizeAiDecision = (value: unknown): AiDecision | null => {
  if (!value || typeof value !== "object") return null;

  const input = value as Partial<AiDecision>;
  const extracted = input.extracted as Partial<StructuredExtracted> | undefined;
  if (!extracted || typeof extracted !== "object") return null;

  const intents: AiDecision["intent"][] = [
    "casual",
    "search",
    "clarification",
    "cancel",
    "thanks",
    "unknown",
  ];
  const actions: AiDecision["action"][] = [
    "reply_only",
    "ask_followup",
    "recommend",
    "no_exact_match",
  ];

  return {
    reply:
      typeof input.reply === "string" && input.reply.trim() ? input.reply.trim() : "Entendi.",
    intent: intents.includes(input.intent as AiDecision["intent"])
      ? (input.intent as AiDecision["intent"])
      : "unknown",
    action: actions.includes(input.action as AiDecision["action"])
      ? (input.action as AiDecision["action"])
      : "reply_only",
    extracted: {
      tipoEspaco:
        typeof extracted.tipoEspaco === "string" && extracted.tipoEspaco.trim()
          ? extracted.tipoEspaco.trim()
          : null,
      tipoEvento:
        typeof extracted.tipoEvento === "string" && extracted.tipoEvento.trim()
          ? extracted.tipoEvento.trim()
          : null,
      cidade:
        typeof extracted.cidade === "string" && extracted.cidade.trim()
          ? toRegionPreference(extracted.cidade) ?? null
          : null,
      locations: sanitizeLocationArray(extracted.locations),
      excludedLocations: sanitizeLocationArray(extracted.excludedLocations),
      quantidadePessoas: parseNumber(extracted.quantidadePessoas) ?? null,
      recursosDesejados: sanitizeStringArray(extracted.recursosDesejados),
      orcamentoMaximo: parseNumber(extracted.orcamentoMaximo) ?? null,
    },
    missingFields: sanitizeStringArray(input.missingFields).map((field) => field.trim()),
    confidence:
      typeof input.confidence === "number" && Number.isFinite(input.confidence)
        ? Math.max(0, Math.min(1, input.confidence))
        : 0,
  };
};

export const extractedToIntent = (extracted: StructuredExtracted): Partial<ChatIntent> => {
  const cidade = toRegionPreference(extracted.cidade);
  const locations = unique([
    ...(cidade ? [cidade] : []),
    ...extracted.locations.map(canonicalizeLocation),
  ]).filter((item) => !isBaseCity(item));

  return {
    tipoEspaco: extracted.tipoEspaco ?? undefined,
    tipoEvento: extracted.tipoEvento ?? extracted.tipoEspaco ?? undefined,
    cidade,
    cidadeIncluida: cidade,
    locations,
    quantidadePessoas: extracted.quantidadePessoas ?? undefined,
    recursosDesejados: extracted.recursosDesejados,
    orcamentoMaximo: extracted.orcamentoMaximo ?? undefined,
    cidadesExcluidas: unique(extracted.excludedLocations.map(canonicalizeLocation)).filter(
      (item) => normalizeText(item) !== normalizeText(cidade ?? ""),
    ),
  };
};

export const mergeIntent = (base: ChatIntent, patch?: Partial<ChatIntent> | null): ChatIntent => {
  if (!patch) return base;

  const patchLocations = (patch.locations ?? [])
    .map(canonicalizeLocation)
    .filter((item) => !isBaseCity(item));
  const nextCidade =
    toRegionPreference(patch.cidadeIncluida) ??
    toRegionPreference(patch.cidade) ??
    patchLocations[0];
  const hasNewLocation = Boolean(nextCidade || patchLocations.length > 0);
  const cidade = nextCidade ?? base.cidadeIncluida ?? base.cidade;
  const nextLocations = hasNewLocation
    ? unique([...(cidade ? [cidade] : []), ...patchLocations])
    : base.locations;

  return {
    tipoEspaco: patch.tipoEspaco ?? base.tipoEspaco,
    tipoEvento: patch.tipoEvento ?? base.tipoEvento,
    cidade,
    cidadeIncluida: cidade,
    locations: nextLocations,
    quantidadePessoas: patch.quantidadePessoas ?? base.quantidadePessoas,
    recursosDesejados:
      patch.recursosDesejados && patch.recursosDesejados.length > 0
        ? unique(patch.recursosDesejados)
        : base.recursosDesejados,
    orcamentoMaximo: patch.orcamentoMaximo ?? base.orcamentoMaximo,
    cidadesExcluidas: unique([
      ...base.cidadesExcluidas,
      ...(patch.cidadesExcluidas ?? []),
    ]).filter((item) => normalizeText(item) !== normalizeText(cidade ?? "")),
  };
};

const askFieldMap: Record<string, QuestionField> = {
  tipoespaco: "spaceType",
  tipoevento: "spaceType",
  cidade: "location",
  cidadeincluida: "location",
  locations: "location",
  localizacao: "location",
  regiao: "location",
  bairro: "location",
  quantidadedepessoas: "capacity",
  quantidadepessoas: "capacity",
  pessoas: "capacity",
  capacidade: "capacity",
  orcamentomaximo: "budget",
  orcamento: "budget",
};

export const getAskedField = (
  decision: AiDecision,
  intent: ChatIntent,
): QuestionField => {
  for (const missingField of decision.missingFields) {
    const key = normalizeText(missingField).replace(/\s+/g, "");
    const mapped = askFieldMap[key];
    if (mapped) return mapped;
  }

  if (!intent.tipoEspaco && !intent.tipoEvento) return "spaceType";
  if (!intent.quantidadePessoas) return "capacity";
  if (!intent.orcamentoMaximo) return "budget";
  return "refinement";
};
