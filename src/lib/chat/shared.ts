export const BASE_CITY = "São Luís";

export const cityMatchers = [
  { label: "Jardim Renascença", aliases: ["jardim renascença", "jardim renascenca"] },
  { label: "Renascença II", aliases: ["renascença ii", "renascenca ii"] },
  { label: "Renascença", aliases: ["renascença", "renascenca"] },
  { label: "Quintas do Calhau", aliases: ["quintas do calhau"] },
  { label: "Calhau", aliases: ["calhau"] },
  {
    label: "Ponta d'Areia",
    aliases: ["ponta d'areia", "ponta dareia", "ponta da areia"],
  },
  { label: "Ponta do Farol", aliases: ["ponta do farol"] },
  { label: "São Francisco", aliases: ["são francisco", "sao francisco"] },
  { label: "Cohama", aliases: ["cohama"] },
  { label: BASE_CITY, aliases: ["são luís", "sao luis"] },
] as const;

export const resourceMatchers = [
  { resource: "Wi-Fi", pattern: /wi[\s-]?fi|internet/i },
  { resource: "Ar Condicionado", pattern: /ar condicionado|climatiza/i },
  { resource: "Projetor", pattern: /projetor|apresenta(c|ç)(a|ã)o|tela/i },
  { resource: "Videoconferência", pattern: /videoconfer|videochamada|hibrid|híbrido/i },
  { resource: "Café", pattern: /caf[eé]|coffee break|agua e cafe|água e café/i },
  { resource: "Acessibilidade", pattern: /acessib/i },
  { resource: "Estacionamento", pattern: /estacionamento|vaga/i },
] as const;

export const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase();

export const isBaseCity = (value: string) =>
  normalizeText(value) === normalizeText(BASE_CITY);

export const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));
