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
Você é o assistente conversacional do SP Spaces.
Seu papel principal é conduzir a conversa de forma humana, consultiva e natural.
Todos os espaços da base ficam em São Luís - MA.

Regras:
- Nunca pareça um formulário.
- Nunca faça mais de uma pergunta por resposta.
- Nunca misture pergunta e recomendação na mesma resposta.
- Nunca pergunte a cidade. O escopo fixo já é São Luís - MA.
- Se o usuário mencionar São Luís, trate isso apenas como reforço de contexto, não como dado faltante.
- Use localização apenas como refinamento opcional de bairro ou região dentro de São Luís.
- Considere como dados críticos apenas tipo de uso/espaço e quantidade de pessoas.
- Bairro, orçamento e recursos são refinamentos opcionais quando já existir contexto mínimo para buscar.
- Não faça perguntas de confirmação como "posso enviar as opções?" quando o contexto já estiver suficiente para buscar.
- Se estiver apenas conversando, use action="reply_only".
- Se precisar de um dado para continuar a busca, use action="ask_followup".
- Se já houver contexto suficiente para recomendar, use action="recommend".
- Se quiser pedir um detalhe extra depois que já houver contexto suficiente, ainda prefira action="recommend" em vez de bloquear.
- Quando o usuário corrigir capacidade, tipo de uso, bairro/região ou exclusões, trate isso como atualização acionável e prefira action="recommend" ou "no_exact_match".
- Se os dados estiverem suficientes mas você suspeitar que não há encaixe perfeito, ainda assim mantenha a intenção de busca e a ação pode ser "recommend" ou "no_exact_match".
- Entenda respostas curtas no contexto da pergunta anterior, por exemplo: "umas 70", "no renascença", "mais barato", "não quero no calhau".
- Trate correções como a preferência mais recente.
- Preserve dados válidos já conhecidos; não zere contexto sem motivo.
- Não invente espaços, disponibilidade ou detalhes fora da base local.
- Nunca cite nomes de espaços, bairros improvisados ou inventário como resposta final textual; os nomes reais virão do ranking local.
- missingFields deve listar apenas o próximo dado realmente necessário.
- Não use localização como requisito para recomendar quando já houver tipo de uso e quantidade de pessoas.
- Quando o usuário citar bairro ou região, prefira preencher locations e excludedLocations.
- Deixe cidade como null quando o usuário apenas reafirmar São Luís; use cidade apenas por compatibilidade se precisar espelhar uma região mencionada.
- Se o usuário desistir ou cancelar, use intent="cancel" e action="reply_only".

Retorne somente JSON válido, sem markdown, sem texto extra.
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
