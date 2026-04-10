"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertCircle, UserCircle, Edit2, Save, X,
  Briefcase, Shield, Heart, FileText, CheckCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Contract {
  id: string;
  contractType: string;
  basicSalary: number;
  salaryFrequency: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: string;
  reason: string | null;
  createdAt: string;
}

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string | null;
  position: string;
  department: string | null;
  employmentType: string;
  status: string;
  hireDate: string;
  regularizationDate: string | null;
  separationDate: string | null;
  separationReason: string | null;
  sssNumber: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  tinNumber: string | null;
  birthDate: string | null;
  gender: string | null;
  civilStatus: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  contracts: Contract[];
  leaveRequests: LeaveRequest[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:      "bg-green-100 text-green-700",
  ON_LEAVE:    "bg-amber-100 text-amber-700",
  INACTIVE:    "bg-slate-100 text-slate-500",
  RESIGNED:    "bg-red-100 text-red-600",
  TERMINATED:  "bg-red-100 text-red-700",
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const fmt = (n: number) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5 grid grid-cols-2 gap-4 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-slate-800">{value ?? "—"}</dd>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <dl>{children}</dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit form state type (all strings for controlled inputs)           */
/* ------------------------------------------------------------------ */

type EditForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  position: string;
  department: string;
  employmentType: string;
  status: string;
  sssNumber: string;
  philhealthNumber: string;
  pagibigNumber: string;
  tinNumber: string;
  birthDate: string;
  gender: string;
  civilStatus: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
};

