import { env } from "node:process";
import { NextResponse } from "next/server";
import { spaceCatalog } from "@/lib/data/spaceCatalog";
import type { Space, SpaceCategory } from "@/lib/data/contracts";

type ChatMode = "ask" | "recommend";
type ConversationIntent =
  | "conversation"
  | "search"
  | "clarification"
  | "cancel"
  | "unknown";

interface ChatIntent {
  tipoEspaco?: string;
  tipoEvento?: string;
  cidade?: string;
  cidadeIncluida?: string;
  locations: string[];
  quantidadePessoas?: number;
  recursosDesejados: string[];
  orcamentoMaximo?: number;
  cidadesExcluidas: string[];
  recursosExcluidos: string[];
}

interface ChatRecommendation extends Space {
  matchPercent: number;
  reasons: string[];
}

interface ChatResponse {
  mode: ChatMode;
  reply: string;
  conversationalIntent: ConversationIntent;
  shouldRecommend: boolean;
  intent: ChatIntent;
  conversationSummary: string;
  recommendations: ChatRecommendation[];
  followUpActions: string[];
  askedField?: QuestionField;
}

interface StructuredExtracted {
  tipoEspaco: string | null;
  tipoEvento: string | null;
  cidade: string | null;
  locations: string[];
  excludedLocations: string[];
  quantidadePessoas: number | null;
  recursosDesejados: string[];
  orcamentoMaximo: number | null;
}

interface ModelChatResult {
  reply: string;
  intent: ConversationIntent;
  shouldRecommend: boolean;
  extracted: StructuredExtracted;
}

type ModelFailureReason = "quota" | "unauthorized" | "unavailable";

type QuestionField = "spaceType" | "location" | "budget" | "capacity" | "refinement";

const GROQ_MODEL = "openai/gpt-oss-20b";
const MODEL_TIMEOUT_MS = 5000;
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const MODEL_COOLDOWN_MS = 2 * 60 * 1000;

const modelCache = new Map<string, { expiresAt: number; result: ModelChatResult | null }>();
let modelCooldownUntil = 0;

const cityMatchers = [
  { label: "Jardim Renascença", aliases: ["jardim renascença", "jardim renascenca"] },
  { label: "Renascença II", aliases: ["renascença ii", "renascenca ii"] },
  { label: "Renascença", aliases: ["renascença", "renascenca"] },
  { label: "Quintas do Calhau", aliases: ["quintas do calhau"] },
  { label: "Calhau", aliases: ["calhau"] },
  {
    label: "Ponta d'Areia",
    aliases: ["ponta d'areia", "ponta dareia", "ponta da areia"],
  },
  { label: "Ponta do Farol", aliases: ["ponta do farol"] },
  { label: "São Francisco", aliases: ["são francisco", "sao francisco"] },
  { label: "Cohama", aliases: ["cohama"] },
  { label: "São Luís", aliases: ["são luís", "sao luis"] },
] as const;

const resourceMatchers = [
  { resource: "Wi-Fi", pattern: /wi[\s-]?fi|internet/i },
  { resource: "Ar Condicionado", pattern: /ar condicionado|climatiza/i },
  { resource: "Projetor", pattern: /projetor|apresenta(c|ç)(a|ã)o|tela/i },
  { resource: "Videoconferência", pattern: /videoconfer|videochamada|hibrid|híbrido/i },
  { resource: "Café", pattern: /caf[eé]|coffee break|agua e cafe|água e café/i },
  { resource: "Acessibilidade", pattern: /acessib/i },
  { resource: "Estacionamento", pattern: /estacionamento|vaga/i },
];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase();

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const canonicalizeLocation = (value: string) => {
  const normalized = normalizeText(value);
  const found = cityMatchers.find((city) =>
    city.aliases.some((alias) => normalized.includes(normalizeText(alias))),
  );

  return found?.label ?? value;
};

const emptyIntent = (): ChatIntent => ({
  locations: [],
  recursosDesejados: [],
  cidadesExcluidas: [],
  recursosExcluidos: [],
});

const parseNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const parsed = Number(value.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const inferCategory = (
  tipoEvento?: string,
  quantidadePessoas?: number,
): SpaceCategory | undefined => {
  if (!tipoEvento) return undefined;

  const normalized = normalizeText(tipoEvento);

  if (
    normalized.includes("odont") ||
    normalized.includes("consultorio") ||
    normalized.includes("consulta")
  ) {
    return "dental";
  }

  if (
    normalized.includes("auditorio") ||
    normalized.includes("palestra") ||
    normalized.includes("conferencia") ||
    normalized.includes("evento") ||
    normalized.includes("lancamento")
  ) {
    return quantidadePessoas && quantidadePessoas <= 24 ? "meeting" : "auditorium";
  }

  if (
    normalized.includes("reuniao") ||
    normalized.includes("sala") ||
    normalized.includes("workshop") ||
    normalized.includes("treinamento") ||
    normalized.includes("coworking")
  ) {
    return quantidadePessoas && quantidadePessoas > 35 ? "auditorium" : "meeting";
  }

  return undefined;
};

const sanitizeIntent = (value: unknown): ChatIntent | null => {
  if (!value || typeof value !== "object") return null;

  const input = value as Partial<ChatIntent>;
  const locations = Array.isArray(input.locations)
    ? input.locations
        .filter((item): item is string => typeof item === "string")
        .map(canonicalizeLocation)
    : [];
  const recursosDesejados = Array.isArray(input.recursosDesejados)
    ? input.recursosDesejados.filter((item): item is string => typeof item === "string")
    : [];
  const cidadesExcluidas = Array.isArray(input.cidadesExcluidas)
    ? input.cidadesExcluidas.filter((item): item is string => typeof item === "string")
    : [];
  const recursosExcluidos = Array.isArray(input.recursosExcluidos)
    ? input.recursosExcluidos.filter((item): item is string => typeof item === "string")
    : [];

  const cidade =
    typeof input.cidadeIncluida === "string"
      ? canonicalizeLocation(input.cidadeIncluida)
      : typeof input.cidade === "string"
        ? canonicalizeLocation(input.cidade)
        : locations[0]
          ? locations[0]
        : undefined;

  return {
    tipoEspaco: typeof input.tipoEspaco === "string" ? input.tipoEspaco : undefined,
    tipoEvento: typeof input.tipoEvento === "string" ? input.tipoEvento : undefined,
    cidade,
    cidadeIncluida: cidade,
    locations: unique([...(cidade ? [cidade] : []), ...locations]),
    quantidadePessoas: parseNumber(input.quantidadePessoas),
    recursosDesejados: unique(recursosDesejados),
    orcamentoMaximo: parseNumber(input.orcamentoMaximo),
    cidadesExcluidas: unique(cidadesExcluidas),
    recursosExcluidos: unique(recursosExcluidos),
  };
};

const mergeIntent = (base: ChatIntent, patch?: Partial<ChatIntent> | null): ChatIntent => {
  if (!patch) return base;

  const cidade = patch.cidadeIncluida ?? patch.cidade ?? base.cidadeIncluida ?? base.cidade;
  const patchLocations = patch.locations ?? [];

  return {
    tipoEspaco: patch.tipoEspaco ?? base.tipoEspaco,
    tipoEvento: patch.tipoEvento ?? base.tipoEvento,
    cidade,
    cidadeIncluida: cidade,
    locations: unique([...(cidade ? [cidade] : []), ...base.locations, ...patchLocations]),
    quantidadePessoas: patch.quantidadePessoas ?? base.quantidadePessoas,
    recursosDesejados: unique([
      ...base.recursosDesejados,
      ...(patch.recursosDesejados ?? []),
    ]),
    orcamentoMaximo: patch.orcamentoMaximo ?? base.orcamentoMaximo,
    cidadesExcluidas: unique([
      ...base.cidadesExcluidas,
      ...(patch.cidadesExcluidas ?? []),
    ]).filter((item) => normalizeText(item) !== normalizeText(cidade ?? "")),
    recursosExcluidos: unique([
      ...base.recursosExcluidos,
      ...(patch.recursosExcluidos ?? []),
    ]),
  };
};

const extractJsonObject = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

const parseLocalIntent = (message: string): ChatIntent => {
  const normalized = normalizeText(message);
  const intent = emptyIntent();

  const capacidadeMatch =
    normalized.match(/(\d{1,4})\s*(pessoas|participantes|lugares|convidados)/) ??
    normalized.match(/para\s*(\d{1,4})/);
  const orcamentoMatch =
    normalized.match(/(?:ate|maximo|max|orcamento|r\$)\s*(?:r\$)?\s*(\d{2,5})/) ??
    normalized.match(/(\d{2,5})\s*(reais|por hora|\/hora)/);

  if (capacidadeMatch) {
    intent.quantidadePessoas = Number(capacidadeMatch[1]);
  }

  if (orcamentoMatch) {
    intent.orcamentoMaximo = Number(orcamentoMatch[1]);
  }

  for (const city of cityMatchers) {
    for (const alias of city.aliases) {
      const cityPattern = escapeRegex(normalizeText(alias));
      const excludedPattern = new RegExp(
        `(nao seja|nao quero|nao pode|evita|evitando|exceto|menos|fora|sem ser)(?:\\s+(?:em|no|na))?\\s+${cityPattern}`,
      );
      const includedPattern = new RegExp(
        `(?:em|no|na|para|perto de)\\s+${cityPattern}`,
      );

      if (excludedPattern.test(normalized)) {
        intent.cidadesExcluidas.push(city.label);
        continue;
      }

      if (includedPattern.test(normalized) || normalized.includes(cityPattern)) {
        intent.cidade = city.label;
        intent.cidadeIncluida = city.label;
        intent.locations = unique([city.label, ...intent.locations]);
      }
    }
  }

  for (const matcher of resourceMatchers) {
    const normalizedResource = normalizeText(matcher.resource);
    const excludedPattern = new RegExp(
      `(sem|nao precisa de|nao quero|sem precisar de)\\s+${escapeRegex(normalizedResource)}`,
    );

    if (excludedPattern.test(normalized)) {
      intent.recursosExcluidos.push(matcher.resource);
      continue;
    }

    if (matcher.pattern.test(message)) {
      intent.recursosDesejados.push(matcher.resource);
    }
  }

  if (/reuniao|reuni[aã]o|sala|coworking|videoconfer/i.test(message)) {
    intent.tipoEvento = "Reunião";
  } else if (/treinamento|workshop/i.test(message)) {
    intent.tipoEvento = "Treinamento";
  } else if (/odont|consult[oó]rio|consulta/i.test(message)) {
    intent.tipoEvento = "Consultório odontológico";
  } else if (
    /\bauditorio\b|\baudit[oó]rio\b|\bpalestra\b|\bconferencia\b|\bconfer[eê]ncia\b|\bevento\b/i.test(
      message,
    )
  ) {
    intent.tipoEvento = "Evento corporativo";
  }

  intent.recursosDesejados = unique(intent.recursosDesejados).filter(
    (item) =>
      !intent.recursosExcluidos.some(
        (excluded) => normalizeText(excluded) === normalizeText(item),
      ),
  );
  intent.recursosExcluidos = unique(intent.recursosExcluidos);
  intent.cidadesExcluidas = unique(intent.cidadesExcluidas).filter(
    (item) => normalizeText(item) !== normalizeText(intent.cidadeIncluida ?? ""),
  );

  return intent;
};

const sanitizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? unique(value.filter((item): item is string => typeof item === "string"))
    : [];

const sanitizeLocationArray = (value: unknown) =>
  sanitizeStringArray(value).map(canonicalizeLocation);

const sanitizeModelResult = (value: unknown): ModelChatResult | null => {
  if (!value || typeof value !== "object") return null;

  const input = value as Partial<ModelChatResult>;
  const extracted = input.extracted as Partial<StructuredExtracted> | undefined;
  if (!extracted || typeof extracted !== "object") return null;

  const allowedIntents: ConversationIntent[] = [
    "conversation",
    "search",
    "clarification",
    "cancel",
    "unknown",
  ];
  const intent = allowedIntents.includes(input.intent as ConversationIntent)
    ? (input.intent as ConversationIntent)
    : "unknown";

  return {
    reply:
      typeof input.reply === "string" && input.reply.trim()
        ? input.reply.trim()
        : "Entendi. Me conta um pouco mais para eu te ajudar melhor.",
    intent,
    shouldRecommend: Boolean(input.shouldRecommend),
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
          ? extracted.cidade.trim()
          : null,
      locations: sanitizeLocationArray(extracted.locations),
      excludedLocations: sanitizeLocationArray(extracted.excludedLocations),
      quantidadePessoas: parseNumber(extracted.quantidadePessoas) ?? null,
      recursosDesejados: sanitizeStringArray(extracted.recursosDesejados),
      orcamentoMaximo: parseNumber(extracted.orcamentoMaximo) ?? null,
    },
  };
};

