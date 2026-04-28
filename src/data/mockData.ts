import type { Category, ChatFlowStep, Space } from "@/lib/data/contracts";

export const categories: Category[] = [
  {
    id: "auditorium",
    name: "Auditórios",
    description: "Espaços amplos para eventos e apresentações",
    icon: "Presentation",
    count: 5,
  },
  {
    id: "dental",
    name: "Salas Odontológicas",
    description: "Consultórios equipados para profissionais",
    icon: "Stethoscope",
    count: 5,
  },
  {
    id: "meeting",
    name: "Salas de Reunião",
    description: "Ambientes modernos para reuniões corporativas",
    icon: "Users",
    count: 5,
  },
];

const defaultRulesByCategory: Record<Space["category"], string[]> = {
  auditorium: [
    "Entrada permitida 30 minutos antes do início da reserva.",
    "É proibido alterar o layout sem autorização prévia.",
    "Eventos com som alto devem respeitar os limites do condomínio.",
  ],
  dental: [
    "Obrigatório seguir protocolos de biossegurança durante todo o uso.",
    "Materiais de consumo devem ser levados pelo profissional.",
    "Ao final da reserva, descarte resíduos em local apropriado.",
  ],
  meeting: [
    "Respeitar horário de início e término para evitar cobranças extras.",
    "Não é permitido fixar objetos em paredes e mobiliário.",
    "Manter o ambiente organizado e silencioso nas áreas comuns.",
  ],
};

const extraGalleryByCategory: Record<Space["category"], string[]> = {
  auditorium: [
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=800&fit=crop",
  ],
  dental: [
    "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1629909615957-be4f8c63a7ea?w=1200&h=800&fit=crop",
  ],
  meeting: [
    "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop",
  ],
};

