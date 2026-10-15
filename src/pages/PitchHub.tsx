import { useState } from "react";
import Pitch from "@/pages/Pitch";
import PitchAgent from "@/pages/PitchAgent";

export default function PitchHub() {
  const [mode, setMode] = useState<"agent" | "dolmetscher">("agent");
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-extrabold text-slate-900">Pitch</h1>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {(
          [
            ["agent", "KI-Sprachagent"],
            ["dolmetscher", "Dolmetscher"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setMode(v)}
            className={`rounded-lg py-2 ${mode === v ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        {mode === "agent" ? <PitchAgent /> : <Pitch embedded />}
      </div>
    </div>
  );
}
