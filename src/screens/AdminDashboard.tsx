"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PencilLine,
  Star,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis } from "recharts";
import type { Space } from "@/lib/data/contracts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMockStore, useResolvedSpaces } from "@/hooks/use-mock-store";
import {
  getReservationStatusMetrics,
  getUseOfSpaceMetrics,
  updateEditableSpace,
  updateMockReservationStatus,
} from "@/lib/mock/mockStore";
import { ReservationStatusBadge } from "@/components/ReservationStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface AdminDashboardScreenProps {
  spaces: Space[];
}

const statusOptions = ["pendente", "reservado", "cancelado"] as const;

export default function AdminDashboardScreen({
  spaces,
}: AdminDashboardScreenProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const store = useMockStore();
  const resolvedSpaces = useResolvedSpaces(spaces);
  const useMetrics = useMemo(
    () => getUseOfSpaceMetrics(resolvedSpaces, store),
    [resolvedSpaces, store],
  );
  const statusMetrics = useMemo(
    () => getReservationStatusMetrics(store),
    [store],
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState(resolvedSpaces[0]?.id ?? "");
  const selectedSpace = resolvedSpaces.find((space) => space.id === selectedSpaceId) ?? resolvedSpaces[0];
  const [editForm, setEditForm] = useState(() => ({
    name: resolvedSpaces[0]?.name ?? "",
    description: resolvedSpaces[0]?.description ?? "",
    pricePerHour: resolvedSpaces[0]?.pricePerHour ?? 0,
    resources: resolvedSpaces[0]?.resources.join(", ") ?? "",
    images:
      resolvedSpaces[0]?.images?.join("\n") ??
      (resolvedSpaces[0]?.image ? resolvedSpaces[0].image : ""),
  }));

  const totalReservations = store.reservations.length;
  const occupancyAverage =
    useMetrics.length > 0
      ? Math.round(
          useMetrics.reduce((total, metric) => total + metric.occupancyRate, 0) /
            useMetrics.length,
        )
      : 0;
  const topSpaces = [...useMetrics]
    .sort((left, right) => right.totalReservations - left.totalReservations)
    .slice(0, 4);
  const leastSpaces = [...useMetrics]
    .sort((left, right) => left.totalReservations - right.totalReservations)
    .slice(0, 4);

  const syncEditForm = (spaceId: string) => {
    const space = resolvedSpaces.find((item) => item.id === spaceId);

    if (!space) {
      return;
    }

    setSelectedSpaceId(spaceId);
    setEditForm({
      name: space.name,
      description: space.description,
      pricePerHour: space.pricePerHour,
      resources: space.resources.join(", "),
      images: space.images?.join("\n") ?? space.image,
    });
  };

  const handleSaveSpace = () => {
    if (!selectedSpace) {
      return;
    }

    updateEditableSpace(selectedSpace.id, {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      pricePerHour: Number(editForm.pricePerHour),
      resources: editForm.resources
        .split(",")
        .map((resource) => resource.trim())
        .filter(Boolean),
      images: editForm.images
        .split("\n")
        .map((image) => image.trim())
        .filter(Boolean),
    });

    toast({
      title: "Espaço atualizado",
      description: "As alterações já estão refletidas no catálogo da plataforma.",
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.10),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef4f7_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-white/80 bg-white/86 p-6 shadow-[0_24px_70px_rgb(15_23_42_/_0.08)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Painel administrativo
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                SP Spaces Admin
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Visão executiva para acompanhar uso dos espaços, reservas,
                avaliações e edição operacional do catálogo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="secondary" className="rounded-full">
                <Link href="/">Voltar ao site</Link>
              </Button>
              <Button
                variant="ghost"
                className="rounded-full text-destructive hover:text-destructive"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="h-auto flex-wrap rounded-[22px] bg-white/85 p-2">
            <TabsTrigger value="dashboard" className="rounded-2xl">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="spaces" className="rounded-2xl">
              <PencilLine className="mr-2 h-4 w-4" />
              Espaços
            </TabsTrigger>
            <TabsTrigger value="usage" className="rounded-2xl">
              <BarChart3 className="mr-2 h-4 w-4" />
              Uso de espaços
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-2xl">
              <MessageSquareText className="mr-2 h-4 w-4" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="reservations" className="rounded-2xl">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Reservas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-[26px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Total de reservas
                </p>
                <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                  {totalReservations}
                </p>
              </Card>
              <Card className="rounded-[26px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Taxa média de ocupação
                </p>
                <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                  {occupancyAverage}%
                </p>
              </Card>
              <Card className="rounded-[26px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Mais reservado
                </p>
                <p className="mt-4 text-xl font-semibold text-foreground">
                  {topSpaces[0]?.spaceName ?? "Sem dados"}
                </p>
              </Card>
              <Card className="rounded-[26px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Menor saída
                </p>
                <p className="mt-4 text-xl font-semibold text-foreground">
                  {leastSpaces[0]?.spaceName ?? "Sem dados"}
                </p>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <Card className="rounded-[30px] p-6">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">Reservas por espaço</p>
                  <p className="text-sm text-muted-foreground">
                    Comparativo rápido para apresentação comercial.
                  </p>
                </div>
                <ChartContainer
                  config={{
                    totalReservations: { label: "Reservas", color: "hsl(173 80% 32%)" },
                  }}
                  className="h-[280px] w-full"
                >
                  <BarChart data={topSpaces}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="spaceName"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 12)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="totalReservations" fill="var(--color-totalReservations)" radius={12} />
                  </BarChart>
                </ChartContainer>
              </Card>

              <Card className="rounded-[30px] p-6">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">Status das reservas</p>
                  <p className="text-sm text-muted-foreground">
                    Distribuição atual das solicitações em andamento.
                  </p>
                </div>
                <ChartContainer
                  config={{
                    pendente: { label: "Pendente", color: "#f59e0b" },
                    reservado: { label: "Reservado", color: "#059669" },
                    cancelado: { label: "Cancelado", color: "#ef4444" },
                  }}
                  className="h-[280px] w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                    <Pie
                      data={statusMetrics}
                      dataKey="total"
                      nameKey="status"
                      innerRadius={58}
                    />
                  </PieChart>
                </ChartContainer>
              </Card>
            </div>

            <Card className="rounded-[30px] p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">Reservas recentes</p>
                <p className="text-sm text-muted-foreground">
                  Últimas movimentações para acompanhamento da operação.
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Espaço</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.reservations.slice(0, 5).map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>{reservation.code}</TableCell>
                      <TableCell>{reservation.fullName}</TableCell>
                      <TableCell>{reservation.spaceName}</TableCell>
                      <TableCell>
                        <ReservationStatusBadge status={reservation.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="spaces" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <Card className="rounded-[30px] p-5">
                <p className="text-sm font-semibold text-foreground">Espaços cadastrados</p>
                <div className="mt-4 space-y-2">
                  {resolvedSpaces.map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => syncEditForm(space.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                        selectedSpaceId === space.id
                          ? "border-primary bg-primary-soft"
                          : "border-border/70 bg-secondary/35 hover:bg-secondary/55"
                      }`}
                    >
                      <p className="font-semibold text-foreground">{space.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{space.location}</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[30px] p-6">
                <div className="mb-5">
                  <p className="text-sm font-semibold text-foreground">Editar espaço</p>
                  <p className="text-sm text-muted-foreground">
                    Atualize título, descrição, preço, recursos e fotos do espaço.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="space-name">Título</Label>
                    <Input
                      id="space-name"
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="space-price">Preço por hora</Label>
                    <Input
                      id="space-price"
                      type="number"
                      min={0}
                      value={editForm.pricePerHour}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          pricePerHour: Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagens do espaço</Label>
                    <div className="rounded-xl border border-dashed border-border/80 bg-secondary/25 px-4 py-3 text-sm text-muted-foreground">
                      <ImagePlus className="mb-2 h-4 w-4 text-primary" />
                      Adicione imagens por URL. Cole uma imagem por linha abaixo.
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="space-description">Descrição</Label>
                    <Textarea
                      id="space-description"
                      value={editForm.description}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="space-resources">Recursos</Label>
                    <Textarea
                      id="space-resources"
                      value={editForm.resources}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          resources: event.target.value,
                        }))
                      }
                      placeholder="Separe os recursos por vírgula"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="space-images">Fotos</Label>
                    <Textarea
                      id="space-images"
                      value={editForm.images}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          images: event.target.value,
                        }))
                      }
                      placeholder="Uma URL por linha"
                    />
                  </div>
                </div>
                <div className="mt-5">
                  <Button onClick={handleSaveSpace}>Salvar alterações</Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <Card className="rounded-[30px] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Uso de espaços</p>
                  <p className="text-sm text-muted-foreground">
                    Taxa de ocupação e volume de saída por espaço.
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Espaço</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead>Ocupação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {useMetrics.map((metric) => (
                    <TableRow key={metric.spaceId}>
                      <TableCell>{metric.spaceName}</TableCell>
                      <TableCell>{metric.totalReservations}</TableCell>
                      <TableCell>{metric.occupancyRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="rounded-[30px] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Avaliações</p>
                  <p className="text-sm text-muted-foreground">
                    Área para moderação e resposta de feedbacks dos clientes.
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Autor</TableHead>
                    <TableHead>Espaco</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.reviewSummaries.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.author}</TableCell>
                      <TableCell>{review.spaceName}</TableCell>
                      <TableCell>{review.rating}/5</TableCell>
                      <TableCell>{review.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reservations">
            <Card className="rounded-[30px] p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">Gestão de reservas</p>
                <p className="text-sm text-muted-foreground">
                  Atualize o status e acompanhe o andamento das reservas.
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Espaço</TableHead>
                    <TableHead>Status atual</TableHead>
                    <TableHead>Atualizar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>{reservation.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{reservation.fullName}</p>
                          <p className="text-xs text-muted-foreground">{reservation.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{reservation.spaceName}</TableCell>
                      <TableCell>
                        <ReservationStatusBadge status={reservation.status} />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={reservation.status}
                          onValueChange={(value) => {
                            updateMockReservationStatus(
                              reservation.id,
                              value as (typeof statusOptions)[number],
                            );
                            toast({
                              title: "Status atualizado",
                              description: `${reservation.code} agora está como ${value}.`,
                            });
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
