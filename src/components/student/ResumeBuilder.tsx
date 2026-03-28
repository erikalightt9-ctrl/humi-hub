"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Download,
  Eye,
  Palette,
  X,
  Camera,
  Lock,
  Save,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  ResumePreview,
  type WorkEntry,
  type EducationEntry,
  type CertEntry,
  type ResumeData,
} from "./ResumePreview";

/* ── Constants ── */

type TemplateId =
  | "professional"
  | "modern"
  | "minimal"
  | "executive"
  | "creative"
  | "compact";

interface TemplateConfig {
  readonly id: TemplateId;
  readonly label: string;
  readonly description: string;
  readonly isPremium: boolean;
  readonly defaultColor: string;
}

const TEMPLATES: ReadonlyArray<TemplateConfig> = [
  { id: "professional", label: "Professional", description: "Clean & classic",    isPremium: false, defaultColor: "#2563eb" },
  { id: "modern",       label: "Modern",       description: "With avatar",        isPremium: false, defaultColor: "#059669" },
  { id: "minimal",      label: "Minimal",      description: "Ultra clean",        isPremium: false, defaultColor: "#374151" },
  { id: "executive",    label: "Executive",    description: "Sidebar layout",     isPremium: true,  defaultColor: "#1e3a5f" },
  { id: "creative",     label: "Creative",     description: "Bold header",        isPremium: true,  defaultColor: "#7c3aed" },
  { id: "compact",      label: "Compact",      description: "Two-column body",    isPremium: true,  defaultColor: "#0f766e" },
];

const PRESET_COLORS = [
  "#2563eb", "#059669", "#374151", "#1e3a5f",
  "#7c3aed", "#0f766e", "#dc2626", "#d97706",
  "#db2777", "#0891b2",
] as const;

const FONT_OPTIONS = [
  { value: "inter",    label: "Inter"    },
  { value: "georgia",  label: "Georgia"  },
  { value: "courier",  label: "Courier"  },
] as const;

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/* ── Types ── */

interface ResumeState {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly location: string;
  readonly headline: string;
  readonly summary: string;
  readonly workExperience: ReadonlyArray<WorkEntry>;
  readonly education: ReadonlyArray<EducationEntry>;
  readonly skills: ReadonlyArray<string>;
  readonly certifications: ReadonlyArray<CertEntry>;
  readonly photoUrl: string | null;
  readonly templateId: TemplateId;
  readonly styleColor: string;
  readonly styleFont: string;
  readonly styleLayout: string;
}

export interface ResumeBuilderProps {
  readonly initialName: string;
  readonly initialEmail: string;
  readonly initialSkills: ReadonlyArray<string>;
  readonly initialCertifications: ReadonlyArray<CertEntry>;
  readonly courseTitle: string;
  readonly hasSubscription: boolean;
}

interface ApiResult {
  readonly ok: boolean;
  readonly status: number;
  readonly error: string | null;
}

/* ── Helpers ── */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeInitialState(
  initialName: string,
  initialEmail: string,
  initialSkills: ReadonlyArray<string>,
  initialCertifications: ReadonlyArray<CertEntry>,
): ResumeState {
  return {
    name: initialName,
    email: initialEmail,
    phone: "",
    location: "",
    headline: "",
    summary: "",
    workExperience: [],
    education: [],
    skills: [...initialSkills],
    certifications: [...initialCertifications],
    photoUrl: null,
    templateId: "professional",
    styleColor: "#2563eb",
    styleFont: "inter",
    styleLayout: "single",
  };
}

/* ── API helpers ── */

interface SavedResume {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  photoUrl?: string | null;
  templateId?: string;
  styleColor?: string;
  styleFont?: string;
  styleLayout?: string;
}

async function apiFetchResume(): Promise<SavedResume | null> {
  try {
    const res = await fetch("/api/student/resume/save");
    if (!res.ok) return null;
    const json = (await res.json()) as { data: SavedResume | null };
    return json.data;
  } catch {
    return null;
  }
}

