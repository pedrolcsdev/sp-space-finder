import type { Space } from "@/lib/data/contracts";

export type AiIntent =
  | "casual"
  | "search"
  | "clarification"
  | "cancel"
  | "thanks"
  | "unknown";

export type AiAction =
  | "reply_only"
  | "ask_followup"
  | "recommend"
  | "no_exact_match";

export type ChatMode = "reply" | "ask" | "recommend";
export type MatchMode = "exact" | "no_exact_match";
export type FollowUpKind = "required" | "optional";
export type QuestionField =
  | "spaceType"
  | "location"
  | "capacity"
  | "budget"
  | "refinement";
export type QuickActionKind =
  | "search_now"
  | "refine_location"
  | "refine_budget"
  | "refine_resources"
  | "refine_capacity";

export interface QuickAction {
  label: string;
  kind: QuickActionKind;
  message?: string;
}

export interface StructuredExtracted {
  tipoEspaco: string | null;
  tipoEvento: string | null;
  cidade: string | null;
  locations: string[];
  excludedLocations: string[];
  quantidadePessoas: number | null;
  recursosDesejados: string[];
  orcamentoMaximo: number | null;
}

export interface AiDecision {
  reply: string;
  intent: AiIntent;
  action: AiAction;
  extracted: StructuredExtracted;
  missingFields: string[];
  confidence: number;
}

export interface ChatIntent {
  tipoEspaco?: string;
  tipoEvento?: string;
  cidade?: string;
  cidadeIncluida?: string;
  locations: string[];
  quantidadePessoas?: number;
  recursosDesejados: string[];
  orcamentoMaximo?: number;
  cidadesExcluidas: string[];
}

export interface ChatRecommendation extends Space {
  matchPercent: number;
  reasons: string[];
}

export interface ChatResponse {
  mode: ChatMode;
  reply: string;
  conversationalIntent: AiIntent;
  action: AiAction;
  intent: ChatIntent;
  conversationSummary: string;
  recommendations: ChatRecommendation[];
  quickActions: QuickAction[];
  followUpKind?: FollowUpKind;
  askedField?: QuestionField;
  confidence: number;
  matchMode?: MatchMode;
  resetContext?: boolean;
}

export interface ChatTurnInput {
  message: string;
  previousSummary: string;
  baseIntent: ChatIntent;
  aiDecision: AiDecision;
  previousAskedField?: QuestionField;
}
