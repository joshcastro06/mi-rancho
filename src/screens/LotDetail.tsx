import { ChevronRight, Pencil, Users } from "lucide-react";
import { BackButton, Button, Card, EmptyState, ScreenHeading, Tag } from "../components/ui";
import { formatCompactCurrency, formatDate } from "../lib/format";
import { activityLabels, averageWeight, lotAnimals, lotCost, lotHistory } from "../lib/metrics";
import { useRanch } from "../state/RanchContext";

export default function LotDetail({
  id,
  onBack,
  onEdit,
  onAnimal,
}: {
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onAnimal: (id: string) => void;
}) {
  const { state } = useRanch();
  const lot = state.lots.find((item) => item.id === id);
  if (!lot) {
    return <EmptyState icon={Users} title="Lote no encontrado" description="Este lote ya no está disponible." action={<Button onClick={onBack}>Volver</Button>} />;
  }
  const animals = lotAnimals(state, id, true);
  const active = lotAnimals(state, id);
  const history = lotHistory(state, id);

  return (
    <div className="screen-stack screen-enter">
      <div className="detail-bar">
        <BackButton onClick={onBack} />
        <div className="detail-bar__actions">
          <Tag tone="success">{lot.active ? "Activo" : "Inactivo"}</Tag>
          <Button variant="secondary" icon={Pencil} onClick={onEdit}>Editar</Button>
        </div>
      </div>
      <ScreenHeading eyebrow="Lote" title={lot.name} description={lot.description ?? "Sin descripción"} />
      <div className="detail-metrics">
        <Card><span>Animales</span><strong>{active.length}</strong></Card>
        <Card><span>Peso promedio</span><strong>{averageWeight(active)} kg</strong></Card>
        <Card><span>Costos</span><strong>{formatCompactCurrency(lotCost(state, id))}</strong></Card>
      </div>
      <section>
        <div className="section-heading"><h2>Integrantes</h2><Tag>{animals.length}</Tag></div>
        <div className="list-stack">
          {animals.map((animal) => (
            <Button key={animal.id} variant="ghost" className="animal-card" onClick={() => onAnimal(animal.id)}>
              <span className="animal-avatar"><Users size={22} /></span>
              <span className="animal-card__main">
                <span className="animal-card__title">#{animal.earTag} {animal.name ?? ""}</span>
                <span className="animal-card__meta">{animal.breed} · {animal.status === "sold" ? "Vendido" : "Activo"}</span>
              </span>
              <strong>{animal.currentWeight} kg</strong>
              <ChevronRight size={18} />
            </Button>
          ))}
          {!animals.length ? <EmptyState icon={Users} title="Lote vacío" description="Asigna animales a este lote desde su ficha." /> : null}
        </div>
      </section>
      <section>
        <div className="section-heading"><h2>Historial del lote</h2><Tag>{history.length}</Tag></div>
        <Card className="timeline">
          {history.map((activity) => (
            <div className="timeline__item" key={activity.id}>
              <span className="timeline__marker" />
              <div>
                <strong>{activityLabels[activity.type]}</strong>
                <p>{activity.product ?? activity.reason ?? (activity.weightKg ? `${activity.weightKg} kg` : "Registro")}</p>
                <span>{formatDate(activity.date)} · {activity.animalIds.length} animales</span>
              </div>
              <strong>{activity.cost ? formatCompactCurrency(activity.cost) : "—"}</strong>
            </div>
          ))}
          {!history.length ? <p className="muted">Todavía no hay actividades en este lote.</p> : null}
        </Card>
      </section>
    </div>
  );
}
