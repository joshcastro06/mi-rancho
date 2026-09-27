import { useState } from "react";
import { CircleDollarSign, Scale, ShoppingCart, TrendingUp } from "lucide-react";
import { Button, Card, EmptyState, ScreenHeading, Segmented } from "../components/ui";
import { formatCompactCurrency, formatCurrency, formatDate } from "../lib/format";
import {
  activeAnimals,
  averageWeight,
  costByTypes,
  feedQuantity,
  getAlerts,
  lotAnimals,
  lotFinance,
  monthActivityCost,
  monthSalesRevenue,
  recentWeightDelta,
  totalActivityCost,
} from "../lib/metrics";
import { useRanch } from "../state/RanchContext";

export default function SummaryScreen({ onSale }: { onSale: () => void }) {
  const { state } = useRanch();
  const [tab, setTab] = useState("production");
  const animals = activeAnimals(state);
  const alerts = getAlerts(state);
  const feed = feedQuantity(state);
  const revenue = state.sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const costs = totalActivityCost(state);
  const profit = state.sales.reduce((sum, sale) => sum + sale.netProfit, 0);
  const feedCost = costByTypes(state, ["feed"]);
  const vetCost = costByTypes(state, ["vaccine", "deworming", "treatment"]);
  const delta = recentWeightDelta(state);
  const maxLot = Math.max(...state.lots.map((lot) => lotAnimals(state, lot.id).length), 1);
  const financeLots = lotFinance(state);
  const maxLotMoney = Math.max(...financeLots.map((item) => Math.max(item.cost, item.revenue)), 1);

  return (
    <div className="screen-stack screen-enter">
      <ScreenHeading eyebrow="Decisiones claras" title="Resumen del rancho" description="Producción y cuentas, sin enredos." />
      <Segmented value={tab} onChange={setTab} options={[{ value: "production", label: "Producción" }, { value: "finance", label: "Finanzas" }]} />

      {tab === "production" ? (
        <>
          <section className="summary-hero summary-hero--production">
            <span><Scale size={24} /></span>
            <p>Peso promedio del hato</p>
            <strong>{averageWeight(animals)} <small>kg</small></strong>
            <div><TrendingUp size={16} /> {delta >= 0 ? "+" : ""}{delta} kg en el último pesaje promedio</div>
          </section>
          <div className="metric-grid">
            <Card className="metric-card"><p className="metric-card__label">Hato activo</p><p className="metric-card__value">{animals.length}</p><p className="metric-card__caption">{state.lots.length} lotes</p></Card>
            <Card className="metric-card"><p className="metric-card__label">Alimento registrado</p><p className="metric-card__value">{feed}</p><p className="metric-card__caption">kg acumulados</p></Card>
            <Card className="metric-card metric-card--wide">
              <div>
                <p className="metric-card__label">Próximos controles</p>
                <p className="metric-card__value">{alerts.filter((alert) => alert.days >= 0 && alert.days <= 14).length}</p>
              </div>
              <p className="metric-card__caption">{alerts.filter((alert) => alert.severity === "overdue").length} vencidos</p>
            </Card>
          </div>
          <section>
            <div className="section-heading"><h2>Animales por lote</h2></div>
            <Card className="bar-list">
              {state.lots.map((lot) => {
                const count = lotAnimals(state, lot.id).length;
                return (
                  <div className="bar-row" key={lot.id}>
                    <div><span>{lot.name}</span><strong>{count}</strong></div>
                    <div className="bar-track"><span style={{ "--bar-width": `${(count / maxLot) * 100}%` } as React.CSSProperties} /></div>
                  </div>
                );
              })}
              {!state.lots.length ? <p className="muted">Crea lotes para ver esta comparación.</p> : null}
            </Card>
          </section>
        </>
      ) : (
        <>
          <section className="summary-hero summary-hero--finance">
            <span><CircleDollarSign size={24} /></span>
            <p>Ganancia neta realizada</p>
            <strong>{formatCurrency(profit)}</strong>
            <div>{state.sales.length} {state.sales.length === 1 ? "venta registrada" : "ventas registradas"}</div>
          </section>
          <div className="metric-grid">
            <Card className="metric-card"><p className="metric-card__label">Ingresos</p><p className="metric-card__money positive">{formatCompactCurrency(revenue)}</p></Card>
            <Card className="metric-card"><p className="metric-card__label">Gastos registrados</p><p className="metric-card__money">{formatCompactCurrency(costs)}</p></Card>
            <Card className="metric-card"><p className="metric-card__label">Alimentación</p><p className="metric-card__money">{formatCompactCurrency(feedCost)}</p></Card>
            <Card className="metric-card"><p className="metric-card__label">Veterinaria</p><p className="metric-card__money">{formatCompactCurrency(vetCost)}</p></Card>
          </div>
          <section>
            <div className="section-heading"><h2>Periodo reciente</h2></div>
            <Card className="period-grid">
              <div><span>Este mes · costos</span><strong className="negative">{formatCompactCurrency(monthActivityCost(state, 0))}</strong></div>
              <div><span>Mes pasado · costos</span><strong className="negative">{formatCompactCurrency(monthActivityCost(state, -1))}</strong></div>
              <div><span>Este mes · ventas</span><strong className="positive">{formatCompactCurrency(monthSalesRevenue(state, 0))}</strong></div>
              <div><span>Mes pasado · ventas</span><strong className="positive">{formatCompactCurrency(monthSalesRevenue(state, -1))}</strong></div>
            </Card>
          </section>
          <section>
            <div className="section-heading"><h2>Por lote</h2></div>
            <Card className="bar-list">
              {financeLots.map(({ lot, cost, revenue: lotRevenue }) => (
                <div className="bar-row" key={lot.id}>
                  <div><span>{lot.name}</span><strong>{formatCompactCurrency(lotRevenue - cost)}</strong></div>
                  <div className="bar-track"><span style={{ "--bar-width": `${(cost / maxLotMoney) * 100}%` } as React.CSSProperties} /></div>
                  <p className="bar-caption">Costos {formatCompactCurrency(cost)} · Ventas {formatCompactCurrency(lotRevenue)}</p>
                </div>
              ))}
            </Card>
          </section>
          <Button className="full-width" icon={ShoppingCart} onClick={onSale}>Registrar nueva venta</Button>
          <section>
            <div className="section-heading"><h2>Historial de ventas</h2></div>
            <div className="list-stack">
              {state.sales.map((sale) => (
                <Card className="sale-card" key={sale.id}>
                  <div className="sale-card__top">
                    <span className="sale-card__icon"><CircleDollarSign size={20} /></span>
                    <div>
                      <strong>{sale.buyer ?? "Venta de ganado"}</strong>
                      <span>{formatDate(sale.date)} · {sale.animalIds.length} {sale.animalIds.length === 1 ? "animal" : "animales"}</span>
                    </div>
                    <strong>{formatCompactCurrency(sale.totalPrice)}</strong>
                  </div>
                  <div className="sale-card__breakdown">
                    <span>Costos <strong>{formatCompactCurrency(sale.attributedCost)}</strong></span>
                    <span>Utilidad <strong className="positive">{formatCompactCurrency(sale.netProfit)}</strong></span>
                  </div>
                </Card>
              ))}
              {!state.sales.length ? (
                <EmptyState icon={CircleDollarSign} title="Sin ventas todavía" description="Cuando vendas, aquí verás ingreso, costo atribuido y utilidad neta." action={<Button onClick={onSale}>Registrar venta</Button>} />
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
