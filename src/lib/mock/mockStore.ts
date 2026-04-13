import type { Space } from "@/lib/data/contracts";
import type { MockUser } from "@/lib/auth/mockAuth";

export type ReservationStatus = "cancelado" | "pendente" | "reservado";
export type ReservationKind = "single" | "package";

export interface MockReservation {
  id: string;
  code: string;
  userId: string;
  fullName: string;
  address: string;
  phone: string;
  email: string;
  status: ReservationStatus;
  kind: ReservationKind;
  createdAt: string;
  scheduleLabel: string;
  notes?: string;
  spaceId: string;
  spaceName: string;
  spaceLocation: string;
  spacePricePerHour: number;
}

export interface EditableSpaceDraft {
  name: string;
  description: string;
  pricePerHour: number;
  resources: string[];
  images: string[];
}

export interface MockReviewSummary {
  id: string;
  author: string;
  spaceId: string;
  spaceName: string;
  rating: number;
  status: "Publicado" | "Moderacao" | "Respondido";
  summary: string;
}

export interface MockStoreState {
  favoritesByUserId: Record<string, string[]>;
  reservations: MockReservation[];
  editedSpacesById: Record<string, EditableSpaceDraft>;
  reviewSummaries: MockReviewSummary[];
}

export interface CreateReservationInput {
  user: MockUser;
  space: Space;
  scheduleLabel: string;
  kind: ReservationKind;
  notes?: string;
}

export interface UseOfSpaceMetric {
  spaceId: string;
  spaceName: string;
  totalReservations: number;
  occupancyRate: number;
}

export interface ReservationStatusMetric {
  status: ReservationStatus;
  total: number;
}

const MOCK_STORE_KEY = "sp_spaces_store";
const MOCK_STORE_EVENT = "spspaces:store-changed";

const INITIAL_RESERVATIONS: MockReservation[] = [
  {
    id: "reservation-seed-1",
    code: "SPS-240101",
    userId: "user-cliente",
    fullName: "Marina Oliveira",
    address: "Rua Haddock Lobo, 412 - Jardim Paulista, Sao Paulo",
    phone: "(11) 99876-5432",
    email: "cliente@gmail.com",
    status: "reservado",
    kind: "single",
    createdAt: "2026-03-28T14:30:00.000Z",
    scheduleLabel: "12/04/2026 as 09:00",
    notes: "Reuniao com equipe de vendas e apoio de cafe.",
    spaceId: "2",
    spaceName: "Sala Executiva Alpha",
    spaceLocation: "Rua Augusta, 500 - Sao Paulo",
    spacePricePerHour: 120,
  },
  {
    id: "reservation-seed-2",
    code: "SPS-240102",
    userId: "user-cliente",
    fullName: "Marina Oliveira",
    address: "Rua Haddock Lobo, 412 - Jardim Paulista, Sao Paulo",
    phone: "(11) 99876-5432",
    email: "cliente@gmail.com",
    status: "pendente",
    kind: "package",
    createdAt: "2026-04-02T09:15:00.000Z",
    scheduleLabel: "Pacote semanal com 4 ocorrencias",
    notes: "Treinamento de onboarding comercial.",
    spaceId: "7",
    spaceName: "Sala Board Room",
    spaceLocation: "Av. Berrini, 1500 - Sao Paulo",
    spacePricePerHour: 200,
  },
  {
    id: "reservation-seed-3",
    code: "SPS-240103",
    userId: "user-cliente",
    fullName: "Marina Oliveira",
    address: "Rua Haddock Lobo, 412 - Jardim Paulista, Sao Paulo",
    phone: "(11) 99876-5432",
    email: "cliente@gmail.com",
    status: "cancelado",
    kind: "single",
    createdAt: "2026-03-20T11:00:00.000Z",
    scheduleLabel: "05/04/2026 as 14:00",
    notes: "Cliente pediu cancelamento.",
    spaceId: "4",
    spaceName: "Auditorio Jardins",
    spaceLocation: "Al. Santos, 800 - Sao Paulo",
    spacePricePerHour: 280,
  },
];

