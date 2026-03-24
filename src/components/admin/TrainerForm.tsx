"use client";

import { useState } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/admin/TagInput";
import type { TrainerTierConfig } from "@/lib/repositories/trainer-tier.repository";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TierValue = "BASIC" | "PROFESSIONAL" | "PREMIUM";

interface TrainerData {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly bio: string | null;
  readonly photoUrl: string | null;
  readonly specializations: ReadonlyArray<string>;
  readonly tier: TierValue;
  readonly credentials: string | null;
  readonly certifications: ReadonlyArray<string>;
  readonly industryExperience: string | null;
  readonly yearsOfExperience: number;
}

interface TrainerFormProps {
  readonly editingTrainer: TrainerData | null;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly tierConfigs?: ReadonlyArray<TrainerTierConfig>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_PHOTO_SIZE_BYTES = 500_000;

const DEFAULT_TIER_OPTIONS: ReadonlyArray<{
  readonly value: TierValue;
  readonly label: string;
  readonly description: string;
}> = [
  { value: "BASIC", label: "Basic", description: "₱0 upgrade fee" },
  { value: "PROFESSIONAL", label: "Professional", description: "₱2,000 upgrade fee" },
  { value: "PREMIUM", label: "Premium", description: "₱6,000 upgrade fee" },
] as const;

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v) || 0;
}


/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TrainerForm({
  editingTrainer,
  onSave,
  onCancel,
  tierConfigs,
}: TrainerFormProps) {
  const tierOptions =
    tierConfigs && tierConfigs.length > 0
      ? tierConfigs.map((c) => ({
          value: c.tier as TierValue,
          label: c.label || c.tier.charAt(0) + c.tier.slice(1).toLowerCase(),
          description: `₱${toNumber(c.upgradeFee).toLocaleString()} upgrade fee`,
        }))
      : DEFAULT_TIER_OPTIONS;
  const isEditing = editingTrainer !== null;

  // Form state
  const [name, setName] = useState(editingTrainer?.name ?? "");
  const [email, setEmail] = useState(editingTrainer?.email ?? "");
  const [phone, setPhone] = useState(editingTrainer?.phone ?? "");
  const [bio, setBio] = useState(editingTrainer?.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(editingTrainer?.photoUrl ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    editingTrainer?.photoUrl ?? null,
  );
  const [specializations, setSpecializations] = useState<
    ReadonlyArray<string>
  >(editingTrainer?.specializations ?? []);
  const [tier, setTier] = useState<TierValue>(
    editingTrainer?.tier ?? "BASIC",
  );
  const [credentials, setCredentials] = useState(
    editingTrainer?.credentials ?? "",
  );
  const [certifications, setCertifications] = useState<
    ReadonlyArray<string>
  >(editingTrainer?.certifications ?? []);
  const [industryExperience, setIndustryExperience] = useState(
    editingTrainer?.industryExperience ?? "",
  );
  const [yearsOfExperience, setYearsOfExperience] = useState(
    String(editingTrainer?.yearsOfExperience ?? 0),
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Photo handling                                                   */
  /* ---------------------------------------------------------------- */

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setFormError("Photo must be smaller than 500KB. Please resize it.");
      return;
    }

    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoUrl(dataUrl);
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoUrl("");
    setPhotoPreview(null);
  }

  /* ---------------------------------------------------------------- */
  /*  Submit                                                           */
  /* ---------------------------------------------------------------- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const body = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      photoUrl: photoUrl || null,
      specializations:
        specializations.length > 0 ? [...specializations] : undefined,
      tier,
      credentials: credentials.trim() || undefined,
      certifications:
        certifications.length > 0 ? [...certifications] : undefined,
      industryExperience: industryExperience.trim() || undefined,
      yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
    };

    try {
      const url = isEditing
        ? `/api/admin/trainers/${editingTrainer.id}`
        : "/api/admin/trainers";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.success) {
        setFormError(json.error ?? "Something went wrong");
        return;
      }

      onSave();
    } catch {
      setFormError("Failed to save trainer. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          {isEditing ? "Edit Trainer" : "New Trainer"}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {formError}
          </div>
        )}

        {/* Photo Upload */}
        <div>
          <Label>Trainer Photo</Label>
          <div className="flex items-center gap-4 mt-1">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  title="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                <Camera className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <label
                htmlFor="trainer-photo"
                className="inline-flex items-center gap-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                {photoPreview ? "Change Photo" : "Upload Photo"}
              </label>
              <input
                id="trainer-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG · Max 500KB
              </p>
            </div>
          </div>
        </div>

        {/* Name, Email, Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tr-name">Name *</Label>
            <Input
              id="tr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Ana Reyes"
              maxLength={100}
              required
            />
          </div>
          <div>
            <Label htmlFor="tr-email">Email *</Label>
            <Input
              id="tr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@example.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tr-phone">Phone</Label>
            <Input
              id="tr-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+63 912 345 6789"
              maxLength={20}
            />
          </div>
          <div>
            <Label htmlFor="tr-tier">Trainer Tier *</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as TierValue)}>
              <SelectTrigger id="tr-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tierOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label} — {opt.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tr-years">Years of Experience</Label>
            <Input
              id="tr-years"
              type="number"
              min={0}
              max={50}
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="tr-bio">Bio</Label>
          <textarea
            id="tr-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Brief professional bio..."
            maxLength={2000}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Credentials */}
        <div>
          <Label htmlFor="tr-credentials">Credentials / Degrees</Label>
          <textarea
            id="tr-credentials"
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            placeholder="e.g. MBA, Harvard Business School; PMP Certified..."
            maxLength={5000}
            rows={2}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Industry Experience */}
        <div>
          <Label htmlFor="tr-industry">Industry Experience</Label>
          <textarea
            id="tr-industry"
            value={industryExperience}
            onChange={(e) => setIndustryExperience(e.target.value)}
            placeholder="Describe industry background and expertise areas..."
            maxLength={5000}
            rows={2}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Specializations */}
        <div>
          <Label>Specializations</Label>
          <TagInput
            tags={specializations}
            onAdd={(tag) => setSpecializations([...specializations, tag])}
            onRemove={(idx) =>
              setSpecializations(specializations.filter((_, i) => i !== idx))
            }
            placeholder="e.g. Social Media Marketing"
          />
        </div>

        {/* Certifications */}
        <div>
          <Label>Certifications</Label>
          <TagInput
            tags={certifications}
            onAdd={(tag) => setCertifications([...certifications, tag])}
            onRemove={(idx) =>
              setCertifications(certifications.filter((_, i) => i !== idx))
            }
            placeholder="e.g. Google Analytics Certified"
            chipColor="bg-emerald-50"
            chipTextColor="text-emerald-700"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update Trainer"
            ) : (
              "Create Trainer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
