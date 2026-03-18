import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, Briefcase, MapPin, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    title: "Sobre você",
    subtitle: "Conte-nos um pouco sobre seu perfil",
    fields: [
      { label: "Nome completo", icon: User, placeholder: "João Silva" },
      { label: "E-mail profissional", icon: Briefcase, placeholder: "joao@empresa.com" },
    ],
  },
  {
    title: "Tipo de espaço",
    subtitle: "Que tipo de espaço você mais procura?",
    options: [
      { id: "auditorium", label: "Auditórios", desc: "Para eventos e apresentações" },
      { id: "meeting", label: "Salas de Reunião", desc: "Para reuniões corporativas" },
      { id: "dental", label: "Consultórios", desc: "Espaços para profissionais de saúde" },
    ],
  },
  {
    title: "Localização",
    subtitle: "Qual região de preferência?",
    options: [
      { id: "centro", label: "Centro", desc: "Região central de São Paulo" },
      { id: "paulista", label: "Av. Paulista", desc: "Corredor financeiro" },
      { id: "faria-lima", label: "Faria Lima", desc: "Polo corporativo" },
      { id: "berrini", label: "Berrini", desc: "Região de negócios" },
    ],
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<number, string[]>>({});
  const navigate = useNavigate();
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const toggleOption = (id: string) => {
    const prev = selected[step] || [];
    setSelected({
      ...selected,
      [step]: prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    });
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else navigate("/encontrar");
  };

  return (
    <div className="min-h-screen gradient-subtle flex flex-col">
      {/* Progress */}
      <div className="w-full bg-border h-1">
        <motion.div
          className="h-full bg-primary rounded-r-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">SP Spaces</span>
            </div>
            <p className="text-xs text-muted-foreground">Etapa {step + 1} de {steps.length}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl border border-border/50 card-shadow p-8"
            >
              <h2 className="font-display text-xl font-bold text-foreground mb-1">{current.title}</h2>
              <p className="text-sm text-muted-foreground mb-6">{current.subtitle}</p>

              {current.fields && (
                <div className="space-y-4">
                  {current.fields.map((f) => (
                    <div key={f.label}>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{f.label}</label>
                      <div className="relative">
                        <f.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          placeholder={f.placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {current.options && (
                <div className="space-y-3">
                  {current.options.map((opt) => {
                    const isSelected = (selected[step] || []).includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleOption(opt.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => step > 0 && setStep(step - 1)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    step > 0 ? "text-muted-foreground hover:text-foreground" : "invisible"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={next}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                  {step === steps.length - 1 ? "Concluir" : "Continuar"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
