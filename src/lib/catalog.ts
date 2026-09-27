import {
  CircleDollarSign,
  HeartPulse,
  Scale,
  ShieldCheck,
  Syringe,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { ActivityType } from "../types";

export type RegisterKind = ActivityType | "sale";

export const recordKinds: { id: RegisterKind; label: string; icon: LucideIcon; color: string }[] = [
  { id: "feed", label: "Alimento", icon: Wheat, color: "ochre" },
  { id: "weight", label: "Peso", icon: Scale, color: "blue" },
  { id: "vaccine", label: "Vacuna", icon: Syringe, color: "green" },
  { id: "deworming", label: "Purga", icon: ShieldCheck, color: "purple" },
  { id: "treatment", label: "Tratamiento", icon: HeartPulse, color: "red" },
  { id: "sale", label: "Venta", icon: CircleDollarSign, color: "dark" },
];
