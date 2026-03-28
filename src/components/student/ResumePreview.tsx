"use client";

import { Mail, Phone, MapPin, FileText } from "lucide-react";

/* ── Exported types (consumed by ResumeBuilder) ── */

export interface WorkEntry {
  readonly id: string;
  readonly company: string;
  readonly position: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly description: string;
}

export interface EducationEntry {
  readonly id: string;
  readonly institution: string;
  readonly degree: string;
  readonly year: string;
}

export interface CertEntry {
  readonly title: string;
  readonly certNumber: string;
  readonly issuedAt: string;
}

export interface ResumeData {
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
  readonly photoUrl?: string | null;
  readonly templateId: string;
  readonly styleColor: string;
  readonly styleLayout?: string;
}

/* ── Internal helpers ── */

function Avatar({ src, name, size }: { src?: string | null; name: string; size: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: Math.round(size / 3),
        fontWeight: 700,
        color: "#6b7280",
      }}
    >
      {initials}
    </div>
  );
}

function SecHead({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{ color, borderBottomColor: color }}
      className="text-[9px] font-bold uppercase tracking-widest border-b pb-0.5 mb-1.5"
    >
      {label}
    </div>
  );
}

function ContactRow({ data, color }: { data: ResumeData; color: string }) {
  return (
    <div className="flex flex-wrap gap-2.5 text-[10px] text-gray-500">
      {data.email && (
        <span className="flex items-center gap-0.5">
          <Mail style={{ color }} className="h-2.5 w-2.5" />
          {data.email}
        </span>
      )}
      {data.phone && (
        <span className="flex items-center gap-0.5">
          <Phone style={{ color }} className="h-2.5 w-2.5" />
          {data.phone}
        </span>
      )}
      {data.location && (
        <span className="flex items-center gap-0.5">
          <MapPin style={{ color }} className="h-2.5 w-2.5" />
          {data.location}
        </span>
      )}
    </div>
  );
}