const extractedToIntent = (extracted: StructuredExtracted): ChatIntent => {
  const extractedCidade = extracted.cidade
    ? canonicalizeLocation(extracted.cidade)
    : null;
  const locations = unique([
    ...(extractedCidade ? [extractedCidade] : []),
    ...extracted.locations.map(canonicalizeLocation),
  ]);
  const cidade = extractedCidade ?? locations[0];

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
    recursosExcluidos: [],
  };
};

const countRecommendationSignals = (intent: ChatIntent) => {
  let count = 0;

  if (intent.tipoEspaco || intent.tipoEvento) count += 1;
  if (intent.quantidadePessoas) count += 1;
  if (intent.cidadeIncluida || intent.locations.length > 0) count += 1;
  if (intent.cidadesExcluidas.length > 0) count += 1;
  if (intent.recursosDesejados.length > 0) count += 1;
  if (intent.orcamentoMaximo) count += 1;

  return count;
};

const hasMinimumRecommendationData = (intent: ChatIntent) =>
  Boolean(intent.tipoEspaco || intent.tipoEvento) && countRecommendationSignals(intent) >= 2;

const getAskedField = (intent: ChatIntent): QuestionField | undefined => {
  if (!intent.tipoEspaco && !intent.tipoEvento) return "spaceType";
  if (!intent.quantidadePessoas) return "capacity";
  if (!intent.cidadeIncluida && intent.locations.length === 0) return "location";
  if (!intent.orcamentoMaximo) return "budget";
  return undefined;
};

