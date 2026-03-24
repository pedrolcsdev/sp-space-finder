export type SpaceCategory = "auditorium" | "dental" | "meeting";

export interface Space {
  id: string;
  name: string;
  category: SpaceCategory;
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

export interface ChatFlowStep {
  type: "bot" | "user";
  text: string;
  options?: string[];
}
