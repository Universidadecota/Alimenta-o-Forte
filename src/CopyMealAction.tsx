import { useState } from "react";
import { Copy } from "lucide-react";
import { dateKey, type Slot } from "./lib/planner";

type Props = {
  sourceDay: string;
  slot: Slot;
  weekDays: Date[];
  busy: boolean;
  onCopy: (slot: Slot, destinationDay: string) => Promise<void>;
};

// Uma cópia sempre fica na mesma refeição de outro dia da semana.
// O componente é recriado ao trocar dia/slot para evitar destino desatualizado.
export default function CopyMealAction({sourceDay, slot, weekDays, busy, onCopy}: Props) {
  const options = weekDays
    .map(day => ({
      key: dateKey(day),
      label: day.toLocaleDateString("pt-BR", {weekday: "long", day: "2-digit", month: "short"}),
    }))
    .filter(day => day.key !== sourceDay);
  const [destination, setDestination] = useState(options[0]?.key ?? "");
  return <div className="cc-copy-meal">
    <label>
      Copiar {slot.toLowerCase()} para
      <select
        aria-label={"Dia de destino para copiar " + slot}
        value={destination}
        disabled={busy || options.length === 0}
        onChange={event => setDestination(event.target.value)}
      >
        {options.map(day => <option key={day.key} value={day.key}>{day.label}</option>)}
      </select>
    </label>
    <button type="button" className="secondary" disabled={busy || !destination}
      onClick={() => void onCopy(slot, destination)}>
      <Copy size={15}/> Copiar refeição
    </button>
  </div>;
}