const buildModelPrompt = (
  message: string,
  conversationSummary: string,
  currentIntent: ChatIntent,
) => `
Você é o assistente do SP Spaces, uma plataforma para encontrar espaços corporativos reais da base local.

Converse em português do Brasil de forma natural, consultiva, educada e breve.
Você é o motor conversacional: entenda cumprimentos, recusas, dúvidas, mudanças de ideia e pedidos casuais naturalmente.
Não force recomendação se o usuário não estiver procurando espaço.
Se o usuário recusar, agradecer, conversar casualmente ou cancelar, responda naturalmente e deixe shouldRecommend como false.
Extraia dados úteis para recomendação e considere que novas informações complementam ou atualizam o contexto anterior.
Se o usuário mudar de ideia, atualize os dados extraídos para refletir a preferência mais recente.
Nunca invente espaços, nomes, preços, disponibilidade ou detalhes fora da base local.
Se o usuário pedir espaço, colete informações suficientes de forma natural.
Se já houver informações suficientes para o sistema local calcular recomendações, marque shouldRecommend como true.
Responda somente com JSON válido, sem markdown, sem texto fora do objeto.

Use exatamente este formato:
{
  "reply": "resposta natural em português",
  "intent": "conversation | search | clarification | cancel | unknown",
  "shouldRecommend": false,
  "extracted": {
    "tipoEspaco": null,
    "tipoEvento": null,
    "cidade": null,
    "locations": [],
    "excludedLocations": [],
    "quantidadePessoas": null,
    "recursosDesejados": [],
    "orcamentoMaximo": null
  }
}

Contexto resumido da conversa:
${conversationSummary || "Ainda sem contexto anterior."}

Dados já conhecidos pelo sistema local:
${JSON.stringify(currentIntent)}

Mensagem atual do usuario:
${message}
`;

