import { env } from "node:process";
import type { AiDecision, ChatIntent, QuestionField } from "./types";
import { sanitizeAiDecision } from "./intent";

const GROQ_MODEL = "openai/gpt-oss-20b";
const MODEL_TIMEOUT_MS = 2500;
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const MODEL_FAILURE_CACHE_TTL_MS = 30 * 1000;
const MODEL_COOLDOWN_MS = 2 * 60 * 1000;
const MODEL_ERROR_COOLDOWN_MS = 30 * 1000;

const modelCache = new Map<string, { expiresAt: number; result: AiDecision | null }>();
let modelCooldownUntil = 0;

const responseSchema = {
  type: "object",
  properties: {
    reply: { type: "string" },
    intent: {
      type: "string",
      enum: ["casual", "search", "clarification", "cancel", "thanks", "unknown"],
    },
    action: {
      type: "string",
      enum: ["reply_only", "ask_followup", "recommend", "no_exact_match"],
    },
    confidence: { type: "number" },
    extracted: {
      type: "object",
      properties: {
        tipoEvento: { type: ["string", "null"] },
        tipoEspaco: { type: ["string", "null"] },
        cidade: { type: ["string", "null"] },
        locations: { type: "array", items: { type: "string" } },
        excludedLocations: { type: "array", items: { type: "string" } },
        quantidadePessoas: { type: ["integer", "null"] },
        recursosDesejados: { type: "array", items: { type: "string" } },
        orcamentoMaximo: { type: ["number", "null"] },
      },
      required: [
        "tipoEvento",
        "tipoEspaco",
        "cidade",
        "locations",
        "excludedLocations",
        "quantidadePessoas",
        "recursosDesejados",
        "orcamentoMaximo",
      ],
    },
    missingFields: { type: "array", items: { type: "string" } },
  },
  required: ["reply", "intent", "action", "confidence", "extracted", "missingFields"],
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

const buildPrompt = ({
  message,
  conversationSummary,
  currentIntent,
  previousAskedField,
}: {
  message: string;
  conversationSummary: string;
  currentIntent: ChatIntent;
  previousAskedField?: QuestionField;
}) => `
Mensagem do usuario:
${message}

Contexto acumulado da conversa:
${conversationSummary || "Sem contexto anterior."}

Contexto estruturado conhecido:
${JSON.stringify(currentIntent)}

Ultimo dado que o assistente pediu:
${previousAskedField ?? "Nenhum campo especifico"}
`;

const systemInstruction = `
Voce e o assistente conversacional do SP Spaces.
Seu papel principal e conduzir a conversa de forma humana, consultiva e natural.
Todos os espacos da base ficam em Sao Luis - MA.

Regras:
- Nunca pareca um formulario.
- Nunca faca mais de uma pergunta por resposta.
- Nunca misture pergunta e recomendacao na mesma resposta.
- Nunca pergunte a cidade. O escopo fixo ja e Sao Luis - MA.
- Se o usuario mencionar Sao Luis, trate isso apenas como reforco de contexto, nao como dado faltante.
- Use localizacao apenas como refinamento opcional de bairro ou regiao dentro de Sao Luis.
- Considere como dados criticos apenas tipo de uso/espaco e quantidade de pessoas.
- Bairro, orcamento e recursos sao refinamentos opcionais quando ja existir contexto minimo para buscar.
- Nao faca perguntas de confirmacao como "posso enviar as opcoes?" quando o contexto ja estiver suficiente para buscar.
- Se estiver apenas conversando, use action="reply_only".
- Se precisar de um dado para continuar a busca, use action="ask_followup".
- Se ja houver contexto suficiente para recomendar, use action="recommend".
- Se quiser pedir um detalhe extra depois que ja houver contexto suficiente, ainda prefira action="recommend" em vez de bloquear.
- Quando o usuario corrigir capacidade, tipo de uso, bairro/regiao ou exclusoes, trate isso como atualizacao acionavel e prefira action="recommend" ou "no_exact_match".
- Se os dados estiverem suficientes mas voce suspeitar que nao ha encaixe perfeito, ainda assim mantenha a intencao de busca e a acao pode ser "recommend" ou "no_exact_match".
- Entenda respostas curtas no contexto da pergunta anterior, por exemplo: "umas 70", "no renascenca", "mais barato", "nao quero no calhau".
- Trate correcoes como a preferencia mais recente.
- Preserve dados validos ja conhecidos; nao zere contexto sem motivo.
- Nao invente espacos, disponibilidade ou detalhes fora da base local.
- Nunca cite nomes de espacos, bairros improvisados ou inventario como resposta final textual; os nomes reais virao do ranking local.
- missingFields deve listar apenas o proximo dado realmente necessario.
- Nao use localizacao como requisito para recomendar quando ja houver tipo de uso e quantidade de pessoas.
- Quando o usuario citar bairro ou regiao, prefira preencher locations e excludedLocations.
- Deixe cidade como null quando o usuario apenas reafirmar Sao Luis; use cidade apenas por compatibilidade se precisar espelhar uma regiao mencionada.
- Se o usuario desistir ou cancelar, use intent="cancel" e action="reply_only".

Retorne somente JSON valido, sem markdown, sem texto extra.
`;

export const chatWithGroq = async ({
  message,
  conversationSummary,
  currentIntent,
  previousAskedField,
}: {
  message: string;
  conversationSummary: string;
  currentIntent: ChatIntent;
  previousAskedField?: QuestionField;
}): Promise<AiDecision | null> => {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey || Date.now() < modelCooldownUntil) return null;

  const cacheKey = JSON.stringify({
    message,
    conversationSummary,
    currentIntent,
    previousAskedField,
  });
  const cached = modelCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.35,
        reasoning_effort: "low",
        max_completion_tokens: 700,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: systemInstruction,
          },
          {
            role: "user",
            content: `${buildPrompt({
              message,
              conversationSummary,
              currentIntent,
              previousAskedField,
            })}

Schema obrigatorio:
${JSON.stringify(responseSchema)}`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      modelCooldownUntil = Date.now() + MODEL_COOLDOWN_MS;
      modelCache.set(cacheKey, {
        expiresAt: Date.now() + MODEL_FAILURE_CACHE_TTL_MS,
        result: null,
      });
      return null;
    }

    if (!response.ok) {
      modelCache.set(cacheKey, {
        expiresAt: Date.now() + MODEL_FAILURE_CACHE_TTL_MS,
        result: null,
      });
      return null;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const parsed = extractJsonObject(text);
    if (!parsed) {
      modelCache.set(cacheKey, {
        expiresAt: Date.now() + MODEL_FAILURE_CACHE_TTL_MS,
        result: null,
      });
      return null;
    }

    const decision = sanitizeAiDecision(parsed);
    if (!decision) {
      modelCache.set(cacheKey, {
        expiresAt: Date.now() + MODEL_FAILURE_CACHE_TTL_MS,
        result: null,
      });
      return null;
    }

    modelCache.set(cacheKey, {
      expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
      result: decision,
    });

    return decision;
  } catch {
    modelCooldownUntil = Date.now() + MODEL_ERROR_COOLDOWN_MS;
    modelCache.set(cacheKey, {
      expiresAt: Date.now() + MODEL_FAILURE_CACHE_TTL_MS,
      result: null,
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
};
