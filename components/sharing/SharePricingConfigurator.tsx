"use client";

import { useState } from "react";

import { formatMinorMoney } from "@/lib/pricing/calculate";
import type { PricingLineItemData, PricingTotalsData } from "@/lib/types";

interface PricingState { items: PricingLineItemData[]; totals: PricingTotalsData }

export default function SharePricingConfigurator({ token, initial }: { token: string; initial: PricingState }) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setSaving(true); setMessage("");
    const response = await fetch(`/api/share/${token}/pricing`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selections: state.items.map((item) => ({ key: item.key, selected: item.selected, quantityMilli: item.quantityMilli })) }) });
    const body = await response.json().catch(() => null) as { error?: string; state?: PricingState } | null;
    setSaving(false);
    if (!response.ok || !body?.state) { setMessage(body?.error ?? "Pricing could not be updated."); return; }
    setState(body.state); setMessage("Selection saved.");
  }
  return <section className="mx-auto my-8 w-[min(92%,720px)] rounded-3xl bg-white p-6 shadow-lg sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Customize</p><h2 className="mt-2 text-2xl font-semibold text-stone-900">Optional pricing</h2><p className="mt-2 text-sm text-stone-600">Choose optional services and quantities, then save the total before approval.</p><div className="mt-5 divide-y divide-stone-200 rounded-2xl border border-stone-200">{state.items.filter((item) => item.optional).map((item) => <div key={item.key} className="grid grid-cols-[1fr_auto] items-center gap-3 p-4"><label className="flex items-start gap-3 text-sm font-semibold text-stone-800"><input type="checkbox" checked={item.selected} onChange={(event) => setState((current) => ({ ...current, items: current.items.map((row) => row.key === item.key ? { ...row, selected: event.target.checked } : row) }))} className="mt-0.5 size-4 accent-emerald-800" />{item.description}</label><div className="flex items-center gap-2">{item.quantityEditable ? <input aria-label={`Quantity for ${item.description}`} type="number" min="0.001" step="0.001" value={item.quantityMilli / 1000} onChange={(event) => setState((current) => ({ ...current, items: current.items.map((row) => row.key === item.key ? { ...row, quantityMilli: Math.max(1, Math.round(Number(event.target.value) * 1000)) } : row) }))} className="h-9 w-20 rounded-lg border border-stone-300 px-2 text-right text-sm" /> : null}<span className="min-w-24 text-right text-sm font-semibold">{formatMinorMoney(item.totalMinor, state.totals.currency)}</span></div></div>)}</div><div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4"><span className="font-semibold text-stone-700">Selected total</span><span className="text-2xl font-bold text-emerald-950">{formatMinorMoney(state.totals.totalMinor, state.totals.currency)}</span></div>{message ? <p className={`mt-2 text-sm ${message === "Selection saved." ? "text-emerald-700" : "text-red-700"}`} role="status">{message}</p> : null}<button type="button" disabled={saving} onClick={() => void save()} className="mt-4 h-12 w-full rounded-xl bg-emerald-950 font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Save pricing selection"}</button></section>;
}
