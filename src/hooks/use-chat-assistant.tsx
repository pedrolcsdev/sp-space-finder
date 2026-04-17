"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { ChatFlowStep, Space } from "@/lib/data/contracts";

type MessageType = "bot" | "user";
type ConversationStage =
  | "initial"
  | "awaitingLocation"
  | "awaitingResources"
  | "searching"
  | "results";

export interface ChatMessage {
  id: string;
  type: MessageType;
  text: string;
}

type PricePreference = "bestMatch" | "lowest";

export interface ChatCriteria {
  city?: string;
  capacity?: number;
  eventType?: string;
  category?: Space["category"];
  resources: string[];
  pricePreference: PricePreference;
}

interface StoredChatState {
  open: boolean;
  messages: ChatMessage[];
  step: number;
  criteria: ChatCriteria;
  pendingResultsAnnouncement: boolean;
  conversationStage: ConversationStage;
  selectedResourceOptions: string[];
  pendingSearchNavigation: boolean;
}

interface ChatOpenDetail {
  message?: string;
  autoSend?: boolean;
}

interface ChatAssistantContextValue {
  open: boolean;
  messages: ChatMessage[];
  step: number;
  criteria: ChatCriteria;
  introSuggestions: string[];
  followUpActions: string[];
  locationSuggestions: string[];
  resourceOptions: string[];
  hasSearchContext: boolean;
  conversationStage: ConversationStage;
  selectedResourceOptions: string[];
  isSearching: boolean;
  openChat: (detail?: ChatOpenDetail) => void;
  closeChat: () => void;
  resetConversation: () => void;
  sendMessage: (text: string) => void;
  handleQuickAction: (action: string) => void;
  toggleResourceOption: (resource: string) => void;
  confirmResourceSelection: () => void;
  announceResults: (count: number) => void;
}

const SESSION_STORAGE_KEY = "sp-spaces-chat-state";

const introSuggestions = [
  "Quero um coworking com Wi-Fi e ar-condicionado",
  "Preciso de uma sala para reunião com projetor",
] as const;

const locationSuggestions = [
  "Renascença",
  "Calhau",
  "Ponta d'Areia",
  "Jardim Renascença",
] as const;

const essentialResourceOptions = [
  "Wi-Fi",
  "Ar Condicionado",
  "Projetor",
  "Videoconferência",
  "Café",
  "Acessibilidade",
  "Estacionamento",
] as const;

const followUpActions = [
  "Refinar busca",
  "Ver apenas os mais baratos",
  "Ver os mais compatíveis",
  "Mudar cidade",
  "Falar com atendimento",
] as const;

const cityPatterns = [
  { label: "Renascença", pattern: /renascenca|renascença/i },
  { label: "Renascença II", pattern: /renascenca ii|renascença ii/i },
  { label: "Jardim Renascença", pattern: /jardim renascenca|jardim renascença/i },
  { label: "Calhau", pattern: /calhau/i },
  { label: "Quintas do Calhau", pattern: /quintas do calhau/i },
  { label: "Ponta d'Areia", pattern: /ponta d'?areia/i },
  { label: "Ponta do Farol", pattern: /ponta do farol/i },
  { label: "São Francisco", pattern: /sao francisco|são francisco/i },
  { label: "Cohama", pattern: /cohama/i },
  { label: "São Luís", pattern: /sao luis|são luís/i },
] as const;

const resourceMatchers = [
  {
    resource: "Projetor",
    pattern: /projetor|apresenta(c|ç)(a|ã)o|tela/i,
  },
  {
    resource: "Videoconferência",
    pattern: /videoconfer|videochamada|hibrid|híbrido/i,
  },
  {
    resource: "Wi-Fi",
    pattern: /wi[\s-]?fi|internet/i,
  },
  {
    resource: "Ar Condicionado",
    pattern: /ar condicionado|climatiza/i,
  },
  {
    resource: "Café",
    pattern: /caf[eé]|coffee break/i,
  },
  {
    resource: "Acessibilidade",
    pattern: /acessib/i,
  },
  {
    resource: "Estacionamento",
    pattern: /estacionamento|vaga/i,
  },
] as const;

const ChatAssistantContext = createContext<ChatAssistantContextValue | null>(
  null,
);

const toMessage = (text: string, type: MessageType): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  text,
});

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const uniqueResources = (resources: string[]) => Array.from(new Set(resources));

const getBaseCriteria = (): ChatCriteria => ({
  resources: [],
  pricePreference: "bestMatch",
});

