import { useId, useState } from "react";
import { Check, Copy, MoreHorizontal, MoveRight, X } from "lucide-react";
import { dateKey, type Slot } from "./lib/planner";

type Props = {
  sourceDay: string;
  slot: Slot;
  weekDays: Date[];
  busy: boolean;
  onCopy: (slot: Slot, destinationDay: string) => Promise<void>;
  onMove: (slot: Slot, destinationDay: string) => Promise<void>;
};

type Action = "copy" | "move";

// As ações são contextuais: visíveis ao passar o mouse/focar com teclado;
// em telas de toque, um botão de três pontos abre as mesmas opções.
export default function CopyMealAction({ sourceDay, slot, weekDays, busy, onCopy, onMove }: Props) {
  const [action, setAction] = useState<Action | null>(null);
  const [destination, setDestination] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const panelId = useId();
  const selectId = useId();
  const disabled = busy || submitting;

  const options = weekDays
    .map(day => ({
      key: dateKey(day),
      label: day.toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "short",
      }),
    }))
    .filter(day => day.key !== sourceDay);

  function choose(next: Action) {
    if (disabled) return;
    setAction(next);
    setDestination("");
    setMobileOpen(false);
  }

  function close() {
    if (disabled) return;
    setAction(null);
    setDestination("");
    setMobileOpen(false);
  }

  async function confirmAction() {
    if (disabled || !action || !options.some(option => option.key === destination)) return;
    setSubmitting(true);
    try {
      if (action === "copy") await onCopy(slot, destination);
      else await onMove(slot, destination);
      setAction(null);
      setDestination("");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className={action ? "cc-meal-actions is-open" : "cc-meal-actions"}
    onKeyDown={event => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    }}>
    <div className="cc-meal-quick-actions" role="group" aria-label={"Ações de " + slot.toLowerCase()}>
      <div className="cc-meal-desktop-buttons">
        <button type="button" className="cc-meal-action-icon" title="Copiar refeição"
          aria-label={"Copiar " + slot.toLowerCase()} disabled={disabled}
          onClick={() => choose("copy")}>
          <Copy size={16}/>
        </button>
        <button type="button" className="cc-meal-action-icon" title="Mover refeição"
          aria-label={"Mover " + slot.toLowerCase()} disabled={disabled}
          onClick={() => choose("move")}>
          <MoveRight size={17}/>
        </button>
      </div>
      <button type="button" className="cc-meal-mobile-trigger"
        aria-label={"Ações para " + slot.toLowerCase()}
        aria-expanded={mobileOpen} aria-controls={panelId}
        disabled={disabled} onClick={() => { setMobileOpen(current => !current); setAction(null); }}>
        <MoreHorizontal size={21}/>
      </button>
    </div>

    {mobileOpen && <div className="cc-meal-mobile-menu" id={panelId}>
      <button type="button" disabled={disabled} onClick={() => choose("copy")}>
        <Copy size={16}/> Copiar refeição
      </button>
      <button type="button" disabled={disabled} onClick={() => choose("move")}>
        <MoveRight size={17}/> Mover refeição
      </button>
    </div>}

    {action && <form className="cc-meal-action-editor"
      aria-label={(action === "copy" ? "Copiar" : "Mover") + " " + slot.toLowerCase()}
      onSubmit={event => { event.preventDefault(); void confirmAction(); }}>
      <div className="cc-meal-action-title">
        {action === "copy" ? <Copy size={16}/> : <MoveRight size={17}/>}
        <strong>{action === "copy" ? "Copiar refeição" : "Mover refeição"}</strong>
        <button type="button" className="cc-meal-action-close" aria-label="Fechar ações"
          disabled={disabled} onClick={close}><X size={16}/></button>
      </div>
      <div className="cc-meal-action-fields">
        <label htmlFor={selectId}>Dia de destino</label>
        <select id={selectId} required value={destination} disabled={disabled}
          onChange={event => setDestination(event.target.value)}>
          <option value="">Selecione o dia</option>
          {options.map(day => <option value={day.key} key={day.key}>{day.label}</option>)}
        </select>
        <button type="submit" className="cc-meal-action-confirm"
          disabled={disabled || !destination}>
          <Check size={15}/> {action === "copy" ? "Continuar cópia" : "Continuar transferência"}
        </button>
      </div>
      <p>{action === "copy"
        ? "A refeição original será mantida."
        : "A refeição sairá do dia atual. Você poderá revisar a operação antes de confirmar."}</p>
    </form>}
  </div>;
}
