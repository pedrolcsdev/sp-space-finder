import { categories, chatFlow, spaces } from "@/data/mockData";
import type { Category, ChatFlowStep, Space } from "@/lib/data/contracts";

interface SpaceCatalog {
  listSpaces: () => Promise<Space[]>;
  listCategories: () => Promise<Category[]>;
  listChatFlow: () => Promise<ChatFlowStep[]>;
}

const cloneSpaces = (items: Space[]): Space[] =>
  items.map((space) => ({
    ...space,
    resources: [...space.resources],
  }));

const cloneCategories = (items: Category[]): Category[] => items.map((item) => ({ ...item }));

const cloneChatFlow = (items: ChatFlowStep[]): ChatFlowStep[] =>
  items.map((step) => ({ ...step, options: step.options ? [...step.options] : undefined }));

const asAsync = <T,>(value: T): Promise<T> => Promise.resolve(value);

export const spaceCatalog: SpaceCatalog = {
  async listSpaces() {
    return asAsync(cloneSpaces(spaces));
  },
  async listCategories() {
    return asAsync(cloneCategories(categories));
  },
  async listChatFlow() {
    return asAsync(cloneChatFlow(chatFlow));
  },
};
