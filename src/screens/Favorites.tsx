"use client";

import { Heart } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { Card } from "@/components/ui/card";
import { SpaceCard } from "@/components/SpaceCard";
import { useAuth } from "@/hooks/use-auth";
import { useMockStore, useResolvedSpaces } from "@/hooks/use-mock-store";
import { getFavoriteSpaceIds } from "@/lib/mock/mockStore";
import type { Space } from "@/lib/data/contracts";

interface FavoritesScreenProps {
  spaces: Space[];
}

export default function FavoritesScreen({ spaces }: FavoritesScreenProps) {
  const { session, isReady } = useAuth();
  const store = useMockStore();
  const resolvedSpaces = useResolvedSpaces(spaces);

  if (!isReady || !session) {
    return null;
  }

  const favoriteIds = getFavoriteSpaceIds(session.user.id, store);
  const favoriteSpaces = resolvedSpaces.filter((space) => favoriteIds.includes(space.id));

  return (
    <AccountShell
      title="Espaços favoritos"
      description="Acesse rapidamente os espaços salvos e retome sua análise quando quiser."
      currentPath="/favoritos"
    >
      {favoriteSpaces.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          {favoriteSpaces.map((space, index) => (
            <SpaceCard key={space.id} space={space} index={index} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-3 p-6 text-center sm:p-10">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Heart className="h-5 w-5" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Nenhum favorito salvo
          </h2>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            Favorite espaços pelos detalhes para montar sua seleção personalizada.
          </p>
        </Card>
      )}
    </AccountShell>
  );
}
