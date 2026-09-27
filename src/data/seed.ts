import type { RanchState } from "../types";

const dateFromToday = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const createSeedState = (): RanchState => ({
  version: 1,
  profile: {
    ranchName: "Mi Rancho",
    ownerName: "Honorio Botero",
    currency: "COP",
    weightUnit: "kg",
  },
  lots: [
    { id: "lot-ceba", name: "Ceba norte", description: "Novillos en terminación", createdAt: dateFromToday(-190), active: true },
    { id: "lot-levante", name: "Levante", description: "Ganado joven", createdAt: dateFromToday(-130), active: true },
    { id: "lot-vientres", name: "Vientres", description: "Hembras de cría", createdAt: dateFromToday(-360), active: true },
  ],
  animals: [
    { id: "a-184", earTag: "184", name: "Lucero", sex: "female", breed: "Brahman", entryDate: dateFromToday(-330), initialWeight: 318, currentWeight: 426, lotId: "lot-vientres", status: "active" },
    { id: "a-219", earTag: "219", name: "Canelo", sex: "male", breed: "Brahman", entryDate: dateFromToday(-180), initialWeight: 342, currentWeight: 478, lotId: "lot-ceba", status: "active" },
    { id: "a-227", earTag: "227", sex: "male", breed: "Brangus", entryDate: dateFromToday(-180), initialWeight: 351, currentWeight: 491, lotId: "lot-ceba", status: "active" },
    { id: "a-231", earTag: "231", name: "Relámpago", sex: "male", breed: "Brahman", entryDate: dateFromToday(-160), initialWeight: 336, currentWeight: 462, lotId: "lot-ceba", status: "active" },
    { id: "a-305", earTag: "305", name: "Luna", sex: "female", breed: "Gyr", entryDate: dateFromToday(-110), initialWeight: 205, currentWeight: 286, lotId: "lot-levante", status: "active" },
    { id: "a-311", earTag: "311", sex: "female", breed: "Brahman", entryDate: dateFromToday(-100), initialWeight: 218, currentWeight: 297, lotId: "lot-levante", status: "active" },
    { id: "a-318", earTag: "318", name: "Paloma", sex: "female", breed: "Brangus", entryDate: dateFromToday(-95), initialWeight: 224, currentWeight: 301, lotId: "lot-levante", status: "active" },
    { id: "a-143", earTag: "143", sex: "male", breed: "Brahman", entryDate: dateFromToday(-420), initialWeight: 290, currentWeight: 505, lotId: "lot-ceba", status: "sold" },
  ],
  activities: [
    {
      id: "act-feed-1", type: "feed", date: dateFromToday(-3), targetType: "lot", targetId: "lot-ceba",
      animalIds: ["a-219", "a-227", "a-231"], product: "Sal mineralizada", quantity: 45, unit: "kg", cost: 189000,
      notes: "Entrega semanal", allocations: [{ animalId: "a-219", amount: 63000 }, { animalId: "a-227", amount: 63000 }, { animalId: "a-231", amount: 63000 }], createdAt: dateFromToday(-3),
    },
    {
      id: "act-weight-1", type: "weight", date: dateFromToday(-9), targetType: "animal", targetId: "a-219",
      animalIds: ["a-219"], weightKg: 478, cost: 0, allocations: [{ animalId: "a-219", amount: 0 }], createdAt: dateFromToday(-9),
    },
    {
      id: "act-weight-2", type: "weight", date: dateFromToday(-70), targetType: "animal", targetId: "a-219",
      animalIds: ["a-219"], weightKg: 410, cost: 0, allocations: [{ animalId: "a-219", amount: 0 }], createdAt: dateFromToday(-70),
    },
    {
      id: "act-weight-3", type: "weight", date: dateFromToday(-8), targetType: "animal", targetId: "a-305",
      animalIds: ["a-305"], weightKg: 286, cost: 0, allocations: [{ animalId: "a-305", amount: 0 }], createdAt: dateFromToday(-8),
    },
    {
      id: "act-vaccine-1", type: "vaccine", date: dateFromToday(-175), targetType: "lot", targetId: "lot-ceba",
      animalIds: ["a-219", "a-227", "a-231", "a-143"], product: "Clostridial", cost: 92000, nextDueDate: dateFromToday(5),
      allocations: [{ animalId: "a-219", amount: 23000 }, { animalId: "a-227", amount: 23000 }, { animalId: "a-231", amount: 23000 }, { animalId: "a-143", amount: 23000 }], createdAt: dateFromToday(-175),
    },
    {
      id: "act-deworm-1", type: "deworming", date: dateFromToday(-120), targetType: "animal", targetId: "a-184",
      animalIds: ["a-184"], product: "Ivermectina", cost: 18000, nextDueDate: dateFromToday(-2),
      allocations: [{ animalId: "a-184", amount: 18000 }], createdAt: dateFromToday(-120),
    },
    {
      id: "act-treatment-1", type: "treatment", date: dateFromToday(-4), targetType: "animal", targetId: "a-305",
      animalIds: ["a-305"], product: "Curación de pezuña", cost: 54000, nextDueDate: dateFromToday(2), notes: "Revisar evolución",
      allocations: [{ animalId: "a-305", amount: 54000 }], createdAt: dateFromToday(-4),
    },
    {
      id: "act-feed-2", type: "feed", date: dateFromToday(-12), targetType: "lot", targetId: "lot-levante",
      animalIds: ["a-305", "a-311", "a-318"], product: "Suplemento levante", quantity: 60, unit: "kg", cost: 246000,
      allocations: [{ animalId: "a-305", amount: 82000 }, { animalId: "a-311", amount: 82000 }, { animalId: "a-318", amount: 82000 }], createdAt: dateFromToday(-12),
    },
  ],
  sales: [
    {
      id: "sale-143", date: dateFromToday(-28), animalIds: ["a-143"], buyer: "Comercializadora La Vega",
      weightKg: 505, totalPrice: 4444000, attributedCost: 816000, netProfit: 3628000, notes: "Pago de contado",
    },
  ],
});
