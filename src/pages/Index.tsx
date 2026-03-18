import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { SpaceCard } from "@/components/SpaceCard";
import { spaces } from "@/data/mockData";

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
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 lg:px-8 py-24 lg:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-sm text-primary-foreground/80 mb-6">
              <Sparkles className="w-4 h-4" />
              Grupo São Paulo Participações
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-extrabold text-primary-foreground leading-[1.1] mb-6">
              Encontre o espaço
              <br />
              <span className="text-primary-foreground/70">perfeito para você</span>
            </h1>
            <p className="text-lg text-primary-foreground/60 max-w-lg mb-8 leading-relaxed">
              Auditórios, salas de reunião e consultórios em São Paulo. Descubra, compare e reserve com facilidade.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/encontrar"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary-foreground text-primary font-semibold text-sm hover:bg-primary-foreground/90 transition-colors"
              >
                Explorar espaços
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground font-semibold text-sm hover:bg-primary-foreground/20 transition-colors"
              >
                Receber recomendações
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommended */}
      <section className="container mx-auto px-4 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Curadoria SP Spaces</p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
              Recomendados para você
            </h2>
          </div>
          <Link
            to="/encontrar"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommended.map((space, i) => (
            <SpaceCard key={space.id} space={space} index={i} />
          ))}
        </div>

        <Link
          to="/encontrar"
          className="md:hidden mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          Ver todos <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Categories */}
      <section className="gradient-subtle py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="space-y-14">
            {categorySections.map((category, categoryIndex) => {
              const spacesByCategory = spaces.filter((space) => space.category === category.id).slice(0, 3);

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: categoryIndex * 0.08 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">{category.name}</h2>
                    <Link
                      to={`/encontrar?category=${category.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                    >
                      Ver mais &gt;
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spacesByCategory.map((space, i) => (
                      <SpaceCard key={space.id} space={space} index={i} showPricing={false} />
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
