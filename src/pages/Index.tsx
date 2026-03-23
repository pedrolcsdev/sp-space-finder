import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { SpaceCard } from "@/components/SpaceCard";
import { spaces } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const recommended = spaces.filter((s) => s.recommended);
const categorySections = [
  { id: "auditorium", name: "Auditórios" },
  { id: "dental", name: "Salas Odontológicas" },
  { id: "meeting", name: "Salas de Reunião" },
] as const;

export default function Home() {
  return (
    <Layout>
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute left-8 top-20 h-72 w-72 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-6 right-16 h-80 w-80 rounded-full bg-primary-foreground blur-3xl" />
        </div>
        <div className="page-container relative py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <h1 className="mb-6 font-display text-4xl font-bold leading-[1.08] text-primary-foreground sm:text-5xl lg:text-6xl">
              Encontre o espaço
              <br />
              <span className="text-primary-foreground/75">
                perfeito para você
              </span>
            </h1>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-primary-foreground/70 lg:text-lg">
              Auditórios, salas de reunião e consultórios em São Paulo.
              Descubra, compare e reserve com facilidade.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="border-none bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link to="/encontrar">
                  Explorar espaços
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <Link to="/onboarding">Receber recomendações</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommended */}
      <section className="section-space">
        <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground lg:text-4xl">
              Recomendados para você
            </h2>
          </div>
          <Link
            to="/encontrar"
            className="hidden items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover md:inline-flex"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {recommended.map((space, i) => (
            <SpaceCard key={space.id} space={space} index={i} />
          ))}
        </div>

        <Link
          to="/encontrar"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary md:hidden"
        >
          Ver todos <ArrowRight className="w-4 h-4" />
        </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="gradient-subtle section-space">
        <div className="page-container">
          <div className="space-y-12">
            {categorySections.map((category, categoryIndex) => {
              const spacesByCategory = spaces
                .filter((space) => space.category === category.id)
                .slice(0, 3);

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: categoryIndex * 0.08 }}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-2xl font-semibold text-foreground lg:text-3xl">
                      {category.name}
                    </h2>
                    <Link
                      to={`/encontrar?category=${category.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                      Ver mais &gt;
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {spacesByCategory.map((space, i) => (
                      <SpaceCard
                        key={space.id}
                        space={space}
                        index={i}
                        showPricing={false}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