const chatWithModel = async (
  message: string,
  conversationSummary: string,
  currentIntent: ChatIntent,
): Promise<{ result: ModelChatResult | null; failureReason?: ModelFailureReason }> => {
  if (!env.GROQ_API_KEY || Date.now() < modelCooldownUntil) {
    return { result: null, failureReason: "unavailable" };
  }

  const cacheKey = normalizeText(
    JSON.stringify({ message, conversationSummary, currentIntent }),
  );
  const cached = modelCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return { result: cached.result };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.2,
          reasoning_effort: "low",
          max_completion_tokens: 700,
          messages: [
            {
              role: "system",
              content:
                "Responda somente com JSON valido no schema exigido. Nao use markdown.",
            },
            {
              role: "user",
              content: buildModelPrompt(message, conversationSummary, currentIntent),
            },
          ],
          response_format: {
            type: "json_object",
          },
        }),
        signal: controller.signal,
      },
    );

    if (response.status === 429) {
      modelCooldownUntil = Date.now() + MODEL_COOLDOWN_MS;
      modelCache.set(cacheKey, {
        expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
        result: null,
      });
      return { result: null, failureReason: "quota" };
    }

    if (response.status === 401 || response.status === 403) {
      return { result: null, failureReason: "unauthorized" };
    }

    if (!response.ok) return { result: null, failureReason: "unavailable" };

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      return { result: null, failureReason: "unavailable" };
    }

    const parsed = sanitizeModelResult(extractJsonObject(text));

    modelCache.set(cacheKey, {
      expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
      result: parsed,
    });

    return { result: parsed };
  } catch {
    return { result: null, failureReason: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
};

const buildFallbackModelResult = (
  message: string,
  currentIntent: ChatIntent,
  failureReason?: ModelFailureReason,
): ModelChatResult => {
  const fallbackIntent = mergeIntent(currentIntent, parseLocalIntent(message));
  const shouldRecommend = hasMinimumRecommendationData(fallbackIntent);
  const unavailableReply =
    failureReason === "quota"
      ? "A IA do chat está temporariamente indisponível porque a cota da Groq dessa conta foi excedida. Posso continuar com o modo local se você me disser o tipo de espaço, bairro e quantidade de pessoas."
      : failureReason === "unauthorized"
        ? "A IA do chat não está autorizada no momento. Posso continuar com o modo local se você me disser o tipo de espaço, bairro e quantidade de pessoas."
        : "Estou com uma limitação para consultar a IA agora. Posso continuar se você me disser o tipo de espaço, bairro e quantidade de pessoas.";

  return {
    reply: shouldRecommend
      ? "Consigo seguir com uma recomendação usando os dados que entendi."
      : unavailableReply,
    intent: shouldRecommend ? "search" : "unknown",
    shouldRecommend,
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
  };
};

const resourceMatches = (spaceResource: string, desired: string) =>
  normalizeText(spaceResource).includes(normalizeText(desired)) ||
  normalizeText(desired).includes(normalizeText(spaceResource));

const scoreSpace = (space: Space, intent: ChatIntent) => {
  let score = 35;
  const reasons: string[] = [];
  const category = inferCategory(
    intent.tipoEvento ?? intent.tipoEspaco,
    intent.quantidadePessoas,
  );
  const normalizedLocation = normalizeText(space.location);

  if (intent.cidadeIncluida) {
    if (normalizedLocation.includes(normalizeText(intent.cidadeIncluida))) {
      score += 24;
      reasons.push(`Fica em ${intent.cidadeIncluida}`);
    } else {
      score -= 24;
    }
  }

  if (category && space.category === category) {
    score += 18;
    reasons.push("Tipo de espaço compatível");
  }

  if (intent.quantidadePessoas) {
    if (space.capacity >= intent.quantidadePessoas) {
      score += 20;
      reasons.push(`Atende até ${space.capacity} pessoas`);
    } else {
      score -= 40 + Math.min(20, intent.quantidadePessoas - space.capacity);
    }
  }

  if (intent.recursosDesejados.length > 0) {
    const matched = intent.recursosDesejados.filter((desired) =>
      space.resources.some((resource) => resourceMatches(resource, desired)),
    );
    const missing = intent.recursosDesejados.length - matched.length;

    score += matched.length * 8;
    score -= missing * 6;

    if (matched.length > 0) {
      reasons.push(`Inclui ${matched.slice(0, 2).join(" e ")}`);
    }
  }

  if (intent.recursosExcluidos.length > 0) {
    const forbidden = intent.recursosExcluidos.filter((excluded) =>
      space.resources.some((resource) => resourceMatches(resource, excluded)),
    );

    if (forbidden.length > 0) {
      score -= 18;
    }
  }

  if (intent.orcamentoMaximo) {
    if (space.pricePerHour <= intent.orcamentoMaximo) {
      score += 16;
      reasons.push(`Dentro do orçamento de R$ ${intent.orcamentoMaximo}/hora`);
    } else {
      score -= Math.min(24, Math.round((space.pricePerHour - intent.orcamentoMaximo) / 10));
    }
  }

  if (space.recommended) score += 4;

  return {
    space,
    matchPercent: Math.max(45, Math.min(98, Math.round(score))),
    reasons: reasons.length > 0 ? reasons.slice(0, 3) : ["Boa opção da base local"],
  };
};

const matchSpaces = (spaces: Space[], intent: ChatIntent): ChatRecommendation[] =>
  spaces
    .filter((space) => {
      const normalizedLocation = normalizeText(space.location);

      if (
        intent.cidadesExcluidas.some((city) =>
          normalizedLocation.includes(normalizeText(city)),
        )
      ) {
        return false;
      }

      if (
        intent.cidadeIncluida &&
        !normalizedLocation.includes(normalizeText(intent.cidadeIncluida))
      ) {
        return false;
      }

      return true;
    })
    .map((space) => scoreSpace(space, intent))
    .sort((left, right) => {
      if (right.matchPercent !== left.matchPercent) {
        return right.matchPercent - left.matchPercent;
      }

      return left.space.pricePerHour - right.space.pricePerHour;
    })
    .slice(0, 3)
    .map(({ space, matchPercent, reasons }) => ({
      ...space,
      matchPercent,
      matchPercentage: matchPercent,
      reasons,
    }));

const buildRecommendReply = (
  intent: ChatIntent,
  recommendations: ChatRecommendation[],
) => {
  if (recommendations.length === 0) {
    return "Não encontrei boas opções com esse recorte. Se quiser, eu tento de novo com outro bairro, orçamento ou capacidade.";
  }

  const parts: string[] = [];

  if (intent.tipoEvento) {
    parts.push(`uma busca para ${intent.tipoEvento.toLowerCase()}`);
  } else if (intent.tipoEspaco) {
    parts.push(`uma busca para ${intent.tipoEspaco.toLowerCase()}`);
  }
  if (intent.quantidadePessoas) {
    parts.push(`cerca de ${intent.quantidadePessoas} pessoas`);
  }
  if (intent.cidadeIncluida) {
    parts.push(`na região de ${intent.cidadeIncluida}`);
  }
  if (intent.cidadesExcluidas.length > 0) {
    parts.push(`evitando ${intent.cidadesExcluidas.join(", ")}`);
  }
  if (intent.orcamentoMaximo) {
    parts.push(`até R$ ${intent.orcamentoMaximo}/hora`);
  }

  const summary =
    parts.length > 0 ? `Entendi ${parts.join(", ")}. ` : "";

  return `${summary}Separei ${recommendations.length} opção(ões) reais da base local. A melhor combinação agora é ${recommendations[0].name}, e logo abaixo deixei outras alternativas para comparar.`;
};

const buildFollowUpActions = (
  intent: ChatIntent,
  recommendations: ChatRecommendation[],
) => {
  const actions: string[] = [];

  if (!intent.orcamentoMaximo) {
    actions.push("Quero informar orçamento");
  } else {
    actions.push("Priorize os mais baratos");
  }

  if (!intent.cidadeIncluida) {
    actions.push("Quero escolher um bairro");
  } else {
    actions.push("Quero trocar de bairro");
  }

  if (!intent.quantidadePessoas) {
    actions.push("Quero definir a lotação");
  } else {
    actions.push("Preciso para mais pessoas");
  }

  if (recommendations.length > 0) {
    actions.push("Mostre os mais compatíveis");
  }

  return actions.slice(0, 4);
};

const buildConversationSummary = (
  previousSummary: string,
  message: string,
  intent: ChatIntent,
  conversationalIntent: ConversationIntent,
) => {
  const facts = [
    intent.tipoEspaco ? `tipo de espaço: ${intent.tipoEspaco}` : undefined,
    intent.tipoEvento ? `tipo de evento: ${intent.tipoEvento}` : undefined,
    intent.quantidadePessoas ? `pessoas: ${intent.quantidadePessoas}` : undefined,
    intent.cidadeIncluida ? `local preferido: ${intent.cidadeIncluida}` : undefined,
    intent.cidadesExcluidas.length > 0
      ? `locais excluídos: ${intent.cidadesExcluidas.join(", ")}`
      : undefined,
    intent.recursosDesejados.length > 0
      ? `recursos: ${intent.recursosDesejados.join(", ")}`
      : undefined,
    intent.orcamentoMaximo ? `orçamento máximo: R$ ${intent.orcamentoMaximo}/hora` : undefined,
  ].filter(Boolean);
  const next = [
    previousSummary,
    `Última intenção: ${conversationalIntent}. Última mensagem: "${message}".`,
    facts.length > 0 ? `Preferências atuais: ${facts.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return next.length > 900 ? next.slice(next.length - 900) : next;
};

const toResponse = (
  mode: ChatMode,
  reply: string,
  conversationalIntent: ConversationIntent,
  shouldRecommend: boolean,
  intent: ChatIntent,
  conversationSummary: string,
  recommendations: ChatRecommendation[],
  askedField?: QuestionField,
): ChatResponse => ({
  mode,
  reply,
  conversationalIntent,
  shouldRecommend,
  intent,
  conversationSummary,
  recommendations,
  followUpActions: buildFollowUpActions(intent, recommendations),
  askedField,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const conversationSummary =
      typeof body?.conversationSummary === "string"
        ? body.conversationSummary.slice(-900)
        : "";

    if (!message) {
      const intent = emptyIntent();
      return NextResponse.json(
        toResponse(
          "ask",
          "Me conta em uma frase o tipo de espaço que você precisa.",
          "unknown",
          false,
          intent,
          conversationSummary,
          [],
          "spaceType",
        ),
        { status: 400 },
      );
    }

    const baseIntent = sanitizeIntent(body?.intent) ?? emptyIntent();
    const modelResponse = await chatWithModel(
      message,
      conversationSummary,
      baseIntent,
    );
    const rawModelResult = modelResponse.result;
    const modelResult =
      rawModelResult ??
      buildFallbackModelResult(message, baseIntent, modelResponse.failureReason);
    const extractedIntent = extractedToIntent(modelResult.extracted);
    const finalIntent = rawModelResult
      ? extractedIntent
      : mergeIntent(baseIntent, extractedIntent);
    const canRecommend =
      modelResult.shouldRecommend &&
      modelResult.intent !== "cancel" &&
      hasMinimumRecommendationData(finalIntent);
    const nextSummary = buildConversationSummary(
      conversationSummary,
      message,
      finalIntent,
      modelResult.intent,
    );

    if (!canRecommend) {
      return NextResponse.json(
        toResponse(
          "ask",
          modelResult.reply,
          modelResult.intent,
          false,
          finalIntent,
          nextSummary,
          [],
          getAskedField(finalIntent),
        ),
      );
    }

    const spaces = await spaceCatalog.listSpaces();
    const recommendations = matchSpaces(spaces, finalIntent);
    const recommendationReply = buildRecommendReply(finalIntent, recommendations);
    const reply =
      recommendations.length > 0
        ? `${modelResult.reply} ${recommendationReply}`
        : recommendationReply;

    return NextResponse.json(
        toResponse(
          "recommend",
          reply,
          modelResult.intent,
          true,
          finalIntent,
        nextSummary,
        recommendations,
      ),
    );
  } catch {
    const intent = emptyIntent();
    return NextResponse.json(
      toResponse(
        "ask",
        "Não consegui interpretar sua mensagem agora. Me diga tipo de espaço, pessoas, bairro ou orçamento e eu refaço a busca.",
        "unknown",
        false,
        intent,
        "",
        [],
        "refinement",
      ),
      { status: 500 },
    );
  }
}
