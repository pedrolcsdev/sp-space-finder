import { describe, expect, it } from "vitest";
import { spaces } from "@/data/mockData";
import {
  buildFallbackDecision,
  emptyIntent,
  parseLocalIntent,
  rankRecommendations,
  resolveChatTurn,
  type AiDecision,
  type ChatIntent,
} from "@/lib/chat/engine";

const buildDecision = (overrides: Partial<AiDecision>): AiDecision => ({
  reply: "Certo.",
  intent: "unknown",
  action: "reply_only",
  extracted: {
    tipoEspaco: null,
    tipoEvento: null,
    cidade: null,
    locations: [],
    excludedLocations: [],
    quantidadePessoas: null,
    recursosDesejados: [],
    orcamentoMaximo: null,
  },
  missingFields: [],
  confidence: 0.9,
  ...overrides,
});

describe("chat engine", () => {
  it('"oi" vira reply_only', () => {
    const response = resolveChatTurn(
      {
        message: "oi",
        previousSummary: "",
        baseIntent: emptyIntent(),
        aiDecision: buildDecision({
          reply: "Oi! Como posso ajudar?",
          intent: "casual",
          action: "reply_only",
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("reply");
    expect(response.action).toBe("reply_only");
    expect(response.recommendations).toHaveLength(0);
  });

  it('"bom dia, queria um espaço" vira ask_followup', () => {
    const response = resolveChatTurn(
      {
        message: "bom dia, queria um espaço",
        previousSummary: "",
        baseIntent: emptyIntent(),
        aiDecision: buildDecision({
          reply: "Bom dia! Que tipo de espaço você quer encontrar?",
          intent: "search",
          action: "ask_followup",
          missingFields: ["tipoEspaco"],
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("ask");
    expect(response.action).toBe("ask_followup");
    expect(response.askedField).toBe("spaceType");
  });

  it('"quero uma sala pra 7 pessoas" vira refinamento opcional sem bloquear a busca', () => {
    const response = resolveChatTurn(
      {
        message: "quero uma sala pra 7 pessoas",
        previousSummary: "",
        baseIntent: emptyIntent(),
        aiDecision: buildDecision({
          reply: "Perfeito. Em qual região você prefere?",
          intent: "search",
          action: "ask_followup",
          extracted: {
            tipoEspaco: "Sala de reunião",
            tipoEvento: "Reunião",
            cidade: null,
            locations: [],
            excludedLocations: [],
            quantidadePessoas: 7,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
          missingFields: ["orcamento"],
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("ask");
    expect(response.followUpKind).toBe("optional");
    expect(response.quickActions[0]?.kind).toBe("search_now");
    expect(response.intent.quantidadePessoas).toBe(7);
  });

  it('"em São Luís" nao vira requisito e ainda recomenda', () => {
    const baseIntent: ChatIntent = {
      tipoEspaco: "Sala de reunião",
      tipoEvento: "Reunião",
      quantidadePessoas: 7,
      cidade: undefined,
      cidadeIncluida: undefined,
      locations: [],
      recursosDesejados: [],
      orcamentoMaximo: undefined,
      cidadesExcluidas: [],
    };

    const response = resolveChatTurn(
      {
        message: "em São Luís",
        previousSummary: "",
        baseIntent,
        aiDecision: buildDecision({
          intent: "search",
          action: "recommend",
          extracted: {
            tipoEspaco: null,
            tipoEvento: null,
            cidade: "São Luís",
            locations: ["São Luís"],
            excludedLocations: [],
            quantidadePessoas: null,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.intent.cidadeIncluida).toBeUndefined();
  });

  it("nao repete cidade quando ela ja esta clara no contexto", () => {
    const baseIntent: ChatIntent = {
      tipoEspaco: undefined,
      tipoEvento: undefined,
      quantidadePessoas: undefined,
      cidade: "São Luís",
      cidadeIncluida: "São Luís",
      locations: ["São Luís"],
      recursosDesejados: [],
      orcamentoMaximo: undefined,
      cidadesExcluidas: [],
    };

    const response = resolveChatTurn(
      {
        message: "sao luis",
        previousSummary: "",
        baseIntent,
        previousAskedField: "location",
        aiDecision: buildDecision({
          reply: "Qual cidade voce prefere?",
          intent: "search",
          action: "ask_followup",
          missingFields: ["cidade"],
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("ask");
    expect(response.askedField).toBe("spaceType");
    expect(response.reply).not.toContain("cidade");
  });

  it('"não quero no calhau" exclui corretamente', () => {
    const baseIntent: ChatIntent = {
      tipoEspaco: "Sala de reunião",
      tipoEvento: "Reunião",
      quantidadePessoas: 7,
      cidade: "São Luís",
      cidadeIncluida: "São Luís",
      locations: ["São Luís"],
      recursosDesejados: [],
      orcamentoMaximo: undefined,
      cidadesExcluidas: [],
    };

    const response = resolveChatTurn(
      {
        message: "não quero no calhau",
        previousSummary: "",
        baseIntent,
        aiDecision: buildDecision({
          intent: "search",
          action: "recommend",
          extracted: {
            tipoEspaco: null,
            tipoEvento: null,
            cidade: null,
            locations: [],
            excludedLocations: ["Calhau"],
            quantidadePessoas: null,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
        }),
      },
      spaces,
    );

    expect(response.intent.cidadesExcluidas).toContain("Calhau");
    expect(
      response.recommendations.every((space) => !space.location.includes("Calhau")),
    ).toBe(true);
  });

  it('"quero auditório pra 400 pessoas" entra em no_exact_match com fallback coerente', () => {
    const result = rankRecommendations(spaces, {
      tipoEspaco: "Auditório",
      tipoEvento: "Palestra",
      cidade: "São Luís",
      cidadeIncluida: "São Luís",
      locations: ["São Luís"],
      quantidadePessoas: 400,
      recursosDesejados: [],
      orcamentoMaximo: undefined,
      cidadesExcluidas: [],
    });

    expect(result.matchMode).toBe("no_exact_match");
    expect(result.recommendations[0]?.capacity).toBe(200);
    expect(result.reply).toContain("Não encontrei");
  });

  it('"quero um auditório para 140 alunos" recomenda direto em Sao Luis', () => {
    const response = resolveChatTurn(
      {
        message: "quero um auditorio para 140 alunos",
        previousSummary: "",
        baseIntent: emptyIntent(),
        aiDecision: buildDecision({
          intent: "search",
          action: "recommend",
          extracted: {
            tipoEspaco: "Auditório",
            tipoEvento: "Aulão",
            cidade: null,
            locations: [],
            excludedLocations: [],
            quantidadePessoas: 140,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.recommendations.length).toBeGreaterThan(0);
  });

  it("corrige lotacao apos recomendacao e devolve novos cards no mesmo turno", () => {
    const response = resolveChatTurn(
      {
        message: "na verdade e so pra 5 pessoas",
        previousSummary: "",
        baseIntent: {
          tipoEspaco: "Auditório",
          tipoEvento: "Aulão",
          quantidadePessoas: 140,
          cidade: undefined,
          cidadeIncluida: undefined,
          locations: [],
          recursosDesejados: [],
          orcamentoMaximo: undefined,
          cidadesExcluidas: [],
        },
        aiDecision: buildDecision({
          reply: "Entendi, voce precisa de um espaco para um aulao com 5 pessoas em Sao Luis.",
          intent: "clarification",
          action: "reply_only",
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.intent.quantidadePessoas).toBe(5);
    expect(response.recommendations.length).toBeGreaterThan(0);
  });

  it('entende "umas 70" como resposta de capacidade quando esse era o campo perguntado', () => {
    const parsed = parseLocalIntent("umas 70", {
      previousAskedField: "capacity",
    });

    expect(parsed.quantidadePessoas).toBe(70);
  });

  it("fallback entende descricao semantica de aula como contexto de evento", () => {
    const parsed = parseLocalIntent(
      "vou precisar de um lugar com grande capacidade, pois vou dar uma aula pra 3 turmas esse fim de semana",
    );

    expect(parsed.tipoEvento).toContain("aula");
  });

  it('fallback entende "sala com projetor" como tipo de espaco valido', () => {
    const parsed = parseLocalIntent("sala com projetor para 50 pessoas");

    expect(parsed.tipoEspaco).toBe("Sala de reunião");
    expect(parsed.recursosDesejados).toContain("Projetor");
    expect(parsed.quantidadePessoas).toBe(50);
  });

  it("corrige pergunta repetida de capacidade e avanca para recomendacao", () => {
    const baseIntent: ChatIntent = {
      tipoEspaco: "Auditório",
      tipoEvento: "Apresentação para novos funcionários",
      quantidadePessoas: undefined,
      cidade: "Renascença",
      cidadeIncluida: "Renascença",
      locations: ["Renascença"],
      recursosDesejados: [],
      orcamentoMaximo: undefined,
      cidadesExcluidas: [],
    };

    const response = resolveChatTurn(
      {
        message: "70 pessoas",
        previousSummary: "",
        baseIntent,
        previousAskedField: "capacity",
        aiDecision: buildDecision({
          reply: "Quantas pessoas vão participar da apresentação?",
          intent: "search",
          action: "ask_followup",
          extracted: {
            tipoEspaco: null,
            tipoEvento: null,
            cidade: null,
            locations: [],
            excludedLocations: [],
            quantidadePessoas: null,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
          missingFields: ["quantidadePessoas"],
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.intent.quantidadePessoas).toBe(70);
    expect(response.recommendations.length).toBeGreaterThan(0);
  });

  it('fallback simples entende "mais do que 70" como capacidade em contexto', () => {
    const decision = buildFallbackDecision(
      "mais do que 70",
      {
        tipoEspaco: "Auditório",
        tipoEvento: "Apresentação",
        quantidadePessoas: undefined,
        cidade: "Renascença",
        cidadeIncluida: "Renascença",
        locations: ["Renascença"],
        recursosDesejados: [],
        orcamentoMaximo: undefined,
        cidadesExcluidas: [],
      },
      "capacity",
    );

    expect(decision.extracted.quantidadePessoas).toBe(70);
  });

  it('fallback simples entende "umas 70" sem a palavra "pessoas"', () => {
    const decision = buildFallbackDecision(
      "umas 70",
      {
        tipoEspaco: "Auditório",
        tipoEvento: "Apresentação",
        quantidadePessoas: undefined,
        cidade: "São Luís",
        cidadeIncluida: "São Luís",
        locations: ["São Luís"],
        recursosDesejados: [],
        orcamentoMaximo: undefined,
        cidadesExcluidas: [],
      },
      "capacity",
    );

    expect(decision.extracted.quantidadePessoas).toBe(70);
  });

  it('"prefiro na renascença" aplica refinamento opcional de regiao', () => {
    const response = resolveChatTurn(
      {
        message: "prefiro na renascença",
        previousSummary: "",
        baseIntent: {
          tipoEspaco: "Auditório",
          tipoEvento: "Aulão",
          quantidadePessoas: 120,
          cidade: undefined,
          cidadeIncluida: undefined,
          locations: [],
          recursosDesejados: [],
          orcamentoMaximo: undefined,
          cidadesExcluidas: [],
        },
        aiDecision: buildDecision({
          intent: "search",
          action: "recommend",
          extracted: {
            tipoEspaco: null,
            tipoEvento: null,
            cidade: null,
            locations: ["Renascença"],
            excludedLocations: [],
            quantidadePessoas: null,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.intent.cidadeIncluida).toBe("Renascença");
    expect(response.reply).toContain("região de Renascença");
  });

  it("forca recommend quando o modelo responde reply_only com contexto completo", () => {
    const response = resolveChatTurn(
      {
        message: "preciso rever as opcoes",
        previousSummary: "",
        baseIntent: {
          tipoEspaco: "Auditório",
          tipoEvento: "Aulão",
          quantidadePessoas: 5,
          cidade: undefined,
          cidadeIncluida: undefined,
          locations: [],
          recursosDesejados: [],
          orcamentoMaximo: undefined,
          cidadesExcluidas: [],
        },
        aiDecision: buildDecision({
          reply: "Posso te enviar as opcoes disponiveis para voce?",
          intent: "search",
          action: "reply_only",
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.recommendations.length).toBeGreaterThan(0);
  });

  it("promove ask_followup para refinamento opcional quando tipo e lotacao ja bastam", () => {
    const response = resolveChatTurn(
      {
        message: "sala com projetor para 50 pessoas",
        previousSummary: "",
        baseIntent: emptyIntent(),
        aiDecision: buildDecision({
          reply: "Voce prefere algum bairro ou tem um teto de orcamento?",
          intent: "search",
          action: "ask_followup",
          extracted: {
            tipoEspaco: "Sala de reunião",
            tipoEvento: "Treinamento",
            cidade: null,
            locations: [],
            excludedLocations: [],
            quantidadePessoas: 50,
            recursosDesejados: ["Projetor"],
            orcamentoMaximo: null,
          },
          missingFields: ["bairro"],
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("ask");
    expect(response.followUpKind).toBe("optional");
    expect(response.quickActions.map((action) => action.kind)).toContain("search_now");
    expect(response.quickActions.map((action) => action.kind)).toContain("refine_location");
    expect(response.quickActions.map((action) => action.kind)).toContain("refine_budget");
  });

  it("mantem pergunta obrigatoria quando ainda falta capacidade", () => {
    const response = resolveChatTurn(
      {
        message: "quero um lugar pra treinar minha equipe",
        previousSummary: "",
        baseIntent: emptyIntent(),
        aiDecision: buildDecision({
          reply: "Perfeito. Para quantas pessoas voce precisa do espaco?",
          intent: "search",
          action: "ask_followup",
          extracted: {
            tipoEspaco: null,
            tipoEvento: "Treinamento de equipe",
            cidade: null,
            locations: [],
            excludedLocations: [],
            quantidadePessoas: null,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
          missingFields: ["quantidadePessoas"],
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("ask");
    expect(response.followUpKind).toBe("required");
    expect(response.askedField).toBe("capacity");
    expect(response.quickActions).toHaveLength(0);
  });

  it('confirma com "sim" e nao entra em loop quando o contexto ja esta completo', () => {
    const response = resolveChatTurn(
      {
        message: "sim",
        previousSummary: "",
        baseIntent: {
          tipoEspaco: "Auditório",
          tipoEvento: "Aulão",
          quantidadePessoas: 5,
          cidade: undefined,
          cidadeIncluida: undefined,
          locations: [],
          recursosDesejados: [],
          orcamentoMaximo: undefined,
          cidadesExcluidas: [],
        },
        aiDecision: buildDecision({
          reply: "Claro! Posso te mandar as opcoes.",
          intent: "clarification",
          action: "reply_only",
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.recommendations.length).toBeGreaterThan(0);
  });

  it('"quero evitar ponta d’areia" exclui bairro sem pedir cidade', () => {
    const response = resolveChatTurn(
      {
        message: "quero evitar ponta d'areia",
        previousSummary: "",
        baseIntent: {
          tipoEspaco: "Auditório",
          tipoEvento: "Aulão",
          quantidadePessoas: 120,
          cidade: undefined,
          cidadeIncluida: undefined,
          locations: [],
          recursosDesejados: [],
          orcamentoMaximo: undefined,
          cidadesExcluidas: [],
        },
        aiDecision: buildDecision({
          intent: "search",
          action: "recommend",
          extracted: {
            tipoEspaco: null,
            tipoEvento: null,
            cidade: null,
            locations: [],
            excludedLocations: ["Ponta d'Areia"],
            quantidadePessoas: null,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.intent.cidadesExcluidas).toContain("Ponta d'Areia");
    expect(
      response.recommendations.every((space) => !space.location.includes("Ponta d'Areia")),
    ).toBe(true);
  });

  it("nao deixa uma resposta textual inventada sem recommendations quando a busca esta pronta", () => {
    const response = resolveChatTurn(
      {
        message: "agora pode ser menor",
        previousSummary: "",
        baseIntent: {
          tipoEspaco: "Auditório",
          tipoEvento: "Aulão",
          quantidadePessoas: 140,
          cidade: undefined,
          cidadeIncluida: undefined,
          locations: [],
          recursosDesejados: [],
          orcamentoMaximo: undefined,
          cidadesExcluidas: [],
        },
        aiDecision: buildDecision({
          reply:
            "Com 5 pessoas, um espaco pequeno e confortavel seria ideal. Posso sugerir a Sala de Aula 3 no Centro.",
          intent: "clarification",
          action: "reply_only",
          extracted: {
            tipoEspaco: null,
            tipoEvento: null,
            cidade: null,
            locations: [],
            excludedLocations: [],
            quantidadePessoas: 5,
            recursosDesejados: [],
            orcamentoMaximo: null,
          },
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("recommend");
    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.reply).not.toContain("Sala de Aula 3");
  });

  it("nao repete tipo de espaco quando a descricao ja trouxe contexto suficiente", () => {
    const baseIntent: ChatIntent = {
      tipoEspaco: undefined,
      tipoEvento:
        "vou precisar de um lugar com grande capacidade, pois vou dar uma aula pra 3 turmas esse fim de semana",
      quantidadePessoas: undefined,
      cidade: "São Luís",
      cidadeIncluida: "São Luís",
      locations: ["São Luís"],
      recursosDesejados: [],
      orcamentoMaximo: undefined,
      cidadesExcluidas: [],
    };

    const response = resolveChatTurn(
      {
        message:
          "vou precisar de um lugar com grande capacidade, pois vou dar uma aula pra 3 turmas esse fim de semana",
        previousSummary: "",
        baseIntent,
        aiDecision: buildDecision({
          reply: "Qual tipo de espaço você procura?",
          intent: "search",
          action: "ask_followup",
          missingFields: ["tipoEspaco"],
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("ask");
    expect(response.askedField).toBe("capacity");
    expect(response.reply).not.toContain("tipo");
  });

  it('"obrigado" vira reply_only', () => {
    const response = resolveChatTurn(
      {
        message: "obrigado",
        previousSummary: "",
        baseIntent: emptyIntent(),
        aiDecision: buildDecision({
          reply: "Por nada!",
          intent: "thanks",
          action: "reply_only",
        }),
      },
      spaces,
    );

    expect(response.mode).toBe("reply");
    expect(response.action).toBe("reply_only");
  });
});