const baseSpaces: Space[] = [
  {
    id: "1",
    name: "Auditório Renascença Prime",
    category: "auditorium",
    location: "Av. Colares Moreira, 1000 — Renascença, São Luís - MA",
    capacity: 200,
    pricePerHour: 450,
    image:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&h=400&fit=crop",
    resources: ["Projetor 4K", "Som Profissional", "Ar Condicionado", "Wi-Fi"],
    recommended: true,
    description:
      "Espaço moderno com capacidade para grandes eventos corporativos.",
  },
  {
    id: "2",
    name: "Sala Executiva Ponta d'Areia",
    category: "meeting",
    location: "Av. dos Holandeses, 500 — Ponta d'Areia, São Luís - MA",
    capacity: 12,
    pricePerHour: 120,
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    resources: ['TV 65"', "Videoconferência", "Wi-Fi", "Café"],
    recommended: true,
    description: "Sala executiva com equipamentos de última geração.",
  },
  {
    id: "3",
    name: "Consultório Odonto Renascença",
    category: "dental",
    location: "Rua das Andirobas, 300 — Jardim Renascença, São Luís - MA",
    capacity: 3,
    pricePerHour: 180,
    image:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop",
    resources: [
      "Cadeira Odontológica",
      "Raio-X Digital",
      "Autoclave",
      "Ar Condicionado",
    ],
    recommended: false,
    description: "Consultório completo em localização privilegiada.",
  },
  {
    id: "4",
    name: "Auditório Lagoa Corporate",
    category: "auditorium",
    location: "Av. Maestro João Nunes, 800 — Ponta do Farol, São Luís - MA",
    capacity: 80,
    pricePerHour: 280,
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop",
    resources: ["Projetor", "Microfone", "Wi-Fi", "Coffee Break"],
    recommended: false,
    description: "Auditório acolhedor ideal para workshops e palestras.",
  },
  {
    id: "5",
    name: "Sala de Reunião Calhau Business",
    category: "meeting",
    location: "Av. dos Holandeses, 2000 — Calhau, São Luís - MA",
    capacity: 8,
    pricePerHour: 95,
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=400&fit=crop",
    resources: ['TV 55"', "Wi-Fi", "Quadro Branco", "Ar Condicionado"],
    recommended: true,
    description: "Em uma das regiões corporativas mais valorizadas de São Luís.",
  },
  {
    id: "6",
    name: "Consultório Odonto São Francisco",
    category: "dental",
    location: "Av. Castelo Branco, 150 — São Francisco, São Luís - MA",
    capacity: 3,
    pricePerHour: 160,
    image:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop",
    resources: [
      "Cadeira Odontológica",
      "Compressor",
      "Ar Condicionado",
      "Wi-Fi",
    ],
    recommended: false,
    description: "Espaço prático e funcional para atendimentos.",
  },
  {
    id: "7",
    name: "Sala Board Room Península",
    category: "meeting",
    location: "Av. dos Holandeses, 1500 — Ponta d'Areia, São Luís - MA",
    capacity: 20,
    pricePerHour: 200,
    image:
      "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=600&h=400&fit=crop",
    resources: ["Videoconferência", 'TV 75"', "Wi-Fi", "Café", "Água"],
    recommended: true,
    description: "Sala premium para reuniões de alto nível.",
  },
  {
    id: "8",
    name: "Auditório Península da Ilha",
    category: "auditorium",
    location: "Av. Mário Meireles, 400 — Ponta d'Areia, São Luís - MA",
    capacity: 150,
    pricePerHour: 380,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
    resources: [
      "Projetor 4K",
      "Som Surround",
      "Palco",
      "Wi-Fi",
      "Acessibilidade",
    ],
    recommended: false,
    description: "Auditório espaçoso em uma das áreas mais valorizadas da orla.",
  },
  {
    id: "9",
    name: "Consultório Odonto Cohama Prime",
    category: "dental",
    location: "Av. Daniel de La Touche, 200 — Cohama, São Luís - MA",
    capacity: 4,
    pricePerHour: 200,
    image:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop",
    resources: [
      "Cadeira Odontológica",
      "Raio-X Panorâmico",
      "Autoclave",
      "Wi-Fi",
      "Estacionamento",
    ],
    recommended: true,
    description: "Consultório de alto padrão em uma região valorizada de São Luís.",
  },
  {
    id: "10",
    name: "Auditório Atlântico Holandeses",
    category: "auditorium",
    location: "Av. dos Holandeses, 2200 — Calhau, São Luís - MA",
    capacity: 120,
    pricePerHour: 320,
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=400&fit=crop",
    resources: [
      "Palco",
      "Projetor Full HD",
      "Som Profissional",
      "Wi-Fi",
      "Acessibilidade",
    ],
    recommended: false,
    description:
      "Estrutura completa para eventos corporativos e institucionais.",
  },
  {
    id: "11",
    name: "Auditório Golden Renascença",
    category: "auditorium",
    location: "Rua das Mitras, 1700 — Renascença II, São Luís - MA",
    capacity: 95,
    pricePerHour: 290,
    image:
      "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=600&h=400&fit=crop",
    resources: ["Projetor 4K", "Microfones sem fio", "Wi-Fi", "Coffee Break"],
    recommended: true,
    description: "Ideal para palestras, treinamentos e lançamentos de produto.",
  },
  {
    id: "12",
    name: "Consultório Odonto Ponta do Farol",
    category: "dental",
    location: "Av. dos Holandeses, 980 — Ponta do Farol, São Luís - MA",
    capacity: 3,
    pricePerHour: 170,
    image:
      "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&h=400&fit=crop",
    resources: [
      "Cadeira Odontológica",
      "Fotopolimerizador",
      "Autoclave",
      "Wi-Fi",
    ],
    recommended: false,
    description: "Consultório bem localizado para rotina clínica diária.",
  },
  {
    id: "13",
    name: "Consultório Odonto Quintas do Calhau",
    category: "dental",
    location: "Rua Principal, 1200 — Quintas do Calhau, São Luís - MA",
    capacity: 4,
    pricePerHour: 190,
    image:
      "https://images.unsplash.com/photo-1629909615957-be4f8c63a7ea?w=600&h=400&fit=crop",
    resources: [
      "Raio-X Digital",
      "Cadeira Odontológica",
      "Ar Condicionado",
      "Estacionamento",
    ],
    recommended: true,
    description:
      "Ambiente moderno para procedimentos e atendimentos especializados.",
  },
  {
    id: "14",
    name: "Sala de Reunião Jardim Renascença",
    category: "meeting",
    location: "Rua das Juçaras, 450 — Jardim Renascença, São Luís - MA",
    capacity: 10,
    pricePerHour: 110,
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=400&fit=crop",
    resources: ['TV 60"', "Videoconferência", "Wi-Fi", "Água e Café"],
    recommended: false,
    description:
      "Sala funcional para reuniões de equipe e apresentações rápidas.",
  },
  {
    id: "15",
    name: "Sala de Reunião Holandeses View",
    category: "meeting",
    location: "Av. dos Holandeses, 600 — Calhau, São Luís - MA",
    capacity: 16,
    pricePerHour: 150,
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop",
    resources: ['TV 75"', "Quadro Branco", "Wi-Fi", "Café"],
    recommended: true,
    description:
      "Espaço corporativo para reuniões estratégicas e dinâmicas de time.",
  },
];

export const spaces: Space[] = baseSpaces.map((space) => ({
  ...space,
  images: [space.image, ...extraGalleryByCategory[space.category]],
  usageRules: defaultRulesByCategory[space.category],
  commercialInfo: `Reserva flexível por hora. A partir de R$ ${space.pricePerHour}/hora.`,
}));

export const chatFlow: ChatFlowStep[] = [
  {
    type: "bot" as const,
    text: "Olá! Bom dia, sou o assistente do SP Spaces e vou te ajudar a encontrar o espaço ideal.",
  },
  {
    type: "bot" as const,
    text: "Você tem alguma preferência de localização?",
    options: ["Renascença", "Calhau", "Ponta d'Areia", "Jardim Renascença"],
  },
  {
    type: "bot" as const,
    text: "Quais recursos são essenciais?",
    options: [
      "Wi-Fi",
      "Ar Condicionado",
      "Projetor",
      "Videoconferência",
      "Café",
      "Acessibilidade",
      "Estacionamento",
    ],
  },
  {
    type: "bot" as const,
    text: "Esses são os espaços que mais se adequaram à sua pesquisa.",
  },
];
