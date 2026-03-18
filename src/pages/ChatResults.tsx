import { Layout } from "@/components/Layout";
import { SpaceCard } from "@/components/SpaceCard";
import { spaces } from "@/data/mockData";
import { Bot, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const chatResults = spaces.slice(0, 5).map((s, i) => ({
  ...s,
  matchPercentage: [96, 91, 87, 82, 74][i],
}));

export default function ChatResults() {
  return (
    <Layout>
      <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Resultados do Assistente</h1>
              <p className="text-sm text-muted-foreground">Espaços ordenados por relevância</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatResults.map((space, i) => (
            <SpaceCard key={space.id} space={space} index={i} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
