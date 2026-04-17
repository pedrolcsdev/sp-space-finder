"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Briefcase,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/BrandLogo";

const steps = [
  {
    title: "Sobre você",
    subtitle: "Conte-nos um pouco sobre seu perfil",
    fields: [
      { label: "Nome completo", icon: User, placeholder: "João Silva" },
      {
        label: "E-mail profissional",
        icon: Briefcase,
        placeholder: "joao@empresa.com",
      },
    ],
  },
  {
    title: "Tipo de espaço",
    subtitle: "Que tipo de espaço você mais procura?",
    options: [
      {
        id: "auditorium",
        label: "Auditórios",
        desc: "Para eventos e apresentações",
      },
      {
        id: "meeting",
        label: "Salas de Reunião",
        desc: "Para reuniões corporativas",
      },
      {
        id: "dental",
        label: "Consultórios",
        desc: "Espaços para profissionais de saúde",
      },
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

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<number, string[]>>({});
  const router = useRouter();
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
    else router.push("/encontrar");
  };

  return (
    <div className="gradient-subtle flex min-h-screen flex-col">
      <div className="h-1 w-full bg-border">
        <motion.div
          className="h-full rounded-r-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-7 text-center">
            <div className="mb-2 inline-flex">
              <BrandLogo variant="compact" markClassName="h-9 w-9" />
            </div>
            <div>
              <Badge variant="outline" size="sm">
                Etapa {step + 1} de {steps.length}
              </Badge>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <Card size="lg" className="p-7 sm:p-8">
                <h2 className="mb-1 font-display text-2xl font-semibold text-foreground">
                  {current.title}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {current.subtitle}
                </p>

                {current.fields && (
                  <div className="space-y-4">
                    {current.fields.map((f) => (
                      <div key={f.label}>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          {f.label}
                        </label>
                        <div className="relative">
                          <f.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder={f.placeholder}
                            className="pl-10"
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
                          className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary-soft"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-border"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-primary-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {opt.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {opt.desc}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <Button
                    onClick={() => step > 0 && setStep(step - 1)}
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      step > 0 ? "text-muted-foreground hover:text-foreground" : "invisible"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </Button>
                  <Button
                    onClick={next}
                    className="gap-2 px-6"
                  >
                    {step === steps.length - 1 ? "Concluir" : "Continuar"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