const getInitialGreeting = (chatFlow: ChatFlowStep[]) =>
  chatFlow[0]?.text ??
  "Olá! Bom dia, sou o assistente do SP Spaces e vou te ajudar a encontrar o espaço ideal.";

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

const parseCapacity = (text: string): number | undefined => {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d{1,3})/);
  if (match) return Number(match[1]);
  if (normalized.includes("ate 30")) return 30;
  if (normalized.includes("mais de 50")) return 50;
  if (normalized.includes("5 a 20")) return 20;
  if (normalized.includes("20 a 50")) return 50;
  if (normalized.includes("ate 5")) return 5;

  return undefined;
};

const parseEventType = (text: string): string | undefined => {
  const normalized = normalizeText(text);

  if (normalized.includes("evento corporativo")) return "Evento corporativo";
  if (normalized.includes("reuniao")) return "Reunião";
  if (normalized.includes("treinamento")) return "Treinamento";
  if (normalized.includes("workshop")) return "Workshop";
  if (normalized.includes("palestra")) return "Palestra";

  return undefined;
};

const parseCity = (text: string): string | undefined => {
  const found = cityPatterns.find(({ pattern }) => pattern.test(text));
  return found?.label;
};

const parseResources = (text: string): string[] =>
  resourceMatchers
    .filter(({ pattern }) => pattern.test(text))
    .map(({ resource }) => resource);

const summarizeCriteria = (criteria: ChatCriteria) => {
  const summaryItems = [
    criteria.city && `cidade`,
    criteria.capacity && `capacidade`,
    criteria.eventType && `tipo de evento`,
    criteria.resources.length > 0 && `recursos essenciais`,
  ].filter(Boolean) as string[];

  if (summaryItems.length === 0) {
    return "Considerei os critérios que você já compartilhou para montar essa seleção.";
  }

  return `Considerei ${summaryItems.join(", ")} para montar essa seleção.`;
};

const buildSearchReadyReply = (criteria: ChatCriteria) => {
  const parts: string[] = [];

  if (criteria.eventType) {
    parts.push(`Para ${criteria.eventType.toLowerCase()}, vou priorizar espaços`);
  } else {
    parts.push("Vou priorizar espaços");
  }

  if (criteria.capacity) {
    parts.push(`com capacidade adequada para cerca de ${criteria.capacity} pessoas`);
  }

  if (criteria.resources.length > 0) {
    parts.push(
      `e estrutura com ${criteria.resources
        .slice(0, 2)
        .map((resource) => resource.toLowerCase())
        .join(" e ")}`,
    );
  }

  if (criteria.city) {
    parts.push(`em ${criteria.city}`);
  }

  return `${parts.join(" ")}.`;
};

const buildResultsMessage = (criteria: ChatCriteria, count: number) => {
  const opener =
    count > 0
      ? "Esses são os espaços que mais se adequaram à sua pesquisa."
      : "Não encontrei combinações perfeitas com todos os critérios, mas separei a melhor aproximação possível.";

  return `${opener} ${summarizeCriteria(criteria)}`;
};

const mergeCriteriaFromText = (
  current: ChatCriteria,
  text: string,
): ChatCriteria => {
  const next: ChatCriteria = {
    ...current,
    resources: [...current.resources],
  };

  const parsedCity = parseCity(text);
  const parsedCapacity = parseCapacity(text);
  const parsedEventType = parseEventType(text);
  const parsedResources = parseResources(text);
  const normalized = normalizeText(text);

  if (parsedCity) {
    next.city = parsedCity;
  }

  if (parsedCapacity) {
    next.capacity = parsedCapacity;
  }

  if (parsedEventType) {
    next.eventType = parsedEventType;
  }

  if (parsedResources.length > 0) {
    next.resources = uniqueResources([...next.resources, ...parsedResources]);
  }

  if (
    normalized.includes("mais barato") ||
    normalized.includes("barato") ||
    normalized.includes("economico")
  ) {
    next.pricePreference = "lowest";
  }

  if (
    normalized.includes("mais compativel") ||
    normalized.includes("mais compatível") ||
    normalized.includes("melhores opcoes") ||
    normalized.includes("melhores opções")
  ) {
    next.pricePreference = "bestMatch";
  }

  next.category = inferCategory(next.eventType, next.capacity);

  return next;
};

