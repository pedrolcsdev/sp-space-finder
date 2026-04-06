import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CalendarCheck2, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { spaceCatalog } from "@/lib/data/spaceCatalog";
import {
  MOCK_AUTH_COOKIE,
  isMockAuthenticatedFromCookieValue,
} from "@/lib/auth/mockAuth";

interface ReserveSpacePageProps {
  params: { id: string };
}

export default async function ReserveSpacePage({ params }: ReserveSpacePageProps) {
  const space = await spaceCatalog.getSpaceById(params.id);

  if (!space) {
    notFound();
  }

  const cookieStore = cookies();
  const authCookie = cookieStore.get(MOCK_AUTH_COOKIE)?.value;
  const isLoggedIn = isMockAuthenticatedFromCookieValue(authCookie);

  if (!isLoggedIn) {
    redirect(`/login?redirect=${encodeURIComponent(`/reservar/${space.id}`)}`);
  }

  return (
    <div className="page-container section-space">
      <Link
        href={`/espacos/${space.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar aos detalhes
      </Link>

      <Card className="mx-auto max-w-2xl space-y-6 p-7">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
            <CalendarCheck2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Reserva iniciada
          </h1>
          <p className="text-sm text-muted-foreground">
            Você já está logado. Seguimos direto com a reserva do espaço{" "}
            <span className="font-medium text-foreground">{space.name}</span>.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm text-foreground">
          Valor de referência: <span className="font-semibold">R$ {space.pricePerHour}/hora</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/encontrar">Buscar mais espaços</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href={`/espacos/${space.id}`}>Ver detalhes novamente</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
