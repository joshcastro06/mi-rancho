import { Beef, ClipboardPlus, Pencil } from "lucide-react";
import { BackButton, Button, Card, EmptyState, Tag } from "../components/ui";
import WeightChart from "../components/WeightChart";
import type { RegisterKind } from "../lib/catalog";
import { formatCompactCurrency, formatDate } from "../lib/format";
import { activityLabels, animalCost, animalWeightHistory, sortedActivities } from "../lib/metrics";
import { useRanch } from "../state/RanchContext";

export default function AnimalDetail({
  id,
  onBack,
  onEdit,
  onRegister,
}: {
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onRegister: (kind: RegisterKind) => void;
}) {
  const { state } = useRanch();
  const animal = state.animals.find((item) => item.id === id);
  if (!animal) {
    return <EmptyState icon={Beef} title="Animal no encontrado" description="Este registro ya no está disponible." action={<Button onClick={onBack}>Volver</Button>} />;
  }
  const lot = state.lots.find((item) => item.id === animal.lotId);
  const history = sortedActivities(state).filter((activity) => activity.animalIds.includes(id));
  const gain = animal.currentWeight - animal.initialWeight;
  const weights = animalWeightHistory(state, id);

  return (
    <div className="screen-stack screen-enter">
      <div className="detail-bar">
        <BackButton onClick={onBack} />
        <div className="detail-bar__actions">
          <Tag tone={animal.status === "active" ? "success" : "neutral"}>{animal.status === "active" ? "Activo" : "Vendido"}</Tag>
          <Button variant="secondary" icon={Pencil} onClick={onEdit}>Editar</Button>
        </div>
      </div>
      <section className="animal-profile">
        <span className="animal-profile__avatar"><Beef size={36} aria-hidden="true" /></span>
        <p className="eyebrow">Chapeta #{animal.earTag}</p>
        <h1>{animal.name ?? "Sin nombre"}</h1>
        <p>{animal.breed} · {animal.sex === "female" ? "Hembra" : "Macho"} · {lot?.name}</p>
      </section>
      <div className="detail-metrics">
        <Card><span>Peso actual</span><strong>{animal.currentWeight} kg</strong></Card>
        <Card><span>Ganancia</span><strong className={gain >= 0 ? "positive" : "negative"}>{gain >= 0 ? "+" : ""}{gain} kg</strong></Card>
        <Card><span>Costo acumulado</span><strong>{formatCompactCurrency(animalCost(state, id))}</strong></Card>
      </div>
      <Card className="chart-card">
        <div className="section-heading"><h2>Evolución de peso</h2></div>
        <WeightChart points={weights} />
      </Card>
      {animal.status === "active" ? (
        <Button className="full-width" icon={ClipboardPlus} onClick={() => onRegister("weight")}>Registrar actividad</Button>
      ) : (
        <p className="muted">Este animal ya fue vendido. Puedes consultarlo, pero no recibe nuevos registros operativos.</p>
      )}
      <section>
        <div className="section-heading"><h2>Historial</h2><Tag>{history.length}</Tag></div>
        <Card className="timeline">
          {history.map((activity) => (
            <div className="timeline__item" key={activity.id}>
              <span className="timeline__marker" />
              <div>
                <strong>{activityLabels[activity.type]}</strong>
                <p>{activity.reason ?? activity.product ?? (activity.weightKg ? `${activity.weightKg} kg` : "Registro")}</p>
                <span>{formatDate(activity.date)}{activity.dose ? ` · ${activity.dose}` : ""}</span>
              </div>
              <strong>{activity.cost ? formatCompactCurrency(activity.allocations.find((item) => item.animalId === id)?.amount ?? 0) : "—"}</strong>
            </div>
          ))}
          {!history.length ? <p className="muted">Todavía no hay actividades.</p> : null}
        </Card>
      </section>
    </div>
  );
}
