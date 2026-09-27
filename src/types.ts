export type AnimalStatus = "active" | "sold";
export type ActivityType = "feed" | "weight" | "vaccine" | "deworming" | "treatment";
export type TargetType = "animal" | "lot";

export interface RanchProfile {
  ranchName: string;
  ownerName: string;
  currency: "COP";
  weightUnit: "kg";
}

export interface Lot {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  active: boolean;
}

export interface Animal {
  id: string;
  earTag: string;
  name?: string;
  sex: "female" | "male";
  breed: string;
  birthDate?: string;
  entryDate: string;
  initialWeight: number;
  currentWeight: number;
  lotId: string;
  status: AnimalStatus;
}

export interface Allocation {
  animalId: string;
  amount: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  date: string;
  targetType: TargetType;
  targetId: string;
  animalIds: string[];
  product?: string;
  reason?: string;
  dose?: string;
  quantity?: number;
  unit?: string;
  weightKg?: number;
  cost: number;
  nextDueDate?: string;
  notes?: string;
  allocations: Allocation[];
  createdAt: string;
}

export interface Sale {
  id: string;
  date: string;
  animalIds: string[];
  buyer?: string;
  weightKg?: number;
  totalPrice: number;
  attributedCost: number;
  netProfit: number;
  notes?: string;
}

export interface RanchState {
  version: 1;
  profile: RanchProfile;
  lots: Lot[];
  animals: Animal[];
  activities: Activity[];
  sales: Sale[];
}

export interface ActivityInput {
  type: ActivityType;
  date: string;
  targetType: TargetType;
  targetId: string;
  product?: string;
  reason?: string;
  dose?: string;
  quantity?: number;
  unit?: string;
  weightKg?: number;
  cost: number;
  nextDueDate?: string;
  notes?: string;
}

export interface AnimalInput {
  earTag: string;
  name?: string;
  sex: "female" | "male";
  breed: string;
  birthDate?: string;
  entryDate: string;
  initialWeight: number;
  lotId: string;
}

export interface LotInput {
  name: string;
  description?: string;
}

export interface SaleInput {
  date: string;
  animalIds: string[];
  buyer?: string;
  weightKg?: number;
  totalPrice: number;
  notes?: string;
}