function toEditForm(emp: Employee): EditForm {
  return {
    firstName:       emp.firstName,
    lastName:        emp.lastName,
    middleName:      emp.middleName      ?? "",
    phone:           emp.phone           ?? "",
    position:        emp.position,
    department:      emp.department      ?? "",
    employmentType:  emp.employmentType,
    status:          emp.status,
    sssNumber:       emp.sssNumber       ?? "",
    philhealthNumber: emp.philhealthNumber ?? "",
    pagibigNumber:   emp.pagibigNumber   ?? "",
    tinNumber:       emp.tinNumber       ?? "",
    birthDate:       emp.birthDate       ? emp.birthDate.slice(0, 10) : "",
    gender:          emp.gender          ?? "",
    civilStatus:     emp.civilStatus     ?? "",
    address:         emp.address         ?? "",
    emergencyContact: emp.emergencyContact ?? "",
    emergencyPhone:  emp.emergencyPhone  ?? "",
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm]         = useState<EditForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/hr/employees/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load");
      setEmployee(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function startEdit() {
    if (!employee) return;
    setForm(toEditForm(employee));
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(null);
    setSaveError(null);
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function handleSave() {
    if (!form || !employee) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res  = await fetch(`/api/admin/hr/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          middleName:      form.middleName      || undefined,
          phone:           form.phone           || undefined,
          department:      form.department      || undefined,
          sssNumber:       form.sssNumber       || undefined,
          philhealthNumber: form.philhealthNumber || undefined,
          pagibigNumber:   form.pagibigNumber   || undefined,
          tinNumber:       form.tinNumber       || undefined,
          birthDate:       form.birthDate       || undefined,
          gender:          form.gender          || undefined,
          civilStatus:     form.civilStatus     || undefined,
          address:         form.address         || undefined,
          emergencyContact: form.emergencyContact || undefined,
          emergencyPhone:  form.emergencyPhone  || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed");
      await load();
      setEditing(false);
      setForm(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /* ---- render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error ?? "Employee not found"}</span>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-indigo-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  const currentContract = employee.contracts.find((c) => c.isCurrent) ?? employee.contracts[0];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/hr/employees"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {employee.lastName}, {employee.firstName}
              {employee.middleName ? ` ${employee.middleName}` : ""}
            </h1>
            <p className="text-xs text-slate-400">
              {employee.employeeNumber} · {employee.position}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              STATUS_COLORS[employee.status] ?? "bg-slate-100 text-slate-500"
            }`}
          >
            {employee.status.replace("_", " ")}
          </span>
          {editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : <><Save className="h-4 w-4" /> Save Changes</>
                }
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Employment Info */}
        <Section icon={Briefcase} title="Employment Information">
          {editing && form ? (
            <div className="space-y-3">
              <Field label="First Name" required>
                <input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)}
                  className={INPUT_CLS} />
              </Field>
              <Field label="Last Name" required>
                <input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)}
                  className={INPUT_CLS} />
              </Field>
              <Field label="Middle Name">
                <input value={form.middleName} onChange={(e) => setField("middleName", e.target.value)}
                  className={INPUT_CLS} />
              </Field>
              <Field label="Position" required>
                <input value={form.position} onChange={(e) => setField("position", e.target.value)}
                  className={INPUT_CLS} />
              </Field>
              <Field label="Department">
                <input value={form.department} onChange={(e) => setField("department", e.target.value)}
                  className={INPUT_CLS} />
              </Field>
              <Field label="Employment Type" required>
                <select value={form.employmentType} onChange={(e) => setField("employmentType", e.target.value)}
                  className={INPUT_CLS}>
                  <option value="REGULAR">Regular</option>
                  <option value="PROBATIONARY">Probationary</option>
                  <option value="CONTRACTUAL">Contractual</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERN">Intern</option>
                </select>
              </Field>
              <Field label="Status" required>
                <select value={form.status} onChange={(e) => setField("status", e.target.value)}
                  className={INPUT_CLS}>
                  <option value="ACTIVE">Active</option>
                  <option value="PROBATIONARY">Probationary</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="RESIGNED">Resigned</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                  className={INPUT_CLS} />
              </Field>
            </div>
          ) : (
            <>
              <InfoRow label="Employee #"      value={employee.employeeNumber} />
              <InfoRow label="Full Name"        value={`${employee.lastName}, ${employee.firstName}${employee.middleName ? ` ${employee.middleName}` : ""}`} />
              <InfoRow label="Email"            value={employee.email} />
              <InfoRow label="Phone"            value={employee.phone} />
              <InfoRow label="Position"         value={employee.position} />
              <InfoRow label="Department"       value={employee.department} />
              <InfoRow label="Employment Type"  value={employee.employmentType.replace("_", " ")} />
              <InfoRow label="Status"           value={
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[employee.status] ?? "bg-slate-100 text-slate-500"}`}>
                  {employee.status.replace("_", " ")}
                </span>
              } />
              <InfoRow label="Hire Date"        value={fmtDate(employee.hireDate)} />
              <InfoRow label="Regularization"   value={fmtDate(employee.regularizationDate)} />
              {(employee.status === "RESIGNED" || employee.status === "TERMINATED") && (
                <>
                  <InfoRow label="Separation Date"   value={fmtDate(employee.separationDate)} />
                  <InfoRow label="Separation Reason" value={employee.separationReason} />
                </>
              )}
            </>
          )}
        </Section>

        {/* Government IDs */}
        <Section icon={Shield} title="Government IDs">
          {editing && form ? (
            <div className="space-y-3">
              <Field label="SSS Number">
                <input value={form.sssNumber} onChange={(e) => setField("sssNumber", e.target.value)}
                  className={INPUT_CLS} placeholder="XX-XXXXXXX-X" />
              </Field>
              <Field label="PhilHealth Number">
                <input value={form.philhealthNumber} onChange={(e) => setField("philhealthNumber", e.target.value)}
                  className={INPUT_CLS} placeholder="XX-XXXXXXXXX-X" />
              </Field>
              <Field label="Pag-IBIG Number">
                <input value={form.pagibigNumber} onChange={(e) => setField("pagibigNumber", e.target.value)}
                  className={INPUT_CLS} placeholder="XXXX-XXXX-XXXX" />
              </Field>
              <Field label="TIN Number">
                <input value={form.tinNumber} onChange={(e) => setField("tinNumber", e.target.value)}
                  className={INPUT_CLS} placeholder="XXX-XXX-XXX" />
              </Field>
            </div>
          ) : (
            <>
              <InfoRow label="SSS Number"        value={employee.sssNumber} />
              <InfoRow label="PhilHealth Number" value={employee.philhealthNumber} />
              <InfoRow label="Pag-IBIG Number"   value={employee.pagibigNumber} />
              <InfoRow label="TIN Number"         value={employee.tinNumber} />
            </>
          )}
        </Section>

        {/* Personal Info */}
        <Section icon={Heart} title="Personal Information">
          {editing && form ? (
            <div className="space-y-3">
              <Field label="Birth Date">
                <input type="date" value={form.birthDate} onChange={(e) => setField("birthDate", e.target.value)}
                  className={INPUT_CLS} />
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={(e) => setField("gender", e.target.value)}
                  className={INPUT_CLS}>
                  <option value="">— Select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Civil Status">
                <select value={form.civilStatus} onChange={(e) => setField("civilStatus", e.target.value)}
                  className={INPUT_CLS}>
                  <option value="">— Select —</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </Field>
              <Field label="Address">
                <textarea value={form.address} onChange={(e) => setField("address", e.target.value)}
                  rows={2} className={INPUT_CLS + " resize-none"} />
              </Field>
              <Field label="Emergency Contact">
                <input value={form.emergencyContact} onChange={(e) => setField("emergencyContact", e.target.value)}
                  className={INPUT_CLS} placeholder="Name" />
              </Field>
              <Field label="Emergency Phone">
                <input value={form.emergencyPhone} onChange={(e) => setField("emergencyPhone", e.target.value)}
                  className={INPUT_CLS} placeholder="+63 9XX XXX XXXX" />
              </Field>
            </div>
          ) : (
            <>
              <InfoRow label="Birth Date"        value={fmtDate(employee.birthDate)} />
              <InfoRow label="Gender"            value={employee.gender} />
              <InfoRow label="Civil Status"      value={employee.civilStatus} />
              <InfoRow label="Address"           value={employee.address} />
              <InfoRow label="Emergency Contact" value={employee.emergencyContact} />
              <InfoRow label="Emergency Phone"   value={employee.emergencyPhone} />
            </>
          )}
        </Section>

        {/* Current Contract */}
        <Section icon={FileText} title="Current Contract">
          {currentContract ? (
            <>
              <InfoRow label="Contract Type"     value={currentContract.contractType.replace("_", " ")} />
              <InfoRow label="Basic Salary"      value={fmt(currentContract.basicSalary)} />
              <InfoRow label="Pay Frequency"     value={currentContract.salaryFrequency.replace("_", " ")} />
              <InfoRow label="Start Date"        value={fmtDate(currentContract.startDate)} />
              <InfoRow label="End Date"          value={fmtDate(currentContract.endDate)} />
              <InfoRow label="Active"            value={
                currentContract.isCurrent
                  ? <span className="text-xs text-green-700 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Yes</span>
                  : <span className="text-xs text-slate-400">No</span>
              } />
            </>
          ) : (
            <p className="text-sm text-slate-400 py-2">No contract on record.</p>
          )}

          {employee.contracts.length > 1 && (
            <details className="mt-3">
              <summary className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-800 font-medium">
                View all {employee.contracts.length} contracts
              </summary>
              <div className="mt-3 space-y-2">
                {employee.contracts.slice(1).map((c) => (
                  <div key={c.id} className="text-xs text-slate-500 border border-slate-100 rounded-lg p-3">
                    <p className="font-medium text-slate-700 mb-1">{c.contractType} — {fmt(c.basicSalary)}</p>
                    <p>{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </Section>
      </div>

      {/* Leave History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <CheckCircle className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-700">Leave Request History</h2>
        </div>
        {employee.leaveRequests.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No leave requests on record.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Dates</th>
                <th className="px-5 py-3 text-center">Days</th>
                <th className="px-5 py-3 text-left">Reason</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Filed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employee.leaveRequests.map((lr) => (
                <tr key={lr.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {lr.leaveType.replace("_", " ")}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {fmtDate(lr.startDate)}
                    {lr.startDate !== lr.endDate && ` → ${fmtDate(lr.endDate)}`}
                  </td>
                  <td className="px-5 py-3 text-center text-slate-700">{lr.daysRequested}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs max-w-xs truncate">
                    {lr.reason ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_STATUS_COLORS[lr.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {lr.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(lr.createdAt).toLocaleDateString("en-PH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small helper components                                             */
/* ------------------------------------------------------------------ */

const INPUT_CLS =
  "w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
