import { useState, type FormEvent } from "react";
import { Check, CloudOff, Database, RotateCcw, Wifi } from "lucide-react";
import { BackButton, Button, Card, ConfirmDialog, Field, ScreenHeading } from "../components/ui";
import { storageSnapshot } from "../lib/metrics";
import { useRanch } from "../state/RanchContext";

export default function SettingsScreen({
  online,
  onBack,
  onSaved,
}: {
  online: boolean;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { state, updateProfile, resetDemo } = useRanch();
  const [ranchName, setRanchName] = useState(state.profile.ranchName);
  const [ownerName, setOwnerName] = useState(state.profile.ownerName);
  const [confirmReset, setConfirmReset] = useState(false);
  const storage = storageSnapshot(state);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile({ ...state.profile, ranchName: ranchName.trim() || state.profile.ranchName, ownerName: ownerName.trim() || state.profile.ownerName });
    onSaved();
  };

  return (
    <div className="screen-stack screen-enter">
      <div className="detail-bar"><BackButton onClick={onBack} /></div>
      <ScreenHeading eyebrow="Preferencias" title="Ajustes del rancho" description="Estos datos solo se guardan en este dispositivo." />
      <form className="form-card" onSubmit={submit}>
        <Field label="Nombre de la finca" value={ranchName} onChange={(event) => setRanchName(event.target.value)} required />
        <Field label="Nombre del productor" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required />
        <div className="settings-note">
          {online ? <Wifi size={19} /> : <CloudOff size={19} />}
          <div>
            <strong>{online ? "Con conexión" : "Sin conexión"}</strong>
            <p>Los registros se conservan localmente y funcionan aun cuando no hay señal.</p>
          </div>
        </div>
        <div className="settings-note">
          <Database size={19} />
          <div>
            <strong>Almacenamiento local</strong>
            <p>Mi Rancho usa {storage.label} en este navegador. No se envía nada a un servidor.</p>
            <div className="storage-track" aria-hidden="true"><span style={{ width: `${Math.min(100, (storage.bytes / 50000) * 100)}%` }} /></div>
          </div>
        </div>
        <Button type="submit" className="full-width" icon={Check}>Guardar cambios</Button>
      </form>
      <Card className="danger-zone">
        <div><strong>Datos de demostración</strong><p>Restaura los animales, actividades y ventas de ejemplo.</p></div>
        <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Restaurar</Button>
      </Card>
      {confirmReset ? (
        <ConfirmDialog
          title="¿Restaurar la demostración?"
          description="Se perderán los cambios guardados en este dispositivo y volverán los datos de ejemplo de Honorio."
          confirmLabel="Restaurar datos"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => { resetDemo(); setConfirmReset(false); onSaved(); }}
        />
      ) : null}
    </div>
  );
}
