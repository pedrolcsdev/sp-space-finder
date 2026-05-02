"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChatFlowStep, Space } from "@/lib/data/contracts";

type MessageType = "bot" | "user";
type ConversationStage = "initial" | "searching" | "results";
type PricePreference = "bestMatch" | "lowest";
type AskedField = "spaceType" | "location" | "budget" | "capacity" | "refinement";
type ChatMode = "reply" | "ask" | "recommend";
type ChatAction = "reply_only" | "ask_followup" | "recommend" | "no_exact_match";

export interface ChatRecommendation extends Space {
  matchPercent: number;
  reasons: string[];
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  text: string;
  recommendations?: ChatRecommendation[];
  followUpActions?: string[];
}

interface ChatApiIntent {
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

interface ChatApiResponse {
  mode: ChatMode;
  reply: string;
  conversationalIntent?:
    | "casual"
    | "search"
    | "clarification"
    | "cancel"
    | "thanks"
    | "unknown";
  action?: ChatAction;
  intent: ChatApiIntent;
  conversationSummary?: string;
  recommendations: ChatRecommendation[];
  followUpActions: string[];
  askedField?: AskedField;
  resetContext?: boolean;
}

export interface ChatCriteria {
  city?: string;
  excludedCities: string[];
  capacity?: number;
  eventType?: string;
  resources: string[];
  excludedResources: string[];
  pricePreference: PricePreference;
  budgetMax?: number;
  category?: Space["category"];
}

interface StoredChatState {
  open: boolean;
  messages: ChatMessage[];
  criteria: ChatCriteria;
  conversationStage: ConversationStage;
  conversationSummary: string;
  lastAskedField?: AskedField;
}

interface ChatOpenDetail {
  message?: string;
  autoSend?: boolean;
}

interface ChatAssistantContextValue {
  open: boolean;
  messages: ChatMessage[];
  criteria: ChatCriteria;
  introSuggestions: string[];
  hasSearchContext: boolean;
  conversationStage: ConversationStage;
  isSearching: boolean;
  openChat: (detail?: ChatOpenDetail) => void;
  closeChat: () => void;
  resetConversation: () => void;
  sendMessage: (text: string) => Promise<void>;
  announceResults: (count: number) => void;
}

const SESSION_STORAGE_KEY = "sp-spaces-chat-state";

const introSuggestions = [
  "Quero uma sala para 10 pessoas",
  "Preciso de um auditório com projetor",
] as const;

const ChatAssistantContext = createContext<ChatAssistantContextValue | null>(null);

const toMessage = (text: string, type: MessageType): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  text,
});

const toBotMessage = (
  text: string,
  recommendations?: ChatRecommendation[],
  followUpActions?: string[],
): ChatMessage => ({
  ...toMessage(text, "bot"),
  recommendations,
  followUpActions,
});

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase();

const uniqueResources = (resources: string[]) => Array.from(new Set(resources));

const getBaseCriteria = (): ChatCriteria => ({
  resources: [],
  excludedCities: [],
  excludedResources: [],
  pricePreference: "bestMatch",
});

const getInitialGreeting = (chatFlow: ChatFlowStep[]) =>
  chatFlow[0]?.text ??
  "Olá! Eu posso te ajudar a encontrar o espaço ideal. Me diga o tipo de espaço, pessoas, bairro ou orçamento.";

const inferCategory = (
  eventType?: string,
  capacity?: number,
): Space["category"] | undefined => {
  if (!eventType) return undefined;

  const normalized = normalizeText(eventType);

  if (normalized.includes("reuniao")) return "meeting";
  if (normalized.includes("treinamento")) {
    return capacity && capacity > 35 ? "auditorium" : "meeting";
  }
  if (
    normalized.includes("evento corporativo") ||
    normalized.includes("palestra") ||
    normalized.includes("conferencia")
  ) {
    return capacity && capacity <= 24 ? "meeting" : "auditorium";
  }

  return undefined;
};

const criteriaToApiIntent = (criteria: ChatCriteria): ChatApiIntent => ({
  tipoEspaco: criteria.eventType,
  tipoEvento: criteria.eventType,
  cidade: undefined,
  cidadeIncluida: undefined,
  locations: criteria.city ? [criteria.city] : [],
  quantidadePessoas: criteria.capacity,
  recursosDesejados: criteria.resources,
  orcamentoMaximo: criteria.budgetMax,
  cidadesExcluidas: criteria.excludedCities,
  recursosExcluidos: criteria.excludedResources,
});