const INITIAL_FAVORITES_BY_USER: Record<string, string[]> = {
  "user-cliente": ["1", "5", "11"],
};

const INITIAL_REVIEW_SUMMARIES: MockReviewSummary[] = [
  {
    id: "review-1",
    author: "Renata Lima",
    spaceId: "1",
    spaceName: "Auditorio Premium Central",
    rating: 5,
    status: "Respondido",
    summary: "Excelente estrutura para apresentacoes e recepcao muito bem avaliada.",
  },
  {
    id: "review-2",
    author: "Felipe Rocha",
    spaceId: "7",
    spaceName: "Sala Board Room",
    rating: 4,
    status: "Publicado",
    summary: "Boa experiencia para reunioes executivas, com audiovisual consistente.",
  },
  {
    id: "review-3",
    author: "Ana Paula Costa",
    spaceId: "13",
    spaceName: "Consultorio Odonto Meireles",
    rating: 4,
    status: "Moderacao",
    summary: "Ambiente moderno e atendimento agil na confirmacao.",
  },
];

const isBrowser = () => typeof window !== "undefined";
let mockStoreCache: MockStoreState | null = null;

const cloneStore = (store: MockStoreState): MockStoreState => ({
  favoritesByUserId: Object.fromEntries(
    Object.entries(store.favoritesByUserId).map(([userId, favorites]) => [
      userId,
      [...favorites],
    ]),
  ),
  reservations: store.reservations.map((reservation) => ({ ...reservation })),
  editedSpacesById: Object.fromEntries(
    Object.entries(store.editedSpacesById).map(([spaceId, draft]) => [
      spaceId,
      {
        ...draft,
        resources: [...draft.resources],
        images: [...draft.images],
      },
    ]),
  ),
  reviewSummaries: store.reviewSummaries.map((review) => ({ ...review })),
});

const notifyStoreChange = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(MOCK_STORE_EVENT));
};

const createDefaultStore = (): MockStoreState => ({
  favoritesByUserId: { ...INITIAL_FAVORITES_BY_USER },
  reservations: INITIAL_RESERVATIONS.map((reservation) => ({ ...reservation })),
  editedSpacesById: {},
  reviewSummaries: INITIAL_REVIEW_SUMMARIES.map((review) => ({ ...review })),
});

const parseStore = (value: string | null): MockStoreState | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as MockStoreState;

    return {
      favoritesByUserId: parsed.favoritesByUserId ?? {},
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
      editedSpacesById: parsed.editedSpacesById ?? {},
      reviewSummaries: Array.isArray(parsed.reviewSummaries)
        ? parsed.reviewSummaries
        : [],
    };
  } catch {
    return null;
  }
};

const DEFAULT_MOCK_STORE = createDefaultStore();

export const getDefaultMockStore = () => DEFAULT_MOCK_STORE;

export function getStoredMockStore() {
  if (!isBrowser()) {
    return DEFAULT_MOCK_STORE;
  }

  if (mockStoreCache) {
    return mockStoreCache;
  }

  const stored = parseStore(window.localStorage.getItem(MOCK_STORE_KEY));

  if (stored) {
    mockStoreCache = stored;
    return mockStoreCache;
  }

  mockStoreCache = cloneStore(DEFAULT_MOCK_STORE);
  window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(mockStoreCache));
  return mockStoreCache;
}

export function persistMockStore(nextStore: MockStoreState) {
  if (!isBrowser()) {
    return;
  }

  mockStoreCache = nextStore;
  window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(nextStore));
  notifyStoreChange();
}

const updateStore = (updater: (current: MockStoreState) => MockStoreState) => {
  const current = getStoredMockStore();
  const next = updater(current);
  persistMockStore(next);
  return next;
};

