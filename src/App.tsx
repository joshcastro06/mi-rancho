import { useEffect, useState } from "react";
import { Beef, Check, CloudOff, Home, Plus, Settings, TrendingUp, Wifi } from "lucide-react";
import { RanchProvider, useRanch } from "./state/RanchContext";
import { Button, IconButton } from "./components/ui";
import type { RegisterKind } from "./lib/catalog";
import type { TargetType } from "./types";
import HomeScreen from "./screens/HomeScreen";
import CattleScreen from "./screens/CattleScreen";
import AnimalDetail from "./screens/AnimalDetail";
import LotDetail from "./screens/LotDetail";
import AnimalForm from "./screens/AnimalForm";
import LotForm from "./screens/LotForm";
import RegisterScreen from "./screens/RegisterScreen";
import SummaryScreen from "./screens/SummaryScreen";
import SettingsScreen from "./screens/SettingsScreen";

type PrimaryView = "home" | "cattle" | "register" | "summary";
type View = PrimaryView | "settings" | "animal" | "lot" | "animal-form" | "lot-form";

const navItems: { id: PrimaryView; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "cattle", label: "Ganado", icon: Beef },
  { id: "register", label: "Registrar", icon: Plus },
  { id: "summary", label: "Resumen", icon: TrendingUp },
];

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function AppShell() {
  const { state } = useRanch();
  const [view, setView] = useState<View>("home");
  const [selectedId, setSelectedId] = useState<string>();
  const [registerKind, setRegisterKind] = useState<RegisterKind>("feed");
  const [registerTarget, setRegisterTarget] = useState<{ type: TargetType; id: string }>();
  const [toast, setToast] = useState("");
  const online = useOnlineStatus();
  const isPrimary = ["home", "cattle", "register", "summary"].includes(view);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const goPrimary = (next: PrimaryView) => {
    setView(next);
    if (next !== "register") setRegisterTarget(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openRegister = (kind: RegisterKind, target?: { type: TargetType; id: string }) => {
    setRegisterKind(kind);
    setRegisterTarget(target);
    setView("register");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderView = () => {
    switch (view) {
      case "home":
        return (
          <HomeScreen
            openRegister={openRegister}
            openCattle={() => goPrimary("cattle")}
            openAnimal={(id) => { setSelectedId(id); setView("animal"); }}
            openLot={(id) => { setSelectedId(id); setView("lot"); }}
          />
        );
      case "cattle":
        return (
          <CattleScreen
            onAddAnimal={() => { setSelectedId(undefined); setView("animal-form"); }}
            onAddLot={() => { setSelectedId(undefined); setView("lot-form"); }}
            onAnimal={(id) => { setSelectedId(id); setView("animal"); }}
            onLot={(id) => { setSelectedId(id); setView("lot"); }}
          />
        );
      case "register":
        return (
          <RegisterScreen
            initialKind={registerKind}
            presetTarget={registerTarget}
            onGoHome={(message) => { setToast(message); goPrimary("home"); }}
            onViewAnimal={(id) => { setSelectedId(id); setView("animal"); }}
            onViewLot={(id) => { setSelectedId(id); setView("lot"); }}
            onViewSummary={() => goPrimary("summary")}
          />
        );
      case "summary":
        return <SummaryScreen onSale={() => openRegister("sale")} />;
      case "settings":
        return <SettingsScreen online={online} onBack={() => goPrimary("home")} onSaved={() => setToast("Ajustes guardados")} />;
      case "animal-form":
        return (
          <AnimalForm
            animalId={selectedId}
            onBack={() => (selectedId ? setView("animal") : goPrimary("cattle"))}
            onSaved={() => { setToast(selectedId ? "Animal actualizado" : "Animal agregado"); selectedId ? setView("animal") : goPrimary("cattle"); }}
          />
        );
      case "lot-form":
        return (
          <LotForm
            lotId={selectedId}
            onBack={() => (selectedId ? setView("lot") : goPrimary("cattle"))}
            onSaved={() => { setToast(selectedId ? "Lote actualizado" : "Lote creado"); selectedId ? setView("lot") : goPrimary("cattle"); }}
          />
        );
      case "animal":
        return (
          <AnimalDetail
            id={selectedId ?? ""}
            onBack={() => goPrimary("cattle")}
            onEdit={() => setView("animal-form")}
            onRegister={(kind) => openRegister(kind, selectedId ? { type: "animal", id: selectedId } : undefined)}
          />
        );
      case "lot":
        return (
          <LotDetail
            id={selectedId ?? ""}
            onBack={() => goPrimary("cattle")}
            onEdit={() => setView("lot-form")}
            onAnimal={(id) => { setSelectedId(id); setView("animal"); }}
          />
        );
    }
  };

  return (
    <div className="app-canvas">
      <div className="phone-shell">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark"><Beef size={22} aria-hidden="true" /></span>
            <div>
              <p className="brand-name">{state.profile.ranchName}</p>
              <p className={`connection ${online ? "" : "connection--offline"}`}>
                {online ? <Wifi size={12} aria-hidden="true" /> : <CloudOff size={12} aria-hidden="true" />}
                {online ? "En línea" : "Sin conexión"}
              </p>
            </div>
          </div>
          {isPrimary ? <IconButton label="Abrir ajustes" icon={Settings} onClick={() => setView("settings")} /> : null}
        </header>

        <main className={isPrimary ? "main-content" : "main-content main-content--detail"}>{renderView()}</main>

        {isPrimary ? (
          <nav className="bottom-nav" aria-label="Navegación principal">
            {navItems.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                className={`nav-item ${view === id ? "nav-item--active" : ""} ${id === "register" ? "nav-item--register" : ""}`}
                onClick={() => goPrimary(id)}
                aria-current={view === id ? "page" : undefined}
              >
                <span className="nav-item__icon"><Icon size={id === "register" ? 24 : 21} aria-hidden="true" /></span>
                <span>{label}</span>
              </Button>
            ))}
          </nav>
        ) : null}

        {toast ? (
          <div className="toast" role="status">
            <Check size={18} aria-hidden="true" />
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RanchProvider>
      <AppShell />
    </RanchProvider>
  );
}
