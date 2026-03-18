"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCircle,
  Mail,
  Phone,
  Award,
  Briefcase,
  FileText,
  ShieldCheck,
  Pencil,
  X,
  Camera,
  Loader2,
  Save,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrainerProfile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly bio: string | null;
  readonly photoUrl: string | null;
  readonly specializations: ReadonlyArray<string>;
  readonly credentials: string | null;
  readonly certifications: ReadonlyArray<string>;
  readonly industryExperience: string | null;
  readonly yearsOfExperience: number;
  readonly averageRating: number | null;
  readonly totalRatings: number;
  readonly studentsTrainedCount: number;
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PHOTO_SIZE_BYTES = 500_000; // ~500KB

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrainerProfilePage() {
  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable fields
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ---------- Fetch profile ----------

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/trainer/profile");
      const json: ApiResponse<TrainerProfile> = await res.json();

      if (json.success && json.data) {
        setProfile(json.data);
      } else {
        setError(json.error ?? "Failed to load profile");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ---------- Enter edit mode ----------

  function enterEditMode() {
    if (!profile) return;
    setBio(profile.bio ?? "");
    setPhone(profile.phone ?? "");
    setPhotoUrl(profile.photoUrl ?? "");
    setPhotoPreview(profile.photoUrl ?? null);
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setSaveError(null);
  }

  // ---------- Photo handling ----------

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setSaveError("Photo must be smaller than 500KB. Please resize it.");
      return;
    }

    setSaveError(null);
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

  // ---------- Save profile ----------

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const body = {
      bio: bio.trim() || null,
      phone: phone.trim() || null,
      photoUrl: photoUrl || null,
    };

    try {
      const res = await fetch("/api/trainer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json: ApiResponse<TrainerProfile> = await res.json();

      if (!json.success) {
        setSaveError(json.error ?? "Failed to save profile");
        return;
      }

      if (json.data) {
        setProfile(json.data);
      }
      setIsEditing(false);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Loading state ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
        {error ?? "Unable to load profile."}
        <Button
          variant="outline"
          size="sm"
          className="ml-3"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchProfile();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  // ---------- Render ----------

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            View and update your trainer profile information.
          </p>
        </div>
        {!isEditing && (
          <Button onClick={enterEditMode} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {isEditing ? (
        /* -------- Edit Form -------- */
        <form
          onSubmit={handleSave}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
        >
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {saveError}
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <Label>Profile Photo</Label>
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
                  htmlFor="profile-photo"
                  className="inline-flex items-center gap-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {photoPreview ? "Change Photo" : "Upload Photo"}
                </label>
                <input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG &middot; Max 500KB
                </p>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 912 345 6789"
                maxLength={20}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="profile-bio">Bio</Label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your students about yourself..."
              maxLength={2000}
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-1.5">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        /* -------- View Mode -------- */
        <div className="space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-5">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border-2 border-gray-200">
                  <UserCircle className="h-10 w-10 text-blue-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </span>
                  {profile.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-600">
                    <strong className="text-gray-900">
                      {profile.studentsTrainedCount}
                    </strong>{" "}
                    students trained
                  </span>
                  {profile.averageRating !== null && (
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Star className="h-4 w-4 text-amber-500" />
                      <strong className="text-gray-900">
                        {Number(profile.averageRating).toFixed(1)}
                      </strong>{" "}
                      ({profile.totalRatings} ratings)
                    </span>
                  )}
                  <span className="text-gray-600">
                    <strong className="text-gray-900">
                      {profile.yearsOfExperience}
                    </strong>{" "}
                    years experience
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                About
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Credentials */}
            {profile.credentials && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Credentials
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {profile.credentials}
                </p>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Industry Experience */}
            {profile.industryExperience && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Industry Experience
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {profile.industryExperience}
                </p>
              </div>
            )}

            {/* Specializations */}
            {profile.specializations.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Specializations
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
