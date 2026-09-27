import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { Button, Card, Field, ScreenHeading, Segmented, SelectField, TextareaField } from "../components/ui";
import { recordKinds, type RegisterKind } from "../lib/catalog";
import { formatCurrency, isValidDate, today } from "../lib/format";
import { activeAnimals, activityLabels, animalCost, lotAnimals } from "../lib/metrics";
import { useRanch } from "../state/RanchContext";
import type { TargetType } from "../types";

const steps = ["Tipo", "Objetivo", "Datos", "Revisar"];

export default function RegisterScreen({
  initialKind,
  presetTarget,
  onGoHome,
  onViewAnimal,
  onViewLot,
  onViewSummary,
}: {
  initialKind: RegisterKind;
  presetTarget?: { type: TargetType; id: string };
  onGoHome: (message: string) => void;
  onViewAnimal: (id: string) => void;
  onViewLot: (id: string) => void;
  onViewSummary: () => void;
}) {
  const { state, addActivity, addSale } = useRanch();
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<RegisterKind>(initialKind);
  const [targetType, setTargetType] = useState<TargetType>(presetTarget?.type ?? "lot");
  const [targetId, setTargetId] = useState(presetTarget?.id ?? state.lots[0]?.id ?? "");
  const [date, setDate] = useState(today());
  const [product, setProduct] = useState("");
  const [reason, setReason] = useState("");
  const [dose, setDose] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>(presetTarget?.type === "animal" ? [presetTarget.id] : []);
  const [buyer, setBuyer] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedKind, setSavedKind] = useState<RegisterKind>();
  const active = activeAnimals(state);
  const selectedKind = recordKinds.find((item) => item.id === kind)!;
  const isHealth = ["vaccine", "deworming", "treatment"].includes(kind);
  const affected = useMemo(() => {
    if (kind === "sale") return active.filter((animal) => selectedAnimals.includes(animal.id));
    if (targetType === "animal") return active.filter((animal) => animal.id === targetId);
    return lotAnimals(state, targetId);
  }, [kind, selectedAnimals, targetType, targetId, active, state]);

  useEffect(() => {
    setKind(initialKind);
    setStep(1);
    setSavedKind(undefined);
    setErrors({});
  }, [initialKind]);

  useEffect(() => {
    if (presetTarget) {
      setTargetType(presetTarget.type);
      setTargetId(presetTarget.id);
      if (presetTarget.type === "animal") setSelectedAnimals([presetTarget.id]);
      setStep(2);
    }
  }, [presetTarget]);

  useEffect(() => {
    if (presetTarget) return;
    setTargetId(targetType === "lot" ? state.lots[0]?.id ?? "" : active[0]?.id ?? "");
  }, [targetType]);

  const validateTarget = () => {
    const next: Record<string, string> = {};
    if (kind === "sale" && !selectedAnimals.length) next.target = "Selecciona al menos un animal activo.";
    if (kind !== "sale" && !targetId) next.target = "Elige un animal o un lote.";
    if (kind !== "sale" && !affected.length) next.target = "Ese objetivo no tiene animales activos.";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const validateFields = () => {
    const next: Record<string, string> = {};
    if (!isValidDate(date) || date > today()) next.date = "Ingresa una fecha válida que no sea futura.";
    if (kind === "feed") {
      if (Number(quantity) <= 0) next.quantity = "La cantidad debe ser mayor a cero.";
      if (!product.trim()) next.product = "Indica el producto o tipo de alimento.";
      if (cost !== "" && Number(cost) < 0) next.cost = "El costo no puede ser negativo.";
    }
    if (kind === "weight" && Number(quantity) <= 0) next.quantity = "El peso debe ser mayor a cero.";
    if (kind === "vaccine" || kind === "deworming") {
      if (!product.trim()) next.product = "Indica el producto.";
      if (cost !== "" && Number(cost) < 0) next.cost = "El costo no puede ser negativo.";
    }
    if (kind === "treatment") {
      if (!reason.trim()) next.reason = "Describe el motivo o procedimiento.";
      if (cost !== "" && Number(cost) < 0) next.cost = "El costo no puede ser negativo.";
    }
    if (kind === "sale") {
      if (Number(cost) <= 0) next.cost = "Ingresa un valor de venta mayor a cero.";
      if (quantity && Number(quantity) <= 0) next.quantity = "El peso vendido debe ser positivo.";
    }
    if (nextDue && (!isValidDate(nextDue) || nextDue < date)) next.nextDue = "La próxima fecha debe ser igual o posterior a este registro.";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const goNext = () => {
    if (step === 2 && !validateTarget()) return;
    if (step === 3 && !validateFields()) return;
    setStep((current) => Math.min(current + 1, 4));
  };

  const estimatedCost = affected.reduce((total, animal) => total + animalCost(state, animal.id), 0);
  const saleProfit = Number(cost || 0) - estimatedCost;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validateFields() || !validateTarget()) {
      setStep(3);
      return;
    }
    if (kind === "sale") {
      const result = addSale({
        date,
        animalIds: selectedAnimals,
        buyer: buyer.trim() || undefined,
        totalPrice: Number(cost),
        weightKg: quantity ? Number(quantity) : undefined,
        notes: notes || undefined,
      });
      if (!result.ok) return setErrors({ form: result.error ?? "No fue posible guardar." });
      setSavedKind("sale");
      return;
    }
    const result = addActivity({
      type: kind,
      date,
      targetType,
      targetId,
      product: product.trim() || undefined,
      reason: reason.trim() || undefined,
      dose: dose.trim() || undefined,
      quantity: kind === "feed" && quantity ? Number(quantity) : undefined,
      unit: kind === "feed" ? "kg" : undefined,
      weightKg: kind === "weight" ? Number(quantity) : undefined,
      cost: kind === "weight" ? 0 : Number(cost || 0),
      nextDueDate: isHealth && nextDue ? nextDue : undefined,
      notes: notes || undefined,
    });
    if (!result.ok) return setErrors({ form: result.error ?? "No fue posible guardar." });
    setSavedKind(kind);
  };

  if (savedKind) {
    return (
      <div className="screen-stack screen-enter">
        <Card className="success-card">
          <span className="success-card__icon"><Check size={28} aria-hidden="true" /></span>
          <h1>{activityLabels[savedKind]} guardado</h1>
          <p>El registro quedó en este dispositivo y ya alimenta alertas, costos e historiales.</p>
        </Card>
        {savedKind === "sale" ? (
          <Button className="full-width" onClick={onViewSummary}>Ver resumen financiero</Button>
        ) : targetType === "lot" ? (
          <Button className="full-width" onClick={() => onViewLot(targetId)}>Ver ficha del lote</Button>
        ) : (
          <Button className="full-width" onClick={() => onViewAnimal(targetId)}>Ver ficha del animal</Button>
        )}
        <Button variant="secondary" className="full-width" onClick={() => onGoHome(`${activityLabels[savedKind]} registrado correctamente`)}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="screen-stack screen-enter">
      <ScreenHeading eyebrow="Registro rápido" title="Nueva actividad" description="Opciones pensadas para una sola mano." />

      {step === 1 ? (
        <div className="kind-grid">
          {recordKinds.map(({ id, label, icon: Icon, color }) => (
            <Button
              key={id}
              variant="ghost"
              className={`kind-card ${kind === id ? "kind-card--active" : ""}`}
              onClick={() => { setKind(id); setErrors({}); }}
            >
              <span className={`quick-action__icon quick-action__icon--${color}`}><Icon size={22} /></span>
              {label}
            </Button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        kind === "sale" ? (
          <div className="field">
            <span className="field__label">Animales vendidos</span>
            <div className="selection-list">
              {active.map((animal) => {
                const selected = selectedAnimals.includes(animal.id);
                return (
                  <Button
                    type="button"
                    key={animal.id}
                    variant="ghost"
                    className={`selection-card ${selected ? "selection-card--selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedAnimals(selected ? selectedAnimals.filter((id) => id !== animal.id) : [...selectedAnimals, animal.id])}
                  >
                    <span className="selection-card__check">{selected ? <Check size={16} /> : null}</span>
                    <span><strong>#{animal.earTag} {animal.name ?? ""}</strong><small>{animal.currentWeight} kg</small></span>
                  </Button>
                );
              })}
            </div>
            {errors.target ? <span className="field__error">{errors.target}</span> : null}
            {!active.length ? <p className="muted">No hay animales activos para vender.</p> : null}
          </div>
        ) : (
          <>
            <Segmented
              value={targetType}
              onChange={(value) => setTargetType(value as TargetType)}
              options={[{ value: "lot", label: "Por lote" }, { value: "animal", label: "Por animal" }]}
            />
            <SelectField label={targetType === "lot" ? "Selecciona el lote" : "Selecciona el animal"} value={targetId} error={errors.target} onChange={(event) => setTargetId(event.target.value)}>
              {targetType === "lot"
                ? state.lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.name} · {lotAnimals(state, lot.id).length} animales activos</option>)
                : active.map((animal) => <option key={animal.id} value={animal.id}>#{animal.earTag} {animal.name ?? ""}</option>)}
            </SelectField>
            <p className="muted">{affected.length} {affected.length === 1 ? "animal activo" : "animales activos"} recibirán este registro.</p>
          </>
        )
      ) : null}

      {step === 3 ? (
        <form className="form-card" onSubmit={(event) => { event.preventDefault(); goNext(); }}>
          <div className="form-title">
            <span className={`quick-action__icon quick-action__icon--${selectedKind.color}`}><selectedKind.icon size={22} /></span>
            <div><p className="eyebrow">Estás registrando</p><h2>{selectedKind.label}</h2></div>
          </div>
          <Field label="Fecha" type="date" value={date} max={today()} error={errors.date} onChange={(event) => setDate(event.target.value)} required />
          {kind === "feed" ? <Field label="Cantidad total (kg)" type="number" min="0.1" step="0.1" inputMode="decimal" value={quantity} error={errors.quantity} onChange={(event) => setQuantity(event.target.value)} required /> : null}
          {kind === "weight" ? <Field label={targetType === "lot" ? "Peso promedio (kg)" : "Peso (kg)"} type="number" min="1" step="0.1" inputMode="decimal" value={quantity} error={errors.quantity} onChange={(event) => setQuantity(event.target.value)} required hint={targetType === "lot" ? "Este peso se aplicará a los animales activos del lote." : undefined} /> : null}
          {kind === "sale" ? <Field label="Peso total vendido (kg, opcional)" type="number" min="1" step="0.1" inputMode="decimal" value={quantity} error={errors.quantity} onChange={(event) => setQuantity(event.target.value)} /> : null}
          {kind === "treatment" ? <Field label="Motivo" value={reason} error={errors.reason} onChange={(event) => setReason(event.target.value)} placeholder="Ej. Cojera en pezuña" required /> : null}
          {kind !== "weight" && kind !== "sale" ? (
            <Field
              label={kind === "treatment" ? "Producto o procedimiento (opcional)" : "Producto"}
              value={product}
              error={errors.product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder={kind === "feed" ? "Ej. Sal mineralizada" : "Nombre del producto"}
              required={kind !== "treatment"}
            />
          ) : null}
          {isHealth && kind !== "treatment" ? <Field label="Dosis (opcional)" value={dose} onChange={(event) => setDose(event.target.value)} placeholder="Ej. 10 ml" /> : null}
          {kind === "treatment" ? <Field label="Dosis (opcional)" value={dose} onChange={(event) => setDose(event.target.value)} /> : null}
          {kind === "sale" ? <Field label="Comprador (opcional)" value={buyer} onChange={(event) => setBuyer(event.target.value)} placeholder="Nombre o empresa" /> : null}
          {kind !== "weight" ? (
            <Field
              label={kind === "sale" ? "Valor total de la venta" : "Costo total"}
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              value={cost}
              error={errors.cost}
              onChange={(event) => setCost(event.target.value)}
              required={kind === "sale"}
              prefix="COP"
              hint={kind !== "sale" && targetType === "lot" ? "Se repartirá en partes iguales entre los animales activos. Puede quedar en cero." : undefined}
            />
          ) : null}
          {isHealth ? <Field label="Próximo control (opcional)" type="date" value={nextDue} min={date} error={errors.nextDue} onChange={(event) => setNextDue(event.target.value)} /> : null}
          <TextareaField label="Notas (opcional)" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Agrega un detalle útil..." rows={3} />
        </form>
      ) : null}

      {step === 4 ? (
        <form className="form-card" onSubmit={submit}>
          <div className="form-title">
            <span className={`quick-action__icon quick-action__icon--${selectedKind.color}`}><selectedKind.icon size={22} /></span>
            <div><p className="eyebrow">Revisa antes de guardar</p><h2>{selectedKind.label}</h2></div>
          </div>
          <ul className="review-list">
            <li><span>Fecha</span><strong>{date}</strong></li>
            <li><span>Objetivo</span><strong>{kind === "sale" ? `${selectedAnimals.length} animales` : targetType === "lot" ? state.lots.find((lot) => lot.id === targetId)?.name : `#${active.find((animal) => animal.id === targetId)?.earTag}`}</strong></li>
            {quantity ? <li><span>{kind === "weight" ? "Peso" : "Cantidad / peso"}</span><strong>{quantity} kg</strong></li> : null}
            {reason ? <li><span>Motivo</span><strong>{reason}</strong></li> : null}
            {product ? <li><span>Producto</span><strong>{product}</strong></li> : null}
            {dose ? <li><span>Dosis</span><strong>{dose}</strong></li> : null}
            {kind !== "weight" ? <li><span>{kind === "sale" ? "Valor" : "Costo"}</span><strong>{formatCurrency(Number(cost || 0))}</strong></li> : null}
            {kind === "sale" ? <li><span>Utilidad estimada</span><strong className={saleProfit >= 0 ? "positive" : "negative"}>{formatCurrency(saleProfit)}</strong></li> : null}
            {nextDue ? <li><span>Próximo control</span><strong>{nextDue}</strong></li> : null}
          </ul>
          {kind !== "sale" && targetType === "lot" && Number(cost || 0) > 0 ? (
            <p className="muted">Cada animal activo recibirá {formatCurrency(Number(cost) / Math.max(affected.length, 1))}.</p>
          ) : null}
          {kind === "sale" ? <p className="muted">Al confirmar, esos animales pasarán a estado vendido y ya no podrán usarse en nuevos registros.</p> : null}
          {errors.form ? <p className="form-error" role="alert">{errors.form}</p> : null}
          <Button type="submit" className="full-width" icon={Check}>{kind === "sale" ? "Confirmar venta" : `Guardar ${selectedKind.label.toLowerCase()}`}</Button>
        </form>
      ) : null}

      <div className="wizard-nav">
        {step > 1 ? (
          <Button variant="secondary" icon={ChevronLeft} onClick={() => setStep((current) => current - 1)}>Atrás</Button>
        ) : <span />}
        {step < 4 ? (
          <Button onClick={goNext}>Continuar</Button>
        ) : null}
      </div>
    </div>
  );
}