const mergeCriteriaWithIntent = (
  current: ChatCriteria,
  intent?: Partial<ChatApiIntent>,
): ChatCriteria => {
  if (!intent) return current;

  const city =
    intent.locations?.[0] ?? intent.cidadeIncluida ?? intent.cidade ?? undefined;
  const eventType = intent.tipoEvento ?? intent.tipoEspaco ?? undefined;
  const capacity = intent.quantidadePessoas;

  return {
    ...current,
    city: city ?? current.city,
    eventType: eventType ?? current.eventType,
    capacity: capacity ?? current.capacity,
    resources:
      intent.recursosDesejados && intent.recursosDesejados.length > 0
        ? uniqueResources(intent.recursosDesejados)
        : current.resources,
    excludedCities: uniqueResources([
      ...current.excludedCities,
      ...(intent.cidadesExcluidas ?? []),
    ]).filter(
      (item) => normalizeText(item) !== normalizeText(city ?? ""),
    ),
    excludedResources:
      intent.recursosExcluidos && intent.recursosExcluidos.length > 0
        ? uniqueResources(intent.recursosExcluidos)
        : current.excludedResources,
    budgetMax: intent.orcamentoMaximo ?? current.budgetMax,
    category: inferCategory(eventType ?? current.eventType, capacity ?? current.capacity),
  };
};

export const getRankedChatResults = (
  spaces: Space[],
  criteria: ChatCriteria,
): Space[] => {
  const normalizedCity = criteria.city ? normalizeText(criteria.city) : undefined;
  const normalizedExcludedCities = criteria.excludedCities.map((city) =>
    normalizeText(city),
  );

  return spaces
    .filter((space) => {
      const location = normalizeText(space.location);

      if (normalizedExcludedCities.some((city) => location.includes(city))) {
        return false;
      }

      if (!normalizedCity) return true;
      return location.includes(normalizedCity);
    })
    .map((space) => {
      let score = 55;

      if (criteria.category && space.category === criteria.category) score += 18;
      if (criteria.capacity) {
        if (space.capacity >= criteria.capacity) {
          score += 14;
        } else {
          score -= 25 + Math.min(18, criteria.capacity - space.capacity);
        }
      }

      if (criteria.resources.length > 0) {
        const normalizedResources = space.resources.map((resource) =>
          normalizeText(resource),
        );
        const matchedResources = criteria.resources.filter((resource) =>
          normalizedResources.some((item) =>
            item.includes(normalizeText(resource)),
          ),
        ).length;

        score += matchedResources * 8;
        score -= (criteria.resources.length - matchedResources) * 4;
      }

      if (criteria.budgetMax) {
        if (space.pricePerHour <= criteria.budgetMax) {
          score += 12;
        } else {
          score -= Math.min(20, Math.round((space.pricePerHour - criteria.budgetMax) / 10));
        }
      }

      if (space.recommended) score += 6;
      score += Math.max(0, 18 - space.pricePerHour / 20);

      return { space, score };
    })
    .sort((left, right) => {
      if (criteria.pricePreference === "lowest") {
        return left.space.pricePerHour - right.space.pricePerHour;
      }

      if (right.score !== left.score) return right.score - left.score;
      return left.space.pricePerHour - right.space.pricePerHour;
    })
    .map(({ space, score }) => ({
      ...space,
      matchPercentage:
        criteria.pricePreference === "lowest"
          ? undefined
          : Math.max(72, Math.min(98, Math.round(score))),
    }));
};