const buildReservationId = () =>
  globalThis.crypto?.randomUUID?.() ?? `reservation-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function subscribeToMockStore(listener: () => void) {
  if (!isBrowser()) {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === MOCK_STORE_KEY) {
      mockStoreCache = parseStore(event.newValue) ?? cloneStore(DEFAULT_MOCK_STORE);
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(MOCK_STORE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(MOCK_STORE_EVENT, listener);
  };
}

const buildReservationCode = () =>
  `SPS-${Math.random().toString().slice(2, 8)}`;

export function createMockReservation(input: CreateReservationInput) {
  const reservation: MockReservation = {
    id: buildReservationId(),
    code: buildReservationCode(),
    userId: input.user.id,
    fullName: input.user.fullName,
    address: input.user.address,
    phone: input.user.phone,
    email: input.user.email,
    status: "pendente",
    kind: input.kind,
    createdAt: new Date().toISOString(),
    scheduleLabel: input.scheduleLabel,
    notes: input.notes?.trim() || undefined,
    spaceId: input.space.id,
    spaceName: input.space.name,
    spaceLocation: input.space.location,
    spacePricePerHour: input.space.pricePerHour,
  };

  updateStore((current) => ({
    ...current,
    reservations: [reservation, ...current.reservations],
  }));

  return reservation;
}

export function updateMockReservationStatus(
  reservationId: string,
  status: ReservationStatus,
) {
  let updatedReservation: MockReservation | null = null;

  updateStore((current) => ({
    ...current,
    reservations: current.reservations.map((reservation) => {
      if (reservation.id !== reservationId) {
        return reservation;
      }

      updatedReservation = { ...reservation, status };
      return updatedReservation;
    }),
  }));

  return updatedReservation;
}

export function toggleFavoriteSpace(userId: string, spaceId: string) {
  let favorites: string[] = [];

  updateStore((current) => {
    const currentFavorites = current.favoritesByUserId[userId] ?? [];
    const nextFavorites = currentFavorites.includes(spaceId)
      ? currentFavorites.filter((favoriteId) => favoriteId !== spaceId)
      : [...currentFavorites, spaceId];

    favorites = nextFavorites;

    return {
      ...current,
      favoritesByUserId: {
        ...current.favoritesByUserId,
        [userId]: nextFavorites,
      },
    };
  });

  return favorites;
}

export function updateEditableSpace(spaceId: string, patch: EditableSpaceDraft) {
  updateStore((current) => ({
    ...current,
    editedSpacesById: {
      ...current.editedSpacesById,
      [spaceId]: patch,
    },
  }));
}

export function applyEditedSpaces(baseSpaces: Space[], store = getStoredMockStore()) {
  return baseSpaces.map((space) => {
    const override = store.editedSpacesById[space.id];

    if (!override) {
      return space;
    }

    return {
      ...space,
      name: override.name,
      description: override.description,
      pricePerHour: override.pricePerHour,
      resources: [...override.resources],
      images: override.images.length > 0 ? [...override.images] : space.images,
      image: override.images[0] ?? space.image,
    };
  });
}

export function applyEditedSpace(baseSpace: Space, store = getStoredMockStore()) {
  return applyEditedSpaces([baseSpace], store)[0];
}

export function getUserReservations(userId: string, store = getStoredMockStore()) {
  return store.reservations.filter((reservation) => reservation.userId === userId);
}

export function getFavoriteSpaceIds(userId: string, store = getStoredMockStore()) {
  return store.favoritesByUserId[userId] ?? [];
}

export function getReservationStatusMetrics(
  store = getStoredMockStore(),
): ReservationStatusMetric[] {
  return (["pendente", "reservado", "cancelado"] as ReservationStatus[]).map((status) => ({
    status,
    total: store.reservations.filter((reservation) => reservation.status === status).length,
  }));
}

export function getUseOfSpaceMetrics(
  spaces: Space[],
  store = getStoredMockStore(),
): UseOfSpaceMetric[] {
  return spaces.map((space) => {
    const reservations = store.reservations.filter(
      (reservation) => reservation.spaceId === space.id,
    );

    const occupancyRate = Math.min(96, 34 + reservations.length * 11);

    return {
      spaceId: space.id,
      spaceName: space.name,
      totalReservations: reservations.length,
      occupancyRate,
    };
  });
}
