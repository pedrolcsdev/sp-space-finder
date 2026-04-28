"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/data/contracts";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useResolvedSpaces } from "@/hooks/use-mock-store";

const categoryLabels: Record<string, string> = {
  auditorium: "Auditórios",
  dental: "Salas Odontológicas",
  meeting: "Salas de Reunião",
};

interface SearchScreenProps {
  spaces: Space[];
  initialCategory?: string;
}

export default function SearchScreen({
  spaces,
  initialCategory,
}: SearchScreenProps) {
  const resolvedSpaces = useResolvedSpaces(spaces);
  const allResources = useMemo(
    () => Array.from(new Set(resolvedSpaces.flatMap((s) => s.resources))),
    [resolvedSpaces],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [minCapacity, setMinCapacity] = useState(0);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    setSelectedCategories(initialCategory ? [initialCategory] : []);
  }, [initialCategory]);

  const toggle = (
    arr: string[],
    val: string,
    setArr: (v: string[]) => void,
  ) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedResources([]);
    setMinCapacity(0);
    setSearchTerm("");
  };

  const filtered = useMemo(() => {
    return resolvedSpaces.filter((s) => {
      if (
        searchTerm &&
        !s.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      if (selectedCategories.length && !selectedCategories.includes(s.category))
        return false;
      if (minCapacity && s.capacity < minCapacity) return false;
      if (
        selectedResources.length &&
        !selectedResources.every((r) => s.resources.includes(r))
      )
        return false;
      return true;
    });
  }, [searchTerm, selectedCategories, selectedResources, minCapacity, resolvedSpaces]);

  const activeFilterCount =
    selectedCategories.length +
    selectedResources.length +
    (minCapacity > 0 ? 1 : 0);

  const resultHighlights = [
    { label: "Resultados", value: filtered.length.toString() },
    { label: "Categorias", value: "3" },
    { label: "Reserva", value: "Ágil" },
  ];

  const FilterContent = () => (
    <div className="space-y-7">
      <div className="rounded-[24px] border border-border/70 bg-white/85 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
          Categoria
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const selected = selectedCategories.includes(key);
            return (
              <FilterChip
                key={key}
                variant={selected ? "selected" : "default"}
                onClick={() =>
                  toggle(selectedCategories, key, setSelectedCategories)
                }
              >
                {label}
              </FilterChip>
            );
          })}
        </div>
      </div>

      <div className="rounded-[24px] border border-border/70 bg-white/85 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
          Capacidade mínima
        </h3>
        <Input
          type="number"
          min={0}
          value={minCapacity || ""}
          onChange={(e) => setMinCapacity(Number(e.target.value))}
          placeholder="Ex: 10"
          className="bg-secondary"
        />
        <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Pequenos encontros</span>
          <span>Eventos maiores</span>
        </div>
      </div>

      <div className="rounded-[24px] border border-border/70 bg-white/85 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
          Recursos
        </h3>
        <div className="flex flex-wrap gap-2">
          {allResources.map((r) => {
            const selected = selectedResources.includes(r);
            return (
              <FilterChip
                key={r}
                variant={selected ? "selected" : "default"}
                onClick={() => toggle(selectedResources, r, setSelectedResources)}
              >
                {r}
              </FilterChip>
            );
          })}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          Limpar filtros ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="section-space">
      <div className="page-container">
        <div className="mb-6 rounded-3xl border border-white/70 bg-white/86 p-4 shadow-[0_24px_70px_rgb(15_23_42_/_0.08)] backdrop-blur-xl sm:mb-8 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="eyebrow mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  Busca premium
                </span>
                <h1 className="font-display text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                  Encontrar Espaço
                </h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  Compare espaços com uma leitura mais clara de estrutura,
                  capacidade e valor. A busca foi organizada para facilitar
                  decisões rápidas sem perder sofisticação visual.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:w-auto sm:gap-3">
                {resultHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-0 rounded-2xl border border-border/70 bg-secondary/55 px-3 py-3 sm:rounded-[22px] sm:px-4"
                  >
                    <p className="text-lg font-semibold tracking-normal text-foreground sm:text-xl">
                      {item.value}
                    </p>
                    <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-normal text-muted-foreground sm:text-xs">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_0.8fr_auto]">
              <div className="rounded-2xl border border-border/70 bg-white p-3 shadow-sm shadow-slate-950/5 sm:rounded-[24px]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome do espaço"
                    className="border-none bg-secondary pl-11 shadow-none"
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white p-4 sm:rounded-[24px]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Filtros ativos
                </div>
                <p className="mt-2 text-lg font-semibold tracking-normal text-foreground">
                  {activeFilterCount} seleç{activeFilterCount === 1 ? "ão" : "ões"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filtered.length} espaços encontrados com a configuração atual
                </p>
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="h-full min-h-14 w-full rounded-2xl lg:hidden"
                onClick={() => setMobileFilters(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Abrir filtros
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterChip variant="count">{activeFilterCount}</FilterChip>
              {selectedCategories.map((cat) => (
                <FilterChip
                  key={cat}
                  variant="selected"
                  removable
                  onClick={() =>
                    setSelectedCategories(
                      selectedCategories.filter((item) => item !== cat),
                    )
                  }
                >
                  {categoryLabels[cat]}
                </FilterChip>
              ))}
              {selectedResources.slice(0, 4).map((resource) => (
                <FilterChip
                  key={resource}
                  variant="selected"
                  removable
                  onClick={() =>
                    setSelectedResources(
                      selectedResources.filter((item) => item !== resource),
                    )
                  }
                >
                  {resource}
                </FilterChip>
              ))}
              {minCapacity > 0 && (
                <FilterChip
                  variant="selected"
                  removable
                  onClick={() => setMinCapacity(0)}
                >
                  {minCapacity}+ pessoas
                </FilterChip>
              )}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  className="rounded-full px-4 text-sm"
                  onClick={clearFilters}
                >
                  Limpar tudo
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 gap-8">
          <aside className="hidden w-[310px] flex-shrink-0 lg:block">
            <div className="sticky top-28 rounded-[30px] border border-white/65 bg-white/82 p-5 shadow-[0_20px_60px_rgb(15_23_42_/_0.08)] backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <Filter className="h-4 w-4" /> Filtros
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Refine a seleção sem perder contexto visual.
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                    {activeFilterCount} ativos
                  </span>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
              {filtered.map((space, i) => (
                <SpaceCard key={space.id} space={space} index={i} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-white/65 px-5 py-12 text-center shadow-sm shadow-slate-950/5 sm:px-6 sm:py-16">
                <p className="text-xl font-semibold tracking-normal text-foreground">
                  Nenhum espaço encontrado com esses filtros.
                </p>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                  Ajuste os critérios para ampliar a busca e visualizar outras
                  combinações de categoria, capacidade e recursos.
                </p>
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                  className="mt-6 rounded-full px-5"
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={mobileFilters} onOpenChange={setMobileFilters}>
        <SheetContent
          side="bottom"
          className="h-[85dvh] overflow-y-auto rounded-t-3xl border-white/60 bg-background/98 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5"
        >
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="font-display">Filtros</SheetTitle>
          </SheetHeader>
          <FilterContent />
        </SheetContent>
      </Sheet>
    </div>
  );
}
