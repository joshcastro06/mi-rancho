import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { createSeedState } from "../data/seed";
import { animalCost, withRecalculatedWeights } from "../lib/metrics";
import { makeId } from "../lib/format";
import type {
  Activity,
  ActivityInput,
  Animal,
  AnimalInput,
  Lot,
  LotInput,
  RanchProfile,
  RanchState,
  Sale,
  SaleInput,
} from "../types";

const STORAGE_KEY = "mi-rancho:v1";

type Action =
  | { type: "ADD_ANIMAL"; animal: Animal }
  | { type: "UPDATE_ANIMAL"; id: string; input: AnimalInput }
  | { type: "ADD_LOT"; lot: Lot }
  | { type: "UPDATE_LOT"; id: string; input: LotInput }
  | { type: "ADD_ACTIVITY"; activity: Activity }
  | { type: "ADD_SALE"; sale: Sale }
  | { type: "UPDATE_PROFILE"; profile: RanchProfile }
  | { type: "RESET"; state: RanchState };

const isDuplicateEarTag = (state: RanchState, earTag: string, excludeId?: string) =>
  state.animals.some(
    (animal) => animal.id !== excludeId && animal.earTag.toLowerCase() === earTag.trim().toLowerCase(),
  );

const reducer = (state: RanchState, action: Action): RanchState => {
  switch (action.type) {
    case "ADD_ANIMAL":
      return { ...state, animals: [action.animal, ...state.animals] };
    case "UPDATE_ANIMAL":
      return withRecalculatedWeights({
        ...state,
        animals: state.animals.map((animal) =>
          animal.id === action.id
            ? {
                ...animal,
                ...action.input,
                earTag: action.input.earTag.trim(),
                name: action.input.name?.trim() || undefined,
                birthDate: action.input.birthDate || undefined,
              }
            : animal,
        ),
      });
    case "ADD_LOT":
      return { ...state, lots: [action.lot, ...state.lots] };
    case "UPDATE_LOT":
      return {
        ...state,
        lots: state.lots.map((lot) =>
          lot.id === action.id
            ? { ...lot, name: action.input.name.trim(), description: action.input.description?.trim() || undefined }
            : lot,
        ),
      };
    case "ADD_ACTIVITY":
      return withRecalculatedWeights({
        ...state,
        activities: [action.activity, ...state.activities],
      });
    case "ADD_SALE":
      return {
        ...state,
        sales: [action.sale, ...state.sales],
        animals: state.animals.map((animal) =>
          action.sale.animalIds.includes(animal.id) ? { ...animal, status: "sold" as const } : animal,
        ),
      };
    case "UPDATE_PROFILE":
      return { ...state, profile: action.profile };
    case "RESET":
      return action.state;
    default:
      return state;
  }
};

const loadInitialState = (): RanchState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as RanchState;
    if (parsed.version !== 1 || !Array.isArray(parsed.animals)) return createSeedState();
    return withRecalculatedWeights({
      ...createSeedState(),
      ...parsed,
      profile: { ...createSeedState().profile, ...parsed.profile },
    });
  } catch {
    return createSeedState();
  }
};

interface RanchContextValue {
  state: RanchState;
  addAnimal: (input: AnimalInput) => { ok: boolean; error?: string };
  updateAnimal: (id: string, input: AnimalInput) => { ok: boolean; error?: string };
  addLot: (input: LotInput) => { ok: boolean; error?: string };
  updateLot: (id: string, input: LotInput) => { ok: boolean; error?: string };
  addActivity: (input: ActivityInput) => { ok: boolean; error?: string };
  addSale: (input: SaleInput) => { ok: boolean; error?: string };
  updateProfile: (profile: RanchProfile) => void;
  resetDemo: () => void;
}

const RanchContext = createContext<RanchContextValue | null>(null);

export function RanchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<RanchContextValue>(
    () => ({
      state,
      addAnimal: (input) => {
        if (isDuplicateEarTag(state, input.earTag)) {
          return { ok: false, error: "Ya existe un animal con esta chapeta." };
        }
        dispatch({
          type: "ADD_ANIMAL",
          animal: {
            id: makeId("animal"),
            ...input,
            earTag: input.earTag.trim(),
            name: input.name?.trim() || undefined,
            birthDate: input.birthDate || undefined,
            currentWeight: input.initialWeight,
            status: "active",
          },
        });
        return { ok: true };
      },
      updateAnimal: (id, input) => {
        if (isDuplicateEarTag(state, input.earTag, id)) {
          return { ok: false, error: "Ya existe un animal con esta chapeta." };
        }
        dispatch({ type: "UPDATE_ANIMAL", id, input });
        return { ok: true };
      },
      addLot: (input) => {
        if (!input.name.trim()) return { ok: false, error: "Escribe un nombre para el lote." };
        dispatch({
          type: "ADD_LOT",
          lot: {
            id: makeId("lot"),
            name: input.name.trim(),
            description: input.description?.trim() || undefined,
            createdAt: new Date().toISOString().slice(0, 10),
            active: true,
          },
        });
        return { ok: true };
      },
      updateLot: (id, input) => {
        if (!input.name.trim()) return { ok: false, error: "Escribe un nombre para el lote." };
        dispatch({ type: "UPDATE_LOT", id, input });
        return { ok: true };
      },
      addActivity: (input) => {
        const animalIds =
          input.targetType === "animal"
            ? [input.targetId]
            : state.animals
                .filter((animal) => animal.lotId === input.targetId && animal.status === "active")
                .map((animal) => animal.id);
        if (!animalIds.length) return { ok: false, error: "El objetivo no tiene animales activos." };
        const share = animalIds.length ? input.cost / animalIds.length : 0;
        dispatch({
          type: "ADD_ACTIVITY",
          activity: {
            id: makeId("activity"),
            ...input,
            animalIds,
            allocations: animalIds.map((animalId) => ({ animalId, amount: share })),
            createdAt: new Date().toISOString(),
          },
        });
        return { ok: true };
      },
      addSale: (input) => {
        const available = input.animalIds.filter(
          (id) => state.animals.find((animal) => animal.id === id)?.status === "active",
        );
        if (!available.length) return { ok: false, error: "Selecciona al menos un animal activo." };
        const attributedCost = available.reduce((total, id) => total + animalCost(state, id), 0);
        dispatch({
          type: "ADD_SALE",
          sale: {
            id: makeId("sale"),
            ...input,
            animalIds: available,
            attributedCost,
            netProfit: input.totalPrice - attributedCost,
          },
        });
        return { ok: true };
      },
      updateProfile: (profile) => dispatch({ type: "UPDATE_PROFILE", profile }),
      resetDemo: () => dispatch({ type: "RESET", state: createSeedState() }),
    }),
    [state],
  );

  return <RanchContext.Provider value={value}>{children}</RanchContext.Provider>;
}

export const useRanch = () => {
  const context = useContext(RanchContext);
  if (!context) throw new Error("useRanch debe usarse dentro de RanchProvider");
  return context;
};
