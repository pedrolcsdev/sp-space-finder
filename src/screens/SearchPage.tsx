"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SpaceCard } from "@/components/SpaceCard";
import type { Space } from "@/lib/data/contracts";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
  const allResources = useMemo(
    () => Array.from(new Set(spaces.flatMap((s) => s.resources))),
    [spaces],
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
    return spaces.filter((s) => {
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
  }, [searchTerm, selectedCategories, selectedResources, minCapacity, spaces]);

  const activeFilterCount =
    selectedCategories.length +
    selectedResources.length +
    (minCapacity > 0 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
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

      <div>
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
      </div>

      <div>
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
          variant="ghost"
          onClick={clearFilters}
          className="w-full border border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          Limpar filtros ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="page-container section-space">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Encontrar Espaço
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} espaços encontrados
          </p>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar espaço..."
              className="bg-card pl-10"
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileFilters(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
        <FilterChip variant="count">{activeFilterCount}</FilterChip>
        {selectedCategories.map((cat) => (
          <FilterChip
            key={cat}
            variant="selected"
            removable
            onClick={() =>
              setSelectedCategories(selectedCategories.filter((item) => item !== cat))
            }
          >
            {categoryLabels[cat]}
          </FilterChip>
        ))}
        {selectedResources.slice(0, 3).map((resource) => (
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
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-72 flex-shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6 card-shadow">
            <h2 className="mb-6 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </h2>
            <FilterContent />
          </div>
        </aside>

        <div className="flex-1">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((space, i) => (
              <SpaceCard key={space.id} space={space} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                Nenhum espaço encontrado com esses filtros.
              </p>
              <Button
                variant="link"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      <Sheet open={mobileFilters} onOpenChange={setMobileFilters}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl p-5">
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="font-display">Filtros</SheetTitle>
          </SheetHeader>
          <FilterContent />
        </SheetContent>
      </Sheet>
    </div>
  );
}