export const getRankedChatResults = (
  spaces: Space[],
  criteria: ChatCriteria,
): Space[] => {
  const normalizedCity = criteria.city ? normalizeText(criteria.city) : undefined;

  const scoredSpaces = spaces
    .filter((space) => {
      if (!normalizedCity) return true;
      return normalizeText(space.location).includes(normalizedCity);
    })
    .map((space) => {
      let score = 55;

      if (criteria.category && space.category === criteria.category) score += 18;
      if (criteria.capacity) {
        if (space.capacity >= criteria.capacity) {
          score += 14;
        } else {
          score -= Math.min(18, criteria.capacity - space.capacity);
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

  return scoredSpaces;
};

export function ChatAssistantProvider({
  children,
  chatFlow,
}: {
  children: ReactNode;
  chatFlow: ChatFlowStep[];
}) {
  const router = useRouter();
  const initialBotMessage = useMemo(
    () => [toMessage(getInitialGreeting(chatFlow), "bot")],
    [chatFlow],
  );
  const defaultState = useMemo<StoredChatState>(
    () => ({
      open: false,
      messages: initialBotMessage,
      step: 0,
      criteria: getBaseCriteria(),
      pendingResultsAnnouncement: false,
      conversationStage: "initial",
      selectedResourceOptions: [],
      pendingSearchNavigation: false,
    }),
    [initialBotMessage],
  );
  const routeTimerRef = useRef<number | null>(null);

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
        },
        conversationStage:
          parsed.conversationStage ?? defaultState.conversationStage,
        selectedResourceOptions:
          parsed.selectedResourceOptions ?? parsed.criteria?.resources ?? [],
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

  useEffect(() => {
    return () => {
      if (routeTimerRef.current) {
        window.clearTimeout(routeTimerRef.current);
      }
    };
  }, []);

  const pushResultsRoute = useCallback(() => {
    if (routeTimerRef.current) {
      window.clearTimeout(routeTimerRef.current);
    }

    routeTimerRef.current = window.setTimeout(() => {
      router.push("/chat-resultados");
    }, 2000);
  }, [router]);

  const triggerSearch = useCallback(
    (criteria: ChatCriteria, messages: ChatMessage[]) => {
      setState((current) => ({
        ...current,
        open: true,
        criteria,
        messages,
        pendingResultsAnnouncement: true,
        conversationStage: "searching",
        pendingSearchNavigation: true,
      }));
      pushResultsRoute();
    },
    [pushResultsRoute],
  );

  const openChat = useCallback(
    (detail?: ChatOpenDetail) => {
      setState((current) => ({
        ...current,
        open: true,
      }));

      if (detail?.autoSend && detail.message?.trim()) {
        window.setTimeout(() => {
          setState((current) => {
            const nextCriteria = mergeCriteriaFromText(
              current.criteria,
              detail.message!.trim(),
            );

            return {
              ...current,
              open: true,
              step: 1,
              criteria: nextCriteria,
              messages: [
                ...current.messages,
                toMessage(detail.message!.trim(), "user"),
                toMessage(
                  "Perfeito. Você tem alguma preferência de localização?",
                  "bot",
                ),
              ],
              conversationStage: "awaitingLocation",
            };
          });
        }, 50);
      }
    },
    [],
  );

  const closeChat = useCallback(() => {
    setState((current) => ({ ...current, open: false }));
  }, []);

  const resetConversation = useCallback(() => {
    setState({
      ...defaultState,
      open: true,
    });
  }, [defaultState]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setState((current) => {
        const nextMessages = [...current.messages, toMessage(trimmed, "user")];
        const nextCriteria = mergeCriteriaFromText(
          current.criteria,
          trimmed,
        );
        const normalized = normalizeText(trimmed);

        if (current.conversationStage === "searching") {
          return current;
        }

        if (current.conversationStage === "initial") {
          return {
            ...current,
            open: true,
            step: 1,
            criteria: nextCriteria,
            messages: [
              ...nextMessages,
              toMessage(
                "Perfeito. Você tem alguma preferência de localização?",
                "bot",
              ),
            ],
            conversationStage: "awaitingLocation",
          };
        }

        if (current.conversationStage === "awaitingLocation") {
          const nextLocationCriteria = {
            ...nextCriteria,
            city: nextCriteria.city ?? trimmed,
          };

          return {
            ...current,
            open: true,
            step: 2,
            criteria: nextLocationCriteria,
            messages: [
              ...nextMessages,
              toMessage(
                "Agora me diga quais recursos são essenciais. Você pode escolher mais de um.",
                "bot",
              ),
            ],
            conversationStage: "awaitingResources",
            selectedResourceOptions:
              nextLocationCriteria.resources.length > 0
                ? nextLocationCriteria.resources
                : current.selectedResourceOptions,
          };
        }

        if (normalized.includes("mudar cidade")) {
          return {
            ...current,
            open: true,
            messages: [
              ...nextMessages,
              toMessage(
                "Claro. Me diga a região ou bairro desejado que eu refaço a busca mantendo o restante.",
                "bot",
              ),
            ],
            conversationStage: "awaitingLocation",
          };
        }

        if (normalized.includes("falar com atendimento")) {
          return {
            ...current,
            open: true,
            messages: [
              ...nextMessages,
              toMessage(
                "Posso seguir te ajudando por aqui e depois encaminhar o contexto para um atendimento consultivo, se você quiser.",
                "bot",
              ),
            ],
          };
        }

        const updatedMessages = [
          ...nextMessages,
          toMessage(buildSearchReadyReply(nextCriteria), "bot"),
        ];

        window.setTimeout(() => {
          triggerSearch(nextCriteria, updatedMessages);
        }, 80);

        return {
          ...current,
          open: true,
          step: 3,
          criteria: nextCriteria,
          messages: updatedMessages,
          conversationStage: "searching",
          selectedResourceOptions: nextCriteria.resources,
          pendingSearchNavigation: true,
        };
      });
    },
    [triggerSearch],
  );

  const handleQuickAction = useCallback(
    (action: string) => {
      sendMessage(action);
    },
    [sendMessage],
  );

  const toggleResourceOption = useCallback((resource: string) => {
    setState((current) => {
      const selected = current.selectedResourceOptions.includes(resource)
        ? current.selectedResourceOptions.filter((item) => item !== resource)
        : [...current.selectedResourceOptions, resource];

      return {
        ...current,
        selectedResourceOptions: selected,
      };
    });
  }, []);

  const confirmResourceSelection = useCallback(() => {
    setState((current) => {
      if (current.conversationStage !== "awaitingResources") return current;

      const selectedResources = uniqueResources([
        ...current.criteria.resources,
        ...current.selectedResourceOptions,
      ]);
      const nextCriteria = {
        ...current.criteria,
        resources: selectedResources,
      };
      const selectionMessage =
        selectedResources.length > 0
          ? `Recursos essenciais: ${selectedResources.join(", ")}`
          : "Sem recursos obrigatórios";
      const nextMessages = [
        ...current.messages,
        toMessage(selectionMessage, "user"),
        toMessage(buildSearchReadyReply(nextCriteria), "bot"),
      ];

      window.setTimeout(() => {
        triggerSearch(nextCriteria, nextMessages);
      }, 80);

      return {
        ...current,
        open: true,
        step: 3,
        criteria: nextCriteria,
        messages: nextMessages,
        conversationStage: "searching",
        selectedResourceOptions: selectedResources,
        pendingSearchNavigation: true,
      };
    });
  }, [triggerSearch]);

  const announceResults = useCallback((count: number) => {
    setState((current) => {
      if (!current.pendingResultsAnnouncement) return current;

      return {
        ...current,
        open: true,
        pendingResultsAnnouncement: false,
        pendingSearchNavigation: false,
        conversationStage: "results",
        messages: [
          ...current.messages,
          toMessage(buildResultsMessage(current.criteria, count), "bot"),
        ],
      };
    });
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
      step: state.step,
      criteria: state.criteria,
      introSuggestions: [...introSuggestions],
      followUpActions: [...followUpActions],
      locationSuggestions: [...locationSuggestions],
      resourceOptions: [...essentialResourceOptions],
      hasSearchContext:
        state.messages.length > 1 ||
        Boolean(
          state.criteria.city ||
            state.criteria.capacity ||
            state.criteria.eventType ||
            state.criteria.resources.length > 0,
        ),
      conversationStage: state.conversationStage,
      selectedResourceOptions: state.selectedResourceOptions,
      isSearching: state.conversationStage === "searching",
      openChat,
      closeChat,
      resetConversation,
      sendMessage,
      handleQuickAction,
      toggleResourceOption,
      confirmResourceSelection,
      announceResults,
    }),
    [
      announceResults,
      closeChat,
      confirmResourceSelection,
      handleQuickAction,
      openChat,
      resetConversation,
      sendMessage,
      state,
      toggleResourceOption,
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