function WorkList({ entries, color }: { entries: ReadonlyArray<WorkEntry>; color: string }) {
  return (
    <div className="space-y-2">
      {entries.map((w) => (
        <div key={w.id}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-[11px] text-gray-900">{w.position || "Position"}</p>
              <p className="text-[10px]" style={{ color }}>{w.company || "Company"}</p>
            </div>
            <span className="text-[9px] text-gray-400 shrink-0">
              {w.startDate}{w.endDate ? ` – ${w.endDate}` : ""}
            </span>
          </div>
          {w.description && (
            <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{w.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function EduList({ entries }: { entries: ReadonlyArray<EducationEntry> }) {
  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <div key={e.id} className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-[11px] text-gray-900">{e.degree || "Degree"}</p>
            <p className="text-[10px] text-gray-500">{e.institution || "Institution"}</p>
          </div>
          <span className="text-[9px] text-gray-400 shrink-0">{e.year}</span>
        </div>
      ))}
    </div>
  );
}

function SkillPills({ skills, color }: { skills: ReadonlyArray<string>; color: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((s) => (
        <span
          key={s}
          className="text-[9px] px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function CertList({ certs }: { certs: ReadonlyArray<CertEntry> }) {
  return (
    <div className="space-y-0.5">
      {certs.map((c) => (
        <div key={c.certNumber} className="flex justify-between">
          <p className="text-[10px] text-gray-700">{c.title}</p>
          <span className="text-[9px] text-gray-400">
            {new Date(c.issuedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Professional / Modern / Minimal layout ── */

function ClassicLayout({ data }: { data: ResumeData }) {
  const c = data.styleColor;
  const isModern = data.templateId === "modern";

  return (
    <div className="text-[11px] leading-relaxed text-gray-800">
      {/* Header */}
      <div className="mb-4 pb-3" style={{ borderBottom: `2px solid ${c}` }}>
        {isModern ? (
          <div className="flex items-center gap-3">
            <Avatar src={data.photoUrl} name={data.name} size={48} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: c }}>{data.name || "Your Name"}</h1>
              {data.headline && <p className="text-gray-500 text-[10px]">{data.headline}</p>}
              <div className="mt-1"><ContactRow data={data} color={c} /></div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1" style={{ color: c }}>{data.name || "Your Name"}</h1>
            {data.headline && <p className="text-gray-500 text-[10px] mb-1">{data.headline}</p>}
            <div className="flex justify-center"><ContactRow data={data} color={c} /></div>
          </div>
        )}
      </div>

      {data.summary && (
        <div className="mb-3">
          <SecHead label="Professional Summary" color={c} />
          <p className="text-[10px] text-gray-600 leading-relaxed">{data.summary}</p>
        </div>
      )}
      {data.workExperience.length > 0 && (
        <div className="mb-3">
          <SecHead label="Work Experience" color={c} />
          <WorkList entries={data.workExperience} color={c} />
        </div>
      )}
      {data.education.length > 0 && (
        <div className="mb-3">
          <SecHead label="Education" color={c} />
          <EduList entries={data.education} />
        </div>
      )}
      {data.skills.length > 0 && (
        <div className="mb-3">
          <SecHead label="Skills" color={c} />
          <SkillPills skills={data.skills} color={c} />
        </div>
      )}
      {data.certifications.length > 0 && (
        <div className="mb-3">
          <SecHead label="Certifications" color={c} />
          <CertList certs={data.certifications} />
        </div>
      )}
    </div>
  );
}

/* ── Executive layout (two-column sidebar) ── */

function ExecutiveLayout({ data }: { data: ResumeData }) {
  const c = data.styleColor;

  return (
    <div className="flex" style={{ fontSize: 11 }}>
      {/* Sidebar */}
      <div style={{ width: "36%", backgroundColor: c }} className="p-3 text-white flex-shrink-0">
        <div className="flex justify-center mb-3">
          <Avatar src={data.photoUrl} name={data.name} size={60} />
        </div>

        {(data.email || data.phone || data.location) && (
          <div className="mb-3">
            <p className="text-[8px] uppercase tracking-widest font-bold opacity-60 mb-1">Contact</p>
            {data.email && <p className="text-[9px] opacity-85 break-all mb-0.5">{data.email}</p>}
            {data.phone && <p className="text-[9px] opacity-85 mb-0.5">{data.phone}</p>}
            {data.location && <p className="text-[9px] opacity-85">{data.location}</p>}
          </div>
        )}

        {data.skills.length > 0 && (
          <div className="mb-3">
            <p className="text-[8px] uppercase tracking-widest font-bold opacity-60 mb-1">Skills</p>
            {data.skills.map((s) => (
              <div key={s} className="text-[9px] opacity-85">• {s}</div>
            ))}
          </div>
        )}

        {data.education.length > 0 && (
          <div>
            <p className="text-[8px] uppercase tracking-widest font-bold opacity-60 mb-1">Education</p>
            {data.education.map((e) => (
              <div key={e.id} className="mb-1">
                <p className="text-[9px] font-semibold opacity-90">{e.degree || "Degree"}</p>
                <p className="text-[8px] opacity-70">{e.institution}</p>
                {e.year && <p className="text-[8px] opacity-70">{e.year}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-3">
        <h1 className="text-[18px] font-bold text-gray-900 mb-0.5">{data.name || "Your Name"}</h1>
        {data.headline && <p className="text-[10px] mb-2" style={{ color: c }}>{data.headline}</p>}

        {data.summary && (
          <div className="mb-2">
            <p className="text-[8px] uppercase tracking-widest font-bold mb-1" style={{ color: c }}>Summary</p>
            <p className="text-[9px] text-gray-600 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {data.workExperience.length > 0 && (
          <div className="mb-2">
            <p className="text-[8px] uppercase tracking-widest font-bold mb-1.5" style={{ color: c }}>Experience</p>
            <WorkList entries={data.workExperience} color={c} />
          </div>
        )}

        {data.certifications.length > 0 && (
          <div>
            <p className="text-[8px] uppercase tracking-widest font-bold mb-1" style={{ color: c }}>Certifications</p>
            <CertList certs={data.certifications} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Creative layout (bold colored header) ── */

function CreativeLayout({ data }: { data: ResumeData }) {
  const c = data.styleColor;

  return (
    <div>
      {/* Header band */}
      <div style={{ backgroundColor: c }} className="p-4 text-white mb-3">
        <div className="flex items-center gap-3">
          <Avatar src={data.photoUrl} name={data.name} size={60} />
          <div className="flex-1">
            <h1 className="text-xl font-bold">{data.name || "Your Name"}</h1>
            {data.headline && <p className="opacity-80 text-[10px] mt-0.5">{data.headline}</p>}
            <div className="flex flex-wrap gap-2.5 mt-1.5 opacity-90 text-[9px]">
              {data.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{data.email}</span>}
              {data.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{data.phone}</span>}
              {data.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{data.location}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-1">
        {data.summary && (
          <div className="mb-3">
            <SecHead label="About Me" color={c} />
            <p className="text-[10px] text-gray-600 leading-relaxed">{data.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            {data.workExperience.length > 0 && (
              <div className="mb-3">
                <SecHead label="Experience" color={c} />
                <WorkList entries={data.workExperience} color={c} />
              </div>
            )}
          </div>
          <div>
            {data.education.length > 0 && (
              <div className="mb-3">
                <SecHead label="Education" color={c} />
                <EduList entries={data.education} />
              </div>
            )}
            {data.skills.length > 0 && (
              <div className="mb-3">
                <SecHead label="Skills" color={c} />
                <SkillPills skills={data.skills} color={c} />
              </div>
            )}
            {data.certifications.length > 0 && (
              <div>
                <SecHead label="Certifications" color={c} />
                <CertList certs={data.certifications} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Compact layout (dense two-column body) ── */

function CompactLayout({ data }: { data: ResumeData }) {
  const c = data.styleColor;

  return (
    <div style={{ fontSize: 10 }}>
      {/* Header row */}
      <div className="flex justify-between items-start mb-2 pb-2" style={{ borderBottom: `1.5px solid ${c}` }}>
        <div className="flex items-center gap-2">
          <Avatar src={data.photoUrl} name={data.name} size={40} />
          <div>
            <h1 className="text-[16px] font-bold" style={{ color: c }}>{data.name || "Your Name"}</h1>
            {data.headline && <p className="text-gray-500 text-[9px]">{data.headline}</p>}
          </div>
        </div>
        <div className="text-right text-[9px] text-gray-500">
          {data.email && <p>{data.email}</p>}
          {data.phone && <p>{data.phone}</p>}
          {data.location && <p>{data.location}</p>}
        </div>
      </div>

      {data.summary && (
        <p className="text-[10px] text-gray-600 mb-2 leading-snug">{data.summary}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          {data.workExperience.length > 0 && (
            <div className="mb-2">
              <SecHead label="Experience" color={c} />
              <WorkList entries={data.workExperience} color={c} />
            </div>
          )}
        </div>
        <div>
          {data.education.length > 0 && (
            <div className="mb-2">
              <SecHead label="Education" color={c} />
              <EduList entries={data.education} />
            </div>
          )}
          {data.skills.length > 0 && (
            <div className="mb-2">
              <SecHead label="Skills" color={c} />
              <p className="text-[9px] text-gray-600 leading-relaxed">{data.skills.join(" · ")}</p>
            </div>
          )}
          {data.certifications.length > 0 && (
            <div>
              <SecHead label="Certifications" color={c} />
              <CertList certs={data.certifications} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */

export function ResumePreview({ data }: { data: ResumeData }) {
  const isEmpty =
    !data.summary &&
    data.workExperience.length === 0 &&
    data.education.length === 0 &&
    data.skills.length === 0 &&
    data.certifications.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">Fill in the form to see your resume preview</p>
      </div>
    );
  }

  if (data.templateId === "executive") return <ExecutiveLayout data={data} />;
  if (data.templateId === "creative") return <CreativeLayout data={data} />;
  if (data.templateId === "compact") return <CompactLayout data={data} />;
  // Free templates: respect the layout toggle — two-column uses compact-style split
  if (data.styleLayout === "two-column") return <CompactLayout data={data} />;
  return <ClassicLayout data={data} />;
}