async function apiSaveResume(resume: ResumeState): Promise<ApiResult> {
  const payload = {
    fullName: resume.name,
    email: resume.email,
    phone: resume.phone,
    location: resume.location,
    headline: resume.headline,
    summary: resume.summary,
    skills: [...resume.skills],
    workExperience: resume.workExperience.map((w) => ({ ...w })),
    education: resume.education.map((e) => ({ ...e })),
    certifications: resume.certifications.map((c) => ({ ...c })),
    photoUrl: resume.photoUrl,
    templateId: resume.templateId,
    styleColor: resume.styleColor,
    styleFont: resume.styleFont,
    styleLayout: resume.styleLayout,
    isPremiumDesign: TEMPLATES.find((t) => t.id === resume.templateId)?.isPremium ?? false,
  };

  try {
    const res = await fetch("/api/student/resume/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error: string | null };
    return { ok: res.ok, status: res.status, error: json.error };
  } catch {
    return { ok: false, status: 0, error: "Network error" };
  }
}

async function apiExportPdf(resume: ResumeState): Promise<Blob | null> {
  const payload = {
    name: resume.name,
    email: resume.email,
    phone: resume.phone,
    location: resume.location,
    headline: resume.headline,
    summary: resume.summary,
    skills: [...resume.skills],
    workExperience: resume.workExperience.map((w) => ({ ...w })),
    education: resume.education.map((e) => ({ ...e })),
    certifications: resume.certifications.map((c) => ({ ...c })),
    photoUrl: resume.photoUrl,
    templateId: resume.templateId,
    styleColor: resume.styleColor,
  };

  try {
    const res = await fetch("/api/student/resume/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return res.blob();
  } catch {
    return null;
  }
}

async function apiUploadPhoto(file: File): Promise<{ photoUrl: string | null; error: string | null }> {
  const fd = new FormData();
  fd.append("photo", file);
  try {
    const res = await fetch("/api/student/resume/photo", { method: "POST", body: fd });
    const json = (await res.json()) as { success: boolean; data?: { photoUrl: string }; error?: string };
    if (!res.ok) return { photoUrl: null, error: json.error ?? "Upload failed" };
    return { photoUrl: json.data?.photoUrl ?? null, error: null };
  } catch {
    return { photoUrl: null, error: "Upload failed" };
  }
}

/* ── Small UI components ── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-semibold text-gray-900 text-sm mb-4">{children}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

/* ── Subscription gate modal ── */

function GateModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-100 rounded-lg p-1.5">
              <Sparkles className="h-4 w-4 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900">Unlock Professional Resume Designs</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-2 mb-5">
          {["Premium Templates", "Advanced Styling", "Better Hiring Chances"].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <Link
            href="/student/ai-premium"
            className="flex-1 bg-blue-600 text-white text-sm font-medium text-center py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Upgrade to Pro
          </Link>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */

export function ResumeBuilder({
  initialName,
  initialEmail,
  initialSkills,
  initialCertifications,
  courseTitle,
  hasSubscription,
}: ResumeBuilderProps) {
  const [resume, setResume] = useState<ResumeState>(() =>
    makeInitialState(initialName, initialEmail, initialSkills, initialCertifications)
  );
  const [skillInput, setSkillInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Load saved resume on mount */
  useEffect(() => {
    apiFetchResume().then((saved) => {
      if (saved) {
        setResume((prev) => ({
          ...prev,
          name:         saved.fullName   ?? prev.name,
          email:        saved.email      ?? prev.email,
          phone:        saved.phone      ?? prev.phone,
          location:     saved.location   ?? prev.location,
          headline:     saved.headline   ?? prev.headline,
          summary:      saved.summary    ?? prev.summary,
          skills:       saved.skills     ?? prev.skills,
          workExperience: saved.experience
            ? (JSON.parse(saved.experience) as WorkEntry[])
            : prev.workExperience,
          education: saved.education
            ? (JSON.parse(saved.education) as EducationEntry[])
            : prev.education,
          photoUrl:     saved.photoUrl   ?? prev.photoUrl,
          templateId:   (saved.templateId as TemplateId) ?? prev.templateId,
          styleColor:   saved.styleColor ?? prev.styleColor,
          styleFont:    saved.styleFont  ?? prev.styleFont,
          styleLayout:  saved.styleLayout ?? prev.styleLayout,
        }));
      }
      setLoaded(true);
    });
  }, []);

  /* Immutable field updater */
  const updateField = useCallback(
    <K extends keyof ResumeState>(key: K, value: ResumeState[K]) => {
      setResume((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* Work experience */
  const addWork = useCallback(() => {
    setResume((prev) => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        { id: generateId(), company: "", position: "", startDate: "", endDate: "", description: "" },
      ],
    }));
  }, []);

  const updateWork = useCallback((id: string, field: keyof WorkEntry, value: string) => {
    setResume((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    }));
  }, []);

  const removeWork = useCallback((id: string) => {
    setResume((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((w) => w.id !== id),
    }));
  }, []);

  /* Education */
  const addEducation = useCallback(() => {
    setResume((prev) => ({
      ...prev,
      education: [...prev.education, { id: generateId(), institution: "", degree: "", year: "" }],
    }));
  }, []);

  const updateEducation = useCallback((id: string, field: keyof EducationEntry, value: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  }, []);

  /* Skills */
  const addSkill = useCallback(() => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    setResume((prev) => {
      if (prev.skills.includes(trimmed)) return prev;
      return { ...prev, skills: [...prev.skills, trimmed] };
    });
    setSkillInput("");
  }, [skillInput]);

  const removeSkill = useCallback((skill: string) => {
    setResume((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  }, []);

  /* Photo upload */
  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError("Please upload a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image must be smaller than 2 MB.");
      return;
    }

    setPhotoUploading(true);
    const result = await apiUploadPhoto(file);
    setPhotoUploading(false);

    if (result.error) {
      setPhotoError(result.error);
    } else {
      setResume((prev) => ({ ...prev, photoUrl: result.photoUrl }));
    }
    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  }, []);

  /* Template selection */
  const handleTemplateSelect = useCallback((tpl: TemplateConfig) => {
    if (tpl.isPremium && !hasSubscription) {
      setShowGate(true);
      return;
    }
    setResume((prev) => ({ ...prev, templateId: tpl.id, styleColor: tpl.defaultColor }));
  }, [hasSubscription]);

  /* Save */
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg(null);
    const result = await apiSaveResume(resume);
    setSaving(false);

    if (result.ok) {
      setSaveMsg({ type: "ok", text: "Resume saved!" });
    } else if (result.status === 403) {
      setShowGate(true);
    } else {
      setSaveMsg({ type: "err", text: result.error ?? "Save failed" });
    }
    setTimeout(() => setSaveMsg(null), 3000);
  }, [resume]);

  /* PDF download */
  const handleDownloadPdf = useCallback(async () => {
    setDownloading(true);
    const blob = await apiExportPdf(resume);
    setDownloading(false);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resume.name || "resume").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_resume.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [resume]);

  /* ── Derived values ── */

  const previewData: ResumeData = {
    name: resume.name,
    email: resume.email,
    phone: resume.phone,
    location: resume.location,
    headline: resume.headline,
    summary: resume.summary,
    workExperience: resume.workExperience,
    education: resume.education,
    skills: resume.skills,
    certifications: resume.certifications,
    photoUrl: resume.photoUrl,
    templateId: resume.templateId,
    styleColor: resume.styleColor,
    styleLayout: resume.styleLayout,
  };

  /* ── Loading ── */
  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  /* ── Action buttons (reused in header + mobile footer) ── */
  const actionButtons = (
    <div className="flex items-center gap-2">
      {saveMsg && (
        <span className={`flex items-center gap-1 text-xs ${saveMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
          {saveMsg.type === "ok"
            ? <CheckCircle className="h-3.5 w-3.5" />
            : <AlertCircle className="h-3.5 w-3.5" />}
          {saveMsg.text}
        </span>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </button>
      <button
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download PDF
      </button>
    </div>
  );

  return (
    <>
      {showGate && <GateModal onClose={() => setShowGate(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── LEFT: Form ─── */}
        <div className="space-y-5">

          {/* Photo upload */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Profile Photo</h2>
            </div>
            <div className="flex items-center gap-4">
              {resume.photoUrl ? (
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resume.photoUrl}
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    onClick={() => setResume((p) => ({ ...p, photoUrl: null }))}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {photoUploading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Camera className="h-3.5 w-3.5" />}
                  {photoUploading ? "Uploading…" : "Upload Photo"}
                </button>
                <p className="text-[11px] text-gray-400 mt-1">JPG or PNG · max 2 MB · square crop</p>
                {photoError && <p className="text-[11px] text-red-600 mt-1">{photoError}</p>}
              </div>
            </div>
          </Card>

          {/* Template & Style */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Template & Style</h2>
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {TEMPLATES.map((t) => {
                const active = resume.templateId === t.id;
                const locked = t.isPremium && !hasSubscription;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t)}
                    className={`relative rounded-lg border-2 p-2.5 text-left transition-colors ${
                      active
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Blur overlay + lock badge for locked premium templates */}
                    {locked && (
                      <div className="absolute inset-0 rounded-[10px] bg-white/60 backdrop-blur-[2px] flex items-start justify-end p-1.5 z-10">
                        <span className="flex items-center gap-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          <Lock className="h-2.5 w-2.5" /> PRO
                        </span>
                      </div>
                    )}
                    {t.isPremium && !locked && (
                      <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
                        <Sparkles className="h-2.5 w-2.5" /> PRO
                      </span>
                    )}
                    <div className={`h-1.5 rounded-full mb-1.5 ${locked ? "blur-sm" : ""}`} style={{ backgroundColor: t.defaultColor }} />
                    <p className="text-[11px] font-semibold text-gray-900">{t.label}</p>
                    <p className="text-[10px] text-gray-500">{t.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Style panel — PRO only */}
            {hasSubscription ? (
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <p className="text-xs font-medium text-gray-700">Accent Color</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateField("styleColor", color)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        resume.styleColor === color ? "border-gray-900 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={resume.styleColor}
                    onChange={(e) => updateField("styleColor", e.target.value)}
                    className="h-7 w-7 rounded-full border border-gray-300 cursor-pointer overflow-hidden"
                    title="Custom color"
                  />
                </div>
                <p className="text-xs font-medium text-gray-700">Font</p>
                <div className="flex gap-2">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => updateField("styleFont", f.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        resume.styleFont === f.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-medium text-gray-700">Layout</p>
                <div className="flex gap-2">
                  {[
                    { value: "single",      label: "Single" },
                    { value: "two-column",  label: "Two-Column" },
                  ].map((l) => (
                    <button
                      key={l.value}
                      onClick={() => updateField("styleLayout", l.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        resume.styleLayout === l.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowGate(true)}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-yellow-300 bg-yellow-50 rounded-lg py-2 text-xs text-yellow-700 hover:bg-yellow-100 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Unlock color & font customization with PRO
              </button>
            )}
          </Card>

          {/* Personal information */}
          <Card>
            <CardTitle>Personal Information</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name">
                <input type="text" value={resume.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Juan dela Cruz" className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" value={resume.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@email.com" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input type="text" value={resume.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+63 XXX XXX XXXX" className={inputCls} />
              </Field>
              <Field label="Location">
                <input type="text" value={resume.location} onChange={(e) => updateField("location", e.target.value)} placeholder="City, Country" className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Professional Headline">
                  <input type="text" value={resume.headline} onChange={(e) => updateField("headline", e.target.value)} placeholder={`e.g. Virtual Assistant | ${courseTitle} Graduate`} className={inputCls} />
                </Field>
              </div>
            </div>
          </Card>

          {/* Professional Summary */}
          <Card>
            <CardTitle>Professional Summary</CardTitle>
            <textarea
              rows={4}
              value={resume.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              placeholder={`Dedicated ${courseTitle} professional with strong attention to detail…`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </Card>

          {/* Work Experience */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-sm">Work Experience</h2>
              <button onClick={addWork} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {resume.workExperience.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No work experience added yet.</p>
            )}
            <div className="space-y-4">
              {resume.workExperience.map((w) => (
                <div key={w.id} className="border border-gray-100 rounded-lg p-3 relative">
                  <button onClick={() => removeWork(w.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="text" value={w.company}    onChange={(e) => updateWork(w.id, "company",    e.target.value)} placeholder="Company"          className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={w.position}   onChange={(e) => updateWork(w.id, "position",   e.target.value)} placeholder="Position"         className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={w.startDate}  onChange={(e) => updateWork(w.id, "startDate",  e.target.value)} placeholder="Start (Jan 2024)" className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={w.endDate}    onChange={(e) => updateWork(w.id, "endDate",    e.target.value)} placeholder="End (or Present)" className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <textarea
                    rows={2}
                    value={w.description}
                    onChange={(e) => updateWork(w.id, "description", e.target.value)}
                    placeholder="Key responsibilities and achievements…"
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Education */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-sm">Education</h2>
              <button onClick={addEducation} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {resume.education.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No education entries added yet.</p>
            )}
            <div className="space-y-3">
              {resume.education.map((e) => (
                <div key={e.id} className="border border-gray-100 rounded-lg p-3 relative">
                  <button onClick={() => removeEducation(e.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={e.institution} onChange={(ev) => updateEducation(e.id, "institution", ev.target.value)} placeholder="Institution"      className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={e.degree}      onChange={(ev) => updateEducation(e.id, "degree",      ev.target.value)} placeholder="Degree / Program" className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={e.year}        onChange={(ev) => updateEducation(e.id, "year",        ev.target.value)} placeholder="Year"            className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Skills */}
          <Card>
            <CardTitle>Skills</CardTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              {resume.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                  {s}
                  <button onClick={() => removeSkill(s)} className="text-gray-400 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={addSkill} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Add
              </button>
            </div>
          </Card>

          {/* Mobile action buttons */}
          <div className="lg:hidden">{actionButtons}</div>
        </div>

        {/* ─── RIGHT: Preview ─── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              Live Preview
            </div>
            <div className="hidden lg:flex">{actionButtons}</div>
          </div>

          <div
            id="resume-preview"
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[600px]"
          >
            <ResumePreview data={previewData} />
          </div>
        </div>
      </div>
    </>
  );
}
