import { categories, chatFlow, spaces } from "@/data/mockData";
import type { Category, ChatFlowStep, Space } from "@/lib/data/contracts";

interface SpaceCatalog {
  listSpaces: () => Promise<Space[]>;
  getSpaceById: (id: string) => Promise<Space | null>;
  listCategories: () => Promise<Category[]>;
  listChatFlow: () => Promise<ChatFlowStep[]>;
}

const cloneSpaces = (items: Space[]): Space[] =>
  items.map((space) => ({
    ...space,
    resources: [...space.resources],
    images: space.images ? [...space.images] : undefined,
    usageRules: space.usageRules ? [...space.usageRules] : undefined,
  }));

const cloneCategories = (items: Category[]): Category[] => items.map((item) => ({ ...item }));

const cloneChatFlow = (items: ChatFlowStep[]): ChatFlowStep[] =>
  items.map((step) => ({ ...step, options: step.options ? [...step.options] : undefined }));

const asAsync = <T,>(value: T): Promise<T> => Promise.resolve(value);

export const spaceCatalog: SpaceCatalog = {
  async listSpaces() {
    return asAsync(cloneSpaces(spaces));
  },
  async getSpaceById(id: string) {
    const allSpaces = cloneSpaces(spaces);
    const found = allSpaces.find((space) => space.id === id);

    return asAsync(found ?? null);
  },
  async listCategories() {
    return asAsync(cloneCategories(categories));
  },
  async listChatFlow() {
    return asAsync(cloneChatFlow(chatFlow));
  },
};
