import { useMemo, useState } from "react";
import { Beef, Plus, SearchX, Users, ChevronRight } from "lucide-react";
import { Button, EmptyState, ScreenHeading, SearchField, Segmented, Tag } from "../components/ui";
import { formatCompactCurrency } from "../lib/format";
import { averageWeight, lotAnimals, lotCost } from "../lib/metrics";
import { useRanch } from "../state/RanchContext";

export default function CattleScreen({
  onAddAnimal,
  onAddLot,
  onAnimal,
  onLot,
}: {
  onAddAnimal: () => void;
  onAddLot: () => void;
  onAnimal: (id: string) => void;
  onLot: (id: string) => void;
}) {
  const { state } = useRanch();
  const [tab, setTab] = useState("animals");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [lotFilter, setLotFilter] = useState("all");

  const filteredAnimals = useMemo(() => state.animals.filter((animal) => {
    const lot = state.lots.find((item) => item.id === animal.lotId)?.name ?? "";
    const matchesQuery = `${animal.earTag} ${animal.name ?? ""} ${lot}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || animal.status === status;
    const matchesLot = lotFilter === "all" || animal.lotId === lotFilter;
    return matchesQuery && matchesStatus && matchesLot;
  }), [state.animals, state.lots, query, status, lotFilter]);

  const filteredLots = state.lots.filter((lot) => lot.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="screen-stack screen-enter">
      <ScreenHeading eyebrow="Inventario" title="Tu ganado" description="Consulta animales, lotes y su rendimiento." />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "animals", label: `Animales · ${state.animals.length}` },
          { value: "lots", label: `Lotes · ${state.lots.length}` },
        ]}
      />
      <SearchField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={tab === "animals" ? "Buscar chapeta, nombre o lote" : "Buscar lote"}
      />

      {tab === "animals" ? (
        <>
          <div className="filter-row" role="group" aria-label="Filtros de ganado">
            {[
              { value: "active", label: "Activos" },
              { value: "sold", label: "Vendidos" },
              { value: "all", label: "Todos" },
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                className={`filter-chip ${status === option.value ? "filter-chip--active" : ""}`}
                onClick={() => setStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
            <span className="filter-divider" />
            <Button
              type="button"
              variant="ghost"
              className={`filter-chip ${lotFilter === "all" ? "filter-chip--active" : ""}`}
              onClick={() => setLotFilter("all")}
            >
              Todos los lotes
            </Button>
            {state.lots.map((lot) => (
              <Button
                key={lot.id}
                type="button"
                variant="ghost"
                className={`filter-chip ${lotFilter === lot.id ? "filter-chip--active" : ""}`}
                onClick={() => setLotFilter(lot.id)}
              >
                {lot.name}
              </Button>
            ))}
          </div>
          <div className="section-heading section-heading--compact">
            <p className="list-count">{filteredAnimals.length} resultados</p>
            <Button variant="primary" icon={Plus} onClick={onAddAnimal}>Animal</Button>
          </div>
          <div className="list-stack">
            {filteredAnimals.map((animal) => {
              const lot = state.lots.find((item) => item.id === animal.lotId);
              return (
                <Button key={animal.id} variant="ghost" className="animal-card" onClick={() => onAnimal(animal.id)}>
                  <span className="animal-avatar"><Beef size={23} aria-hidden="true" /></span>
                  <span className="animal-card__main">
                    <span className="animal-card__title">#{animal.earTag} {animal.name ? `· ${animal.name}` : ""}</span>
                    <span className="animal-card__meta">{animal.breed} · {lot?.name}</span>
                  </span>
                  <span className="animal-card__stats">
                    <strong>{animal.currentWeight} kg</strong>
                    <Tag tone={animal.status === "active" ? "success" : "neutral"}>{animal.status === "active" ? "Activo" : "Vendido"}</Tag>
                  </span>
                </Button>
              );
            })}
            {!filteredAnimals.length ? (
              <EmptyState
                icon={SearchX}
                title={state.animals.length ? "No encontramos animales" : "Aún no hay animales"}
                description={state.animals.length ? "Prueba otro término o cambia los filtros." : "Agrega el primero para empezar a registrar el trabajo de campo."}
                action={!state.animals.length ? <Button icon={Plus} onClick={onAddAnimal}>Agregar animal</Button> : undefined}
              />
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="section-heading section-heading--compact">
            <p className="list-count">{filteredLots.length} resultados</p>
            <Button variant="primary" icon={Plus} onClick={onAddLot}>Lote</Button>
          </div>
          <div className="list-stack">
            {filteredLots.map((lot) => {
              const animals = lotAnimals(state, lot.id);
              return (
                <Button key={lot.id} variant="ghost" className="lot-card" onClick={() => onLot(lot.id)}>
                  <span className="lot-card__icon"><Users size={22} aria-hidden="true" /></span>
                  <span className="lot-card__body">
                    <strong>{lot.name}</strong>
                    <span>{animals.length} animales · {averageWeight(animals)} kg prom.</span>
                    <span className="lot-card__cost">Costos: {formatCompactCurrency(lotCost(state, lot.id))}</span>
                  </span>
                  <ChevronRight size={19} aria-hidden="true" />
                </Button>
              );
            })}
            {!filteredLots.length ? (
              <EmptyState
                icon={Users}
                title="Sin lotes"
                description="Crea un lote para agrupar animales y registrar tareas más rápido."
                action={<Button icon={Plus} onClick={onAddLot}>Crear lote</Button>}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
