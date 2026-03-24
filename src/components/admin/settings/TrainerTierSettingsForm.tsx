"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Check, Plus, X, TrendingUp } from "lucide-react";
import type { TrainerTierConfig } from "@/lib/repositories/trainer-tier.repository";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const TIER_META: Record<string, { color: string; badge: string }> = {
  BASIC: { color: "border-gray-300 bg-gray-50", badge: "bg-gray-100 text-gray-700" },
  PROFESSIONAL: { color: "border-blue-300 bg-blue-50", badge: "bg-blue-100 text-blue-700" },
  PREMIUM: { color: "border-amber-300 bg-amber-50", badge: "bg-amber-100 text-amber-700" },
};

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v) || 0;
}

/* ------------------------------------------------------------------ */
/*  Single-tier card                                                    */
/* ------------------------------------------------------------------ */

interface TierCardProps {
  readonly config: TrainerTierConfig;
}

function TierCard({ config }: TierCardProps) {
  const [label, setLabel] = React.useState(config.label);
  const [upgradeFee, setUpgradeFee] = React.useState(toNumber(config.upgradeFee));
  const [baseProgramPrice, setBaseProgramPrice] = React.useState(toNumber(config.baseProgramPrice));
  const [benefits, setBenefits] = React.useState<string[]>(config.benefits);
  const [maxCapacity, setMaxCapacity] = React.useState(config.maxCapacity);
  const [revenueSharePct, setRevenueSharePct] = React.useState(config.revenueSharePct);
  const [isActive, setIsActive] = React.useState(config.isActive);
  const [newBenefit, setNewBenefit] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const totalPrice = baseProgramPrice + upgradeFee;
  const platformPct = 100 - revenueSharePct;
  const meta = TIER_META[config.tier] ?? TIER_META.BASIC;

  function addBenefit() {
    const trimmed = newBenefit.trim();
    if (!trimmed || benefits.length >= 10) return;
    setBenefits([...benefits, trimmed]);
    setNewBenefit("");
    setSaved(false);
  }

  function removeBenefit(index: number) {
    setBenefits(benefits.filter((_, i) => i !== index));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/settings/trainer-tiers/${config.tier.toLowerCase()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, upgradeFee, baseProgramPrice, benefits, maxCapacity, revenueSharePct, isActive }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-xl border-2 ${meta.color} p-6 space-y-5`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.badge}`}>
            {config.tier}
          </span>
          <Input
            value={label}
            onChange={(e) => { setLabel(e.target.value); setSaved(false); }}
            className="h-8 w-48 font-semibold text-gray-800 bg-white"
            placeholder="Tier label"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`active-${config.tier}`} className="text-sm text-gray-500">Active</Label>
          <Switch
            id={`active-${config.tier}`}
            checked={isActive}
            onCheckedChange={(v) => { setIsActive(v); setSaved(false); }}
          />
        </div>
      </div>

      {/* Pricing grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`base-${config.tier}`}>Base Program Price (₱)</Label>
          <Input
            id={`base-${config.tier}`}
            type="number"
            min={0}
            value={baseProgramPrice}
            onChange={(e) => { setBaseProgramPrice(Number(e.target.value)); setSaved(false); }}
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label htmlFor={`fee-${config.tier}`}>Upgrade Fee (₱)</Label>
          <Input
            id={`fee-${config.tier}`}
            type="number"
            min={0}
            value={upgradeFee}
            onChange={(e) => { setUpgradeFee(Number(e.target.value)); setSaved(false); }}
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label htmlFor={`cap-${config.tier}`}>Max Students / Class</Label>
          <Input
            id={`cap-${config.tier}`}
            type="number"
            min={1}
            max={100}
            value={maxCapacity}
            onChange={(e) => { setMaxCapacity(Number(e.target.value)); setSaved(false); }}
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label htmlFor={`rev-${config.tier}`}>Trainer Revenue Share (%)</Label>
          <Input
            id={`rev-${config.tier}`}
            type="number"
            min={1}
            max={100}
            value={revenueSharePct}
            onChange={(e) => { setRevenueSharePct(Number(e.target.value)); setSaved(false); }}
            className="mt-1 font-mono"
          />
        </div>
      </div>

      {/* Live preview */}
      <div className="flex gap-4 text-sm rounded-lg bg-white border border-gray-200 px-4 py-3">
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Total Price</p>
          <p className="font-bold text-gray-900 text-lg">₱{totalPrice.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">₱{baseProgramPrice.toLocaleString()} base + ₱{upgradeFee.toLocaleString()} upgrade</p>
        </div>
        <div className="w-px bg-gray-200" />
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Revenue Split
          </p>
          <p className="font-bold text-gray-900 text-lg">{revenueSharePct}% / {platformPct}%</p>
          <p className="text-gray-400 text-xs">Trainer / Platform</p>
        </div>
      </div>

      {/* Benefits */}
      <div>
        <Label className="mb-2 block">Tier Benefits</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {benefits.map((b, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1 text-sm text-gray-700"
            >
              {b}
              <button
                type="button"
                onClick={() => removeBenefit(i)}
                className="text-gray-400 hover:text-red-500 ml-1"
                aria-label={`Remove benefit: ${b}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBenefit(); } }}
            placeholder="Add a benefit…"
            maxLength={100}
            className="bg-white"
          />
          <Button type="button" variant="outline" size="sm" onClick={addBenefit} disabled={!newBenefit.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Save */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      <div className="flex items-center gap-3 pt-1">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : `Save ${config.tier.charAt(0) + config.tier.slice(1).toLowerCase()} Tier`}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main form (all 3 tiers)                                             */
/* ------------------------------------------------------------------ */

interface TrainerTierSettingsFormProps {
  readonly initialConfigs: TrainerTierConfig[];
}

export function TrainerTierSettingsForm({ initialConfigs }: TrainerTierSettingsFormProps) {
  return (
    <div className="space-y-6">
      {initialConfigs.map((config) => (
        <TierCard key={config.tier} config={config} />
      ))}
    </div>
  );
}
