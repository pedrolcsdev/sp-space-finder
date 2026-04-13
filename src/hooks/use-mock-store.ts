"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  applyEditedSpace,
  applyEditedSpaces,
  getDefaultMockStore,
  getStoredMockStore,
  subscribeToMockStore,
  type MockStoreState,
} from "@/lib/mock/mockStore";
import type { Space } from "@/lib/data/contracts";

export function useMockStore() {
  return useSyncExternalStore(
    subscribeToMockStore,
    getStoredMockStore,
    getDefaultMockStore,
  ) as MockStoreState;
}

export function useResolvedSpaces(baseSpaces: Space[]) {
  const store = useMockStore();
  return useMemo(() => applyEditedSpaces(baseSpaces, store), [baseSpaces, store]);
}

export function useResolvedSpace(baseSpace: Space) {
  const store = useMockStore();
  return useMemo(() => applyEditedSpace(baseSpace, store), [baseSpace, store]);
}
