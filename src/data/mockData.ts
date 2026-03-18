export interface Space {
  id: string;
  name: string;
  category: "auditorium" | "dental" | "meeting";
  location: string;
  capacity: number;
  pricePerHour: number;
  image: string;
  resources: string[];
  recommended?: boolean;
  matchPercentage?: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export const categories: Category[] = [
  { id: "auditorium", name: "Auditórios", description: "Espaços amplos para eventos e apresentações", icon: "Presentation", count: 5 },
  { id: "dental", name: "Salas Odontológicas", description: "Consultórios equipados para profissionais", icon: "Stethoscope", count: 5 },
  { id: "meeting", name: "Salas de Reunião", description: "Ambientes modernos para reuniões corporativas", icon: "Users", count: 5 },
];

export const spaces: Space[] = [
  {
    id: "1",
    name: "Auditório Premium Central",
    category: "auditorium",
    location: "Av. Paulista, 1000 — São Paulo",
    capacity: 200,
    pricePerHour: 450,
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&h=400&fit=crop",
    resources: ["Projetor 4K", "Som Profissional", "Ar Condicionado", "Wi-Fi"],
    recommended: true,
    description: "Espaço moderno com capacidade para grandes eventos corporativos.",
  },
  {
    id: "2",
    name: "Sala Executiva Alpha",
    category: "meeting",
    location: "Rua Augusta, 500 — São Paulo",
    capacity: 12,
    pricePerHour: 120,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    resources: ["TV 65\"", "Videoconferência", "Wi-Fi", "Café"],
    recommended: true,
    description: "Sala executiva com equipamentos de última geração.",
  },
  {
    id: "3",
    name: "Consultório Odonto Prime",
    category: "dental",
    location: "Rua Oscar Freire, 300 — São Paulo",
    capacity: 3,
    pricePerHour: 180,
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop",
    resources: ["Cadeira Odontológica", "Raio-X Digital", "Autoclave", "Ar Condicionado"],
    recommended: false,
    description: "Consultório completo em localização privilegiada.",
  },
  {
    id: "4",
    name: "Auditório Jardins",
    category: "auditorium",
    location: "Al. Santos, 800 — São Paulo",
    capacity: 80,
    pricePerHour: 280,
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop",
    resources: ["Projetor", "Microfone", "Wi-Fi", "Coffee Break"],
    recommended: false,
    description: "Auditório acolhedor ideal para workshops e palestras.",
  },
  {
    id: "5",
    name: "Sala de Reunião Faria Lima",
    category: "meeting",
    location: "Av. Faria Lima, 2000 — São Paulo",
    capacity: 8,
    pricePerHour: 95,
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=400&fit=crop",
    resources: ["TV 55\"", "Wi-Fi", "Quadro Branco", "Ar Condicionado"],
    recommended: true,
    description: "No coração financeiro de São Paulo.",
  },
  {
    id: "6",
    name: "Consultório Odonto Vila Nova",
    category: "dental",
    location: "Rua Funchal, 150 — São Paulo",
    capacity: 3,
    pricePerHour: 160,
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop",
    resources: ["Cadeira Odontológica", "Compressor", "Ar Condicionado", "Wi-Fi"],
    recommended: false,
    description: "Espaço prático e funcional para atendimentos.",
  },
  {
    id: "7",
    name: "Sala Board Room",
    category: "meeting",
    location: "Av. Berrini, 1500 — São Paulo",
    capacity: 20,
    pricePerHour: 200,
    image: "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=600&h=400&fit=crop",
    resources: ["Videoconferência", "TV 75\"", "Wi-Fi", "Café", "Água"],
    recommended: true,
    description: "Sala premium para reuniões de alto nível.",
  },
  {
    id: "8",
    name: "Auditório Ibirapuera",
    category: "auditorium",
    location: "Av. República do Líbano, 400 — São Paulo",
    capacity: 150,
    pricePerHour: 380,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
    resources: ["Projetor 4K", "Som Surround", "Palco", "Wi-Fi", "Acessibilidade"],
    recommended: false,
    description: "Auditório espaçoso próximo ao parque.",
  },
  {
    id: "9",
    name: "Consultório Odonto Higienópolis",
    category: "dental",
    location: "Rua Maranhão, 200 — São Paulo",
    capacity: 4,
    pricePerHour: 200,
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop",
    resources: ["Cadeira Odontológica", "Raio-X Panorâmico", "Autoclave", "Wi-Fi", "Estacionamento"],
    recommended: true,
    description: "Consultório de alto padrão em bairro nobre.",
  },
  {
    id: "10",
    name: "Auditório Atlântico São Luís",
    category: "auditorium",
    location: "Av. dos Holandeses, 2200 — São Luís",
    capacity: 120,
    pricePerHour: 320,
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=400&fit=crop",
    resources: ["Palco", "Projetor Full HD", "Som Profissional", "Wi-Fi", "Acessibilidade"],
    recommended: false,
    description: "Estrutura completa para eventos corporativos e institucionais.",
  },
  {
    id: "11",
    name: "Auditório Beira Mar Fortaleza",
    category: "auditorium",
    location: "Av. Beira Mar, 1700 — Fortaleza",
    capacity: 95,
    pricePerHour: 290,
    image: "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=600&h=400&fit=crop",
    resources: ["Projetor 4K", "Microfones sem fio", "Wi-Fi", "Coffee Break"],
    recommended: true,
    description: "Ideal para palestras, treinamentos e lançamentos de produto.",
  },
  {
    id: "12",
    name: "Consultório Odonto Batista Campos",
    category: "dental",
    location: "Av. Conselheiro Furtado, 980 — Belém",
    capacity: 3,
    pricePerHour: 170,
    image: "https://images.unsplash.com/photo-1640876770763-9f9b7be0f8b7?w=600&h=400&fit=crop",
    resources: ["Cadeira Odontológica", "Fotopolimerizador", "Autoclave", "Wi-Fi"],
    recommended: false,
    description: "Consultório bem localizado para rotina clínica diária.",
  },
  {
    id: "13",
    name: "Consultório Odonto Meireles",
    category: "dental",
    location: "Rua Barbosa de Freitas, 1200 — Fortaleza",
    capacity: 4,
    pricePerHour: 190,
    image: "https://images.unsplash.com/photo-1626726493136-47fd13f6a0de?w=600&h=400&fit=crop",
    resources: ["Raio-X Digital", "Cadeira Odontológica", "Ar Condicionado", "Estacionamento"],
    recommended: true,
    description: "Ambiente moderno para procedimentos e atendimentos especializados.",
  },
  {
    id: "14",
    name: "Sala de Reunião Doca",
    category: "meeting",
    location: "Av. Visconde de Souza Franco, 450 — Belém",
    capacity: 10,
    pricePerHour: 110,
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=400&fit=crop",
    resources: ["TV 60\"", "Videoconferência", "Wi-Fi", "Água e Café"],
    recommended: false,
    description: "Sala funcional para reuniões de equipe e apresentações rápidas.",
  },
  {
    id: "15",
    name: "Sala de Reunião Praia de Iracema",
    category: "meeting",
    location: "Av. Historiador Raimundo Girão, 600 — Fortaleza",
    capacity: 16,
    pricePerHour: 150,
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop",
    resources: ["TV 75\"", "Quadro Branco", "Wi-Fi", "Café"],
    recommended: true,
    description: "Espaço corporativo para reuniões estratégicas e dinâmicas de time.",
  },
];

export const chatFlow = [
  { type: "bot" as const, text: "Olá! 👋 Sou o assistente do SP Spaces. Vou te ajudar a encontrar o espaço ideal." },
  { type: "bot" as const, text: "Para quantas pessoas você precisa do espaço?", options: ["Até 5", "5 a 20", "20 a 50", "Mais de 50"] },
  { type: "bot" as const, text: "Quais recursos são essenciais?", options: ["Projetor", "Videoconferência", "Wi-Fi", "Ar Condicionado", "Café"] },
  { type: "bot" as const, text: "Perfeito! 🔍 Estou buscando os melhores espaços para você..." },
];
