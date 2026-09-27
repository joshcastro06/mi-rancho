import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { BackButton, Button, Field, ScreenHeading, SelectField } from "../components/ui";
import { today } from "../lib/format";
import { useRanch } from "../state/RanchContext";
import type { AnimalInput } from "../types";

export default function AnimalForm({
  animalId,
  onBack,
  onSaved,
}: {
  animalId?: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { state, addAnimal, updateAnimal } = useRanch();
  const current = state.animals.find((animal) => animal.id === animalId);
  const [form, setForm] = useState<AnimalInput>({
    earTag: current?.earTag ?? "",
    name: current?.name ?? "",
    sex: current?.sex ?? "female",
    breed: current?.breed ?? "",
    birthDate: current?.birthDate ?? "",
    entryDate: current?.entryDate ?? today(),
    initialWeight: current?.initialWeight ?? 0,
    lotId: current?.lotId ?? state.lots[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.earTag.trim()) nextErrors.earTag = "La chapeta es obligatoria.";
    if (!form.breed.trim()) nextErrors.breed = "Indica la raza.";
    if (!form.lotId) nextErrors.lotId = "Selecciona un lote.";
    if (form.initialWeight <= 0) nextErrors.initialWeight = "Ingresa un peso mayor a cero.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);

    const result = current ? updateAnimal(current.id, form) : addAnimal(form);
    if (!result.ok) return setErrors({ earTag: result.error ?? "No fue posible guardar." });
    onSaved();
  };

  return (
    <div className="screen-stack screen-enter">
      <div className="detail-bar"><BackButton onClick={onBack} /></div>
      <ScreenHeading
        eyebrow="Inventario"
        title={current ? "Editar animal" : "Agregar animal"}
        description={current ? "Actualiza los datos básicos o reasigna el lote. Los costos históricos no cambian." : "Registra sus datos básicos. Podrás añadir actividades después."}
      />
      <form className="form-card" onSubmit={submit} noValidate>
        <Field label="Chapeta o identificación" value={form.earTag} error={errors.earTag} onChange={(event) => setForm({ ...form, earTag: event.target.value })} placeholder="Ej. 324" required />
        <Field label="Nombre (opcional)" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Lucero" />
        <div className="form-row">
          <SelectField label="Sexo" value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value as "female" | "male" })}>
            <option value="female">Hembra</option>
            <option value="male">Macho</option>
          </SelectField>
          <Field label="Raza" value={form.breed} error={errors.breed} onChange={(event) => setForm({ ...form, breed: event.target.value })} placeholder="Brahman" required />
        </div>
        <SelectField label="Lote" value={form.lotId} error={errors.lotId} onChange={(event) => setForm({ ...form, lotId: event.target.value })}>
          {state.lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.name}</option>)}
        </SelectField>
        <div className="form-row">
          <Field label="Fecha de nacimiento (opcional)" type="date" value={form.birthDate ?? ""} max={today()} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} />
          <Field label="Fecha de ingreso" type="date" value={form.entryDate} max={today()} onChange={(event) => setForm({ ...form, entryDate: event.target.value })} required />
        </div>
        <Field label="Peso inicial (kg)" type="number" min="1" step="0.1" inputMode="decimal" value={form.initialWeight || ""} error={errors.initialWeight} onChange={(event) => setForm({ ...form, initialWeight: Number(event.target.value) })} required />
        {current?.status === "sold" ? <p className="muted">Este animal está vendido. Puedes corregir sus datos, pero no recibirá nuevas actividades de campo.</p> : null}
        <Button type="submit" className="full-width" icon={Plus}>{current ? "Guardar cambios" : "Agregar animal"}</Button>
      </form>
    </div>
  );
}
