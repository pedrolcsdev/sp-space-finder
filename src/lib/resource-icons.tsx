import {
  Accessibility,
  Armchair,
  Car,
  Check,
  Coffee,
  Droplets,
  Gauge,
  Mic,
  Monitor,
  PanelsTopLeft,
  Presentation,
  Projector,
  ScanLine,
  ShieldCheck,
  Snowflake,
  Video,
  Volume2,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

function normalizeResource(resource: string) {
  return resource
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getResourceIcon(resource: string): LucideIcon {
  const normalized = normalizeResource(resource);

  if (normalized.includes("wi-fi") || normalized.includes("wifi")) return Wifi;
  if (normalized.includes("ar condicionado")) return Snowflake;
  if (normalized.includes("projetor")) return Projector;
  if (normalized.includes("tv")) return Monitor;
  if (normalized.includes("videoconferencia")) return Video;
  if (normalized.includes("coffee") || normalized.includes("cafe")) return Coffee;
  if (normalized.includes("agua")) return Droplets;
  if (normalized.includes("som")) return Volume2;
  if (normalized.includes("microfone")) return Mic;
  if (normalized.includes("quadro branco")) return Presentation;
  if (normalized.includes("palco")) return PanelsTopLeft;
  if (normalized.includes("acessibilidade")) return Accessibility;
  if (normalized.includes("estacionamento")) return Car;
  if (normalized.includes("cadeira odontologica")) return Armchair;
  if (normalized.includes("raio-x")) return ScanLine;
  if (normalized.includes("autoclave")) return ShieldCheck;
  if (normalized.includes("compressor")) return Gauge;
  if (normalized.includes("fotopolimerizador")) return Zap;

  return Check;
}
