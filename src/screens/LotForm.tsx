import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { BackButton, Button, Field, ScreenHeading, TextareaField } from "../components/ui";
import { useRanch } from "../state/RanchContext";
import type { LotInput } from "../types";

export default function LotForm({
  lotId,
  onBack,
  onSaved,
}: {
  lotId?: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { state, addLot, updateLot } = useRanch();
  const current = state.lots.find((lot) => lot.id === lotId);
  const [form, setForm] = useState<LotInput>({ name: current?.name ?? "", description: current?.description ?? "" });
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Escribe un nombre para el lote.");
    const result = current ? updateLot(current.id, form) : addLot(form);
    if (!result.ok) return setError(result.error ?? "No fue posible guardar.");
    onSaved();
  };

  return (
    <div className="screen-stack screen-enter">
      <div className="detail-bar"><BackButton onClick={onBack} /></div>
      <ScreenHeading
        eyebrow="Inventario"
        title={current ? "Editar lote" : "Crear lote"}
        description="Agrupa animales para registrar tareas más rápido."
      />
      <form className="form-card" onSubmit={submit} noValidate>
        <Field label="Nombre del lote" value={form.name} error={error} onChange={(event) => { setForm({ ...form, name: event.target.value }); setError(""); }} placeholder="Ej. Ceba sur" required />
        <TextareaField label="Descripción (opcional)" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tipo de ganado o ubicación" rows={3} />
        <Button type="submit" className="full-width" icon={Plus}>{current ? "Guardar cambios" : "Crear lote"}</Button>
      </form>
    </div>
  );
}
