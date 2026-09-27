import { Beef, Bell, CalendarClock, ChevronRight, CircleDollarSign, SearchX, TrendingUp } from "lucide-react";
import { Button, Card, EmptyState, Tag } from "../components/ui";
import { recordKinds, type RegisterKind } from "../lib/catalog";
import { formatCompactCurrency, formatDate, formatLongDate, formatShortDate } from "../lib/format";
import {
  activeAnimals,
  activityLabels,
  getAlerts,
  monthActivityCost,
  sortedActivities,
} from "../lib/metrics";
import { useRanch } from "../state/RanchContext";

export default function HomeScreen({
  openRegister,
  openCattle,
  openAnimal,
  openLot,
}: {
  openRegister: (kind: RegisterKind, target?: { type: "animal" | "lot"; id: string }) => void;
  openCattle: () => void;
  openAnimal: (id: string) => void;
  openLot: (id: string) => void;
}) {
  const { state } = useRanch();
  const animals = activeAnimals(state);
  const alerts = getAlerts(state);
  const recent = sortedActivities(state).slice(0, 5);
  const greeting = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const isEmpty = !state.animals.length && !state.activities.length && !state.sales.length;

  const openActivity = (activity: (typeof recent)[number]) => {
    if (activity.targetType === "lot") openLot(activity.targetId);
    else openAnimal(activity.targetId);
  };

  return (
    <div className="screen-stack screen-enter">
      <section className="hero">
        <div>
          <p className="hero__eyebrow">{greeting}, {state.profile.ownerName.split(" ")[0]}</p>
          <h1>Todo el rancho,<br />bajo control.</h1>
          <p className="hero__date">{formatLongDate()}</p>
        </div>
        <div className="hero__stamp"><Beef size={43} strokeWidth={1.4} aria-hidden="true" /></div>
      </section>

      {isEmpty ? (
        <EmptyState
          icon={Beef}
          title="Empieza por tu hato"
          description="No hay datos en este dispositivo. Agrega un animal o restaura la demostración desde Ajustes."
          action={<Button onClick={openCattle}>Ir a ganado</Button>}
        />
      ) : (
        <section className="metric-grid" aria-label="Resumen del rancho">
          <Card className="metric-card metric-card--primary">
            <span className="metric-card__icon"><Beef size={18} aria-hidden="true" /></span>
            <p className="metric-card__value">{animals.length}</p>
            <p className="metric-card__label">Animales activos</p>
            <Button variant="ghost" className="metric-card__link" onClick={openCattle}>Ver ganado <ChevronRight size={15} /></Button>
          </Card>
          <Card className="metric-card">
            <span className="metric-card__icon"><Beef size={18} aria-hidden="true" /></span>
            <p className="metric-card__value">{state.lots.length}</p>
            <p className="metric-card__label">Lotes</p>
            <p className="metric-card__caption">{state.animals.filter((animal) => animal.status === "sold").length} vendidos</p>
          </Card>
          <Card className="metric-card">
            <span className="metric-card__icon metric-card__icon--warning"><Bell size={18} aria-hidden="true" /></span>
            <p className="metric-card__value">{alerts.filter((alert) => alert.days <= 7).length}</p>
            <p className="metric-card__label">Alertas por atender</p>
            <p className="metric-card__caption">{alerts[0]?.detail ?? "Todo en orden"}</p>
          </Card>
          <Card className="metric-card">
            <span className="metric-card__icon"><TrendingUp size={18} aria-hidden="true" /></span>
            <p className="metric-card__money">{formatCompactCurrency(monthActivityCost(state))}</p>
            <p className="metric-card__label">Costos del mes</p>
          </Card>
        </section>
      )}

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trabajo de campo</p>
            <h2>¿Qué vas a registrar?</h2>
          </div>
        </div>
        <div className="quick-grid">
          {recordKinds.filter((item) => item.id !== "sale").map(({ id, label, icon: Icon, color }) => (
            <Button key={id} variant="ghost" className="quick-action" onClick={() => openRegister(id)}>
              <span className={`quick-action__icon quick-action__icon--${color}`}><Icon size={22} aria-hidden="true" /></span>
              <span>{label}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          ))}
        </div>
        <Button variant="secondary" className="full-width sale-shortcut" icon={CircleDollarSign} onClick={() => openRegister("sale")}>
          Registrar una venta
        </Button>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Próximamente</p>
            <h2>Alertas de salud</h2>
          </div>
          <Tag tone={alerts.some((alert) => alert.severity === "overdue") ? "danger" : "success"}>{alerts.length}</Tag>
        </div>
        <div className="list-stack">
          {alerts.slice(0, 4).map((alert) => (
            <Button
              key={alert.id}
              variant="ghost"
              className="alert-row"
              onClick={() => openActivity(alert.activity)}
            >
              <span className={`alert-row__mark alert-row__mark--${alert.severity}`} />
              <span className="alert-row__icon"><CalendarClock size={19} aria-hidden="true" /></span>
              <span className="alert-row__body">
                <p>{alert.title}</p>
                <span>{alert.activity.product ?? alert.activity.reason ?? "Control programado"} · {formatShortDate(alert.activity.nextDueDate!)}</span>
              </span>
              <Tag tone={alert.severity === "overdue" ? "danger" : alert.severity === "soon" ? "warning" : "neutral"}>{alert.detail}</Tag>
            </Button>
          ))}
          {!alerts.length ? (
            <EmptyState icon={Bell} title="Sin alertas pendientes" description="Cuando programes una vacuna, purga o revisión, aparecerá aquí." />
          ) : null}
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Bitácora</p>
            <h2>Actividad reciente</h2>
          </div>
        </div>
        {recent.length ? (
          <Card className="activity-list">
            {recent.map((activity) => (
              <Button key={activity.id} variant="ghost" className="activity-row" onClick={() => openActivity(activity)}>
                <span className="activity-row__dot" />
                <span>
                  <p>{activityLabels[activity.type]} · {activity.product ?? activity.reason ?? (activity.weightKg ? `${activity.weightKg} kg` : "Registro")}</p>
                  <span>{formatDate(activity.date)} · {activity.animalIds.length} {activity.animalIds.length === 1 ? "animal" : "animales"}</span>
                </span>
                <strong>{activity.cost ? formatCompactCurrency(activity.cost) : "—"}</strong>
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            ))}
          </Card>
        ) : (
          <EmptyState icon={SearchX} title="Todavía no hay actividad" description="Los registros de alimento, peso y salud aparecerán en esta bitácora." />
        )}
      </section>
    </div>
  );
}
