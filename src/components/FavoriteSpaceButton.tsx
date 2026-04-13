"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMockStore } from "@/hooks/use-mock-store";
import { getFavoriteSpaceIds, toggleFavoriteSpace } from "@/lib/mock/mockStore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface FavoriteSpaceButtonProps {
  spaceId: string;
  className?: string;
}

export function FavoriteSpaceButton({
  spaceId,
  className,
}: FavoriteSpaceButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const store = useMockStore();
  const userId = session?.user.id;
  const isFavorite = userId
    ? getFavoriteSpaceIds(userId, store).includes(spaceId)
    : false;

  const handleToggleFavorite = () => {
    if (!session || session.user.role !== "user") {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/encontrar")}`);
      return;
    }

    const favorites = toggleFavoriteSpace(session.user.id, spaceId);
    const nowFavorite = favorites.includes(spaceId);

    toast({
      title: nowFavorite ? "Espaco favoritado" : "Favorito removido",
      description: nowFavorite
        ? "O espaço foi salvo na sua lista de favoritos."
        : "O espaço saiu da sua lista de favoritos.",
    });
  };

  return (
    <Button
      type="button"
      variant={isFavorite ? "default" : "secondary"}
      className={cn("rounded-full px-4", className)}
      onClick={handleToggleFavorite}
    >
      <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
      {isFavorite ? "Favoritado" : "Favoritar"}
    </Button>
  );
}
