import { formatBytes } from "./format";
import type { Activity, ActivityType, Animal, RanchState } from "../types";

export const activityLabels: Record<ActivityType | "sale", string> = {
  feed: "Alimento",
  weight: "Peso",
  vaccine: "Vacuna",
  deworming: "Purga",
  treatment: "Tratamiento",
  sale: "Venta",
};

export const animalCost = (state: RanchState, animalId: string) =>
  state.activities.reduce(
    (total, activity) => total + (activity.allocations.find((item) => item.animalId === animalId)?.amount ?? 0),
    0,
  );

export const totalActivityCost = (state: RanchState) =>
  state.activities.reduce((total, activity) => total + activity.cost, 0);

export const costByTypes = (state: RanchState, types: ActivityType[], month?: string) =>
  state.activities
    .filter((activity) => types.includes(activity.type) && (!month || activity.date.startsWith(month)))
    .reduce((total, activity) => total + activity.cost, 0);

export const monthKey = (offset = 0) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return date.toISOString().slice(0, 7);
};

export const monthActivityCost = (state: RanchState, offset = 0) => {
  const month = monthKey(offset);
  return state.activities
    .filter((activity) => activity.date.startsWith(month))
    .reduce((total, activity) => total + activity.cost, 0);
};

export const monthSalesRevenue = (state: RanchState, offset = 0) => {
  const month = monthKey(offset);
  return state.sales.filter((sale) => sale.date.startsWith(month)).reduce((total, sale) => total + sale.totalPrice, 0);
};

export const activeAnimals = (state: RanchState) => state.animals.filter((animal) => animal.status === "active");

export const averageWeight = (animals: Animal[]) =>
  animals.length ? Math.round(animals.reduce((total, animal) => total + animal.currentWeight, 0) / animals.length) : 0;

export const currentWeightFor = (animal: Animal, activities: Activity[]) => {
  const weights = activities
    .filter((activity) => activity.type === "weight" && activity.animalIds.includes(animal.id) && activity.weightKg)
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      return byDate !== 0 ? byDate : a.createdAt.localeCompare(b.createdAt);
    });
  return weights.at(-1)?.weightKg ?? animal.initialWeight;
};

export const withRecalculatedWeights = (state: RanchState): RanchState => ({
  ...state,
  animals: state.animals.map((animal) => ({
    ...animal,
    currentWeight: currentWeightFor(animal, state.activities),
  })),
});

export const animalWeightHistory = (state: RanchState, animalId: string) => {
  const animal = state.animals.find((item) => item.id === animalId);
  if (!animal) return [];
  const points = [
    { date: animal.entryDate, weight: animal.initialWeight, label: "Ingreso" },
    ...state.activities
      .filter((activity) => activity.type === "weight" && activity.animalIds.includes(animalId) && activity.weightKg)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((activity) => ({ date: activity.date, weight: activity.weightKg as number, label: "Pesaje" })),
  ];
  return points.filter((point, index, list) => index === 0 || point.date !== list[index - 1]?.date || point.weight !== list[index - 1]?.weight);
};

export const recentWeightDelta = (state: RanchState) => {
  const animals = activeAnimals(state);
  let total = 0;
  let count = 0;
  for (const animal of animals) {
    const history = animalWeightHistory(state, animal.id);
    if (history.length >= 2) {
      total += history[history.length - 1]!.weight - history[history.length - 2]!.weight;
      count += 1;
    }
  }
  return count ? Math.round(total / count) : 0;
};

export interface RanchAlert {
  id: string;
  activity: Activity;
  title: string;
  detail: string;
  days: number;
  severity: "overdue" | "soon" | "future";
}

export const getAlerts = (state: RanchState): RanchAlert[] => {
  const activeIds = new Set(activeAnimals(state).map((animal) => animal.id));
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return state.activities
    .filter((activity) => activity.nextDueDate && activity.animalIds.some((id) => activeIds.has(id)))
    .map((activity) => {
      const due = new Date(`${activity.nextDueDate}T12:00:00`);
      const days = Math.ceil((due.getTime() - start.getTime()) / 86400000);
      const activeTargets = activity.animalIds.filter((id) => activeIds.has(id));
      const target =
        activity.targetType === "lot"
          ? state.lots.find((lot) => lot.id === activity.targetId)?.name
          : state.animals.find((animal) => animal.id === activeTargets[0])?.earTag;
      return {
        id: activity.id,
        activity,
        title: `${activityLabels[activity.type]} · ${target ?? "Ganado"}`,
        detail: days < 0 ? `Venció hace ${Math.abs(days)} días` : days === 0 ? "Vence hoy" : `En ${days} días`,
        days,
        severity: (days < 0 ? "overdue" : days <= 7 ? "soon" : "future") as RanchAlert["severity"],
      };
    })
    .sort((a, b) => a.days - b.days);
};

export const sortedActivities = (state: RanchState) =>
  [...state.activities].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

export const lotAnimals = (state: RanchState, lotId: string, includeSold = false) =>
  state.animals.filter((animal) => animal.lotId === lotId && (includeSold || animal.status === "active"));

export const lotCost = (state: RanchState, lotId: string) =>
  lotAnimals(state, lotId).reduce((sum, animal) => sum + animalCost(state, animal.id), 0);

export const lotHistory = (state: RanchState, lotId: string) =>
  sortedActivities(state).filter(
    (activity) => activity.targetType === "lot" && activity.targetId === lotId
      || activity.animalIds.some((id) => state.animals.find((animal) => animal.id === id)?.lotId === lotId),
  );

export const lotFinance = (state: RanchState) =>
  state.lots.map((lot) => {
    const members = lotAnimals(state, lot.id, true);
    const cost = members.reduce((sum, animal) => sum + animalCost(state, animal.id), 0);
    const revenue = state.sales
      .filter((sale) => sale.animalIds.some((id) => members.some((animal) => animal.id === id)))
      .reduce((sum, sale) => sum + sale.totalPrice, 0);
    return { lot, cost, revenue, count: lotAnimals(state, lot.id).length };
  });

export const feedQuantity = (state: RanchState) =>
  state.activities.filter((activity) => activity.type === "feed").reduce((sum, activity) => sum + (activity.quantity ?? 0), 0);

export const storageSnapshot = (state: RanchState) => {
  const bytes = new TextEncoder().encode(JSON.stringify(state)).length;
  return { bytes, label: formatBytes(bytes) };
};
