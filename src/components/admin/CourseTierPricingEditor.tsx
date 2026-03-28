"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type DiscountConfig, computeFinalPrice } from "@/lib/types/discount";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TierEditorState {
  readonly priceBasic: number;
  readonly priceProfessional: number;
  readonly priceAdvanced: number;
  readonly featuresBasic: ReadonlyArray<string>;
  readonly featuresProfessional: ReadonlyArray<string>;
  readonly featuresAdvanced: ReadonlyArray<string>;
  readonly discountBasic: DiscountConfig | null;
  readonly discountProfessional: DiscountConfig | null;
  readonly discountAdvanced: DiscountConfig | null;
  readonly popularTier: string | null;
}

interface CourseTierPricingEditorProps {
  readonly value: TierEditorState;
  readonly onChange: (next: TierEditorState) => void;
}

/* ------------------------------------------------------------------ */
/*  Sub-component: per-tier editor                                      */
/* ------------------------------------------------------------------ */

interface TierCardProps {
  readonly label: string;
  readonly colorClass: string;
  readonly price: number;
  readonly features: ReadonlyArray<string>;
  readonly discount: DiscountConfig | null;
  readonly onPriceChange: (v: number) => void;
  readonly onFeaturesChange: (v: ReadonlyArray<string>) => void;
  readonly onDiscountChange: (v: DiscountConfig | null) => void;
}

function TierCard({
  label,
  colorClass,
  price,
  features,
  discount,
  onPriceChange,
  onFeaturesChange,
  onDiscountChange,
}: TierCardProps) {
  function handleDiscountToggle(active: boolean) {
    if (!active) {
      onDiscountChange(null);
      return;
    }
    onDiscountChange({ type: "percent", value: 0, active: true });
  }

  function handleDiscountType(type: "percent" | "fixed") {
    onDiscountChange({
      type,
      value: discount?.value ?? 0,
      active: discount?.active ?? true,
    });
  }

  function handleDiscountValue(raw: string) {
    const val = raw === "" ? 0 : parseFloat(raw) || 0;
    onDiscountChange({
      type: discount?.type ?? "percent",
      value: val,
      active: discount?.active ?? true,
    });
  }

  const discountActive = !!discount;

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${colorClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>

      {/* Price */}
      <div>
        <Label className="text-xs text-gray-500">Price (₱)</Label>
        <Input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            onPriceChange(val === "" ? 0 : parseFloat(val) || 0);
          }}
          className="mt-1"
        />
      </div>

      {/* Discount */}
      <div>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={discountActive}
            onChange={(e) => handleDiscountToggle(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
          />
          <span className="text-gray-600 font-medium">Apply discount</span>
        </label>

        {discountActive && discount && (
          <div className="mt-2 space-y-1.5 pl-1">
            <div className="flex gap-2">
              <select
                value={discount.type}
                onChange={(e) => handleDiscountType(e.target.value as "percent" | "fixed")}
                className="flex-1 h-7 rounded border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="percent">% Percent off</option>
                <option value="fixed">₱ Fixed amount off</option>
              </select>
              <Input
                type="text"
                inputMode="decimal"
                value={discount.value}
                onChange={(e) => handleDiscountValue(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder={discount.type === "percent" ? "e.g. 20" : "e.g. 500"}
                className="w-24 h-7 text-xs"
              />
            </div>
            <p className="text-xs text-gray-400">
              Final price: ₱{computeFinalPrice(price, discount).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Features */}
      <div>
        <Label className="text-xs text-gray-500">Features</Label>
        <div className="space-y-1 mt-1">
          {features.map((f, i) => (
            <div key={i} className="flex gap-1">
              <Input
                value={f}
                onChange={(e) =>
                  onFeaturesChange(features.map((x, j) => (j === i ? e.target.value : x)))
                }
                placeholder={`Feature ${i + 1}`}
                className="text-xs h-7"
              />
              {features.length > 1 && (
                <button
                  type="button"
                  onClick={() => onFeaturesChange(features.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onFeaturesChange([...features, ""])}
          className="text-xs text-gray-500 hover:text-gray-700 mt-1 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Add feature
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function CourseTierPricingEditor({ value, onChange }: CourseTierPricingEditorProps) {
  function update(patch: Partial<TierEditorState>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="block">Course Tier Pricing &amp; Features</Label>
        <p className="text-xs text-gray-500 mt-0.5">
          Set price, optional discounts, and features per tier. All changes sync to the enrollment page automatically.
        </p>
      </div>

      {/* Most Popular Tier selector */}
      <div>
        <Label htmlFor="c-popular-tier" className="text-xs text-gray-600">
          Most Popular Tier
        </Label>
        <select
          id="c-popular-tier"
          value={value.popularTier ?? ""}
          onChange={(e) => update({ popularTier: e.target.value || null })}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
        >
          <option value="">None</option>
          <option value="BASIC">Basic</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      {/* Three tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TierCard
          label="Basic"
          colorClass="border-gray-200"
          price={value.priceBasic}
          features={value.featuresBasic}
          discount={value.discountBasic}
          onPriceChange={(v) => update({ priceBasic: v })}
          onFeaturesChange={(v) => update({ featuresBasic: v })}
          onDiscountChange={(v) => update({ discountBasic: v })}
        />
        <TierCard
          label="Professional"
          colorClass="border-blue-200 bg-blue-50/30"
          price={value.priceProfessional}
          features={value.featuresProfessional}
          discount={value.discountProfessional}
          onPriceChange={(v) => update({ priceProfessional: v })}
          onFeaturesChange={(v) => update({ featuresProfessional: v })}
          onDiscountChange={(v) => update({ discountProfessional: v })}
        />
        <TierCard
          label="Advanced"
          colorClass="border-purple-200 bg-purple-50/30"
          price={value.priceAdvanced}
          features={value.featuresAdvanced}
          discount={value.discountAdvanced}
          onPriceChange={(v) => update({ priceAdvanced: v })}
          onFeaturesChange={(v) => update({ featuresAdvanced: v })}
          onDiscountChange={(v) => update({ discountAdvanced: v })}
        />
      </div>
    </div>
  );
}