export function ChatAssistantProvider({
  children,
  chatFlow,
}: {
  children: ReactNode;
  chatFlow: ChatFlowStep[];
}) {
  const initialBotMessage = useMemo(
    () => [toMessage(getInitialGreeting(chatFlow), "bot")],
    [chatFlow],
  );
  const defaultState = useMemo<StoredChatState>(
    () => ({
      open: false,
      messages: initialBotMessage,
      criteria: getBaseCriteria(),
      conversationStage: "initial",
      conversationSummary: "",
      lastAskedField: undefined,
    }),
    [initialBotMessage],
  );

  const [state, setState] = useState<StoredChatState>(defaultState);

  useEffect(() => {
    const storedState = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!storedState) return;

    try {
      const parsed = JSON.parse(storedState) as Partial<StoredChatState>;

      setState({
        ...defaultState,
        ...parsed,
        criteria: {
          ...getBaseCriteria(),
          ...parsed.criteria,
          resources: parsed.criteria?.resources ?? [],
          excludedCities: parsed.criteria?.excludedCities ?? [],
          excludedResources: parsed.criteria?.excludedResources ?? [],
        },
        conversationStage:
          parsed.conversationStage ?? defaultState.conversationStage,
        conversationSummary:
          typeof parsed.conversationSummary === "string"
            ? parsed.conversationSummary
            : "",
        lastAskedField: parsed.lastAskedField ?? defaultState.lastAskedField,
        messages:
          parsed.messages && parsed.messages.length > 0
            ? parsed.messages
            : defaultState.messages,
      });
    } catch {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [defaultState]);

  useEffect(() => {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const closeChat = useCallback(() => {
    setState((current) => ({ ...current, open: false }));
  }, []);

  const resetConversation = useCallback(() => {
    setState({
      ...defaultState,
      open: true,
    });
  }, [defaultState]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    let shouldRequest = true;
    let requestCriteria = getBaseCriteria();
    let requestConversationSummary = "";
    let requestLastAskedField: AskedField | undefined;

    setState((current) => {
      if (current.conversationStage === "searching") {
        shouldRequest = false;
        return current;
      }

      requestCriteria = current.criteria;
      requestConversationSummary = current.conversationSummary;
      requestLastAskedField = current.lastAskedField;

      return {
        ...current,
        open: true,
        messages: [...current.messages, toMessage(trimmed, "user")],
        conversationStage: "searching",
      };
    });

    if (!shouldRequest) return;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          intent: criteriaToApiIntent(requestCriteria),
          conversationSummary: requestConversationSummary,
          previousAskedField: requestLastAskedField,
        }),
      });
      const data = (await response.json()) as Partial<ChatApiResponse>;

      setState((current) => {
        const nextCriteria = data.resetContext
          ? getBaseCriteria()
          : mergeCriteriaWithIntent(current.criteria, data.intent);

        return {
          ...current,
          open: true,
          criteria: nextCriteria,
          conversationSummary:
            data.resetContext
              ? ""
              : typeof data.conversationSummary === "string"
              ? data.conversationSummary
              : current.conversationSummary,
          conversationStage: "results",
          lastAskedField:
            data.action === "ask_followup" || data.mode === "ask"
              ? data.askedField
              : undefined,
          messages: [
            ...current.messages,
            toBotMessage(
              data.reply ??
                "Posso continuar refinando a busca se você me passar mais contexto.",
              data.mode === "recommend" || data.action === "no_exact_match"
                ? data.recommendations ?? []
                : [],
              data.followUpActions ?? [],
            ),
          ],
        };
      });
    } catch {
      setState((current) => ({
        ...current,
        open: true,
        conversationStage: "results",
        lastAskedField: "refinement",
        messages: [
          ...current.messages,
          toBotMessage(
            "Não consegui consultar a recomendação agora. Me diga tipo de espaço, pessoas, bairro ou orçamento e eu tento de novo.",
          ),
        ],
      }));
    }
  }, []);

  const openChat = useCallback(
    (detail?: ChatOpenDetail) => {
      setState((current) => ({
        ...current,
        open: true,
      }));

      if (detail?.autoSend && detail.message?.trim()) {
        window.setTimeout(() => {
          void sendMessage(detail.message!.trim());
        }, 50);
      }
    },
    [sendMessage],
  );

  const announceResults = useCallback((_count: number) => {
    return;
  }, []);

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      openChat((event as CustomEvent<ChatOpenDetail | undefined>).detail);
    };

    window.addEventListener("spspaces:open-chat", handleOpenChat);
    return () => {
      window.removeEventListener("spspaces:open-chat", handleOpenChat);
    };
  }, [openChat]);

const value = useMemo<ChatAssistantContextValue>(
    () => ({
      open: state.open,
      messages: state.messages,
      criteria: state.criteria,
      introSuggestions: [...introSuggestions],
      hasSearchContext:
        state.messages.length > 1 ||
        Boolean(
          state.criteria.city ||
            state.criteria.capacity ||
            state.criteria.eventType ||
            state.criteria.resources.length > 0 ||
            state.criteria.excludedCities.length > 0 ||
            state.criteria.budgetMax,
        ),
      conversationStage: state.conversationStage,
      isSearching: state.conversationStage === "searching",
      openChat,
      closeChat,
      resetConversation,
      sendMessage,
      announceResults,
    }),
    [
      announceResults,
      closeChat,
      openChat,
      resetConversation,
      sendMessage,
      state,
    ],
  );

  return (
    <ChatAssistantContext.Provider value={value}>
      {children}
    </ChatAssistantContext.Provider>
  );
}

export const useChatAssistant = () => {
  const context = useContext(ChatAssistantContext);

  if (!context) {
    throw new Error("useChatAssistant must be used within ChatAssistantProvider");
  }

  return context;
};
