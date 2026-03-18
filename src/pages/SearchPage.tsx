import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { SpaceCard } from "@/components/SpaceCard";
import { spaces } from "@/data/mockData";

const categoryLabels: Record<string, string> = {
  auditorium: "Auditórios",
  dental: "Salas Odontológicas",
  meeting: "Salas de Reunião",
};

const allResources = Array.from(new Set(spaces.flatMap((s) => s.resources)));

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("category");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCat ? [initialCat] : [],
  );
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [minCapacity, setMinCapacity] = useState(0);
  const [mobileFilters, setMobileFilters] = useState(false);

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
  }, [searchTerm, selectedCategories, selectedResources, minCapacity]);

  const activeFilterCount =
    selectedCategories.length +
    selectedResources.length +
    (minCapacity > 0 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">
          Categoria
        </h3>
        <div className="space-y-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  selectedCategories.includes(key)
                    ? "bg-primary border-primary"
                    : "border-border group-hover:border-primary/50"
                }`}
              >
                {selectedCategories.includes(key) && (
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-foreground">{label}</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedCategories.includes(key)}
                onChange={() =>
                  toggle(selectedCategories, key, setSelectedCategories)
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">
          Capacidade mínima
        </h3>
        <input
          type="number"
          min={0}
          value={minCapacity || ""}
          onChange={(e) => setMinCapacity(Number(e.target.value))}
          placeholder="Ex: 10"
          className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Resources */}
      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">
          Recursos
        </h3>
        <div className="flex flex-wrap gap-2">
          {allResources.map((r) => (
            <button
              key={r}
              onClick={() => toggle(selectedResources, r, setSelectedResources)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                selectedResources.includes(r)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors"
        >
          Limpar filtros ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Encontrar Espaço
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} espaços encontrados
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar espaço..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => setMobileFilters(true)}
              className="lg:hidden p-2.5 rounded-xl border border-border hover:bg-muted transition-colors relative"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-card rounded-2xl border border-border/50 p-6 card-shadow">
              <h2 className="font-display font-bold text-foreground mb-6 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filtros
              </h2>
              <FilterContent />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((space, i) => (
                <SpaceCard key={space.id} space={space} index={i} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  Nenhum espaço encontrado com esses filtros.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-medium text-primary hover:text-primary-hover"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {mobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFilters(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 h-full w-80 bg-card p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-foreground">
                  Filtros
                </h2>
                <button
                  onClick={() => setMobileFilters(false)}
                  className="p-1.5 rounded-lg hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
