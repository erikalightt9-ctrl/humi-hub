"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X, Loader2, CheckCircle, ExternalLink, AlertCircle,
  User, Briefcase, ChevronRight,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DEPARTMENTS = [
  "Administration", "Finance", "Human Resources", "IT & Systems",
  "Marketing", "Operations", "Sales", "Customer Service", "Legal", "Logistics",
];

const EMPTY_FORM = {
  firstName: "", lastName: "", middleName: "",
  email: "", phone: "",
  department: "", position: "",
  employmentType: "PROBATIONARY",
  hireDate: new Date().toISOString().split("T")[0],
  basicSalary: "",
};

type Tab = "personal" | "employment";

export function AddEmployeeModal({ open, onClose, onCreated }: Props) {
  const [tab, setTab]       = useState<Tab>("personal");
  const [form, setForm]     = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState("");

  function set(k: keyof typeof form, v: string) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.position || !form.hireDate || !form.basicSalary) {
      setError("Please complete all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          basicSalary: parseFloat(form.basicSalary),
          middleName:  form.middleName || undefined,
          phone:       form.phone      || undefined,
          department:  form.department || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setCreatedId(json.data.id);
      setCreatedName(`${form.firstName} ${form.lastName}`);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setCreatedId(null);
    setCreatedName("");
    setError(null);
    setTab("personal");
    onClose();
  }

  if (!open) return null;

  const inputCls = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";
  const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              <User className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Add Employee</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Defaults to Active + Probationary</p>
            </div>
          </div>
          <button onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Success */}
        {createdId ? (
          <div className="px-6 py-14 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{createdName} added!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
              Basic record created. Complete the 201 profile to add government IDs, documents, and compensation details.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => { setForm(EMPTY_FORM); setCreatedId(null); setCreatedName(""); setError(null); setTab("personal"); }}
                className="px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Add Another
              </button>
              <Link href={`/admin/hr/employees/${createdId}`}
                onClick={handleClose}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                Complete 201 Profile <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Tab Bar */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
              {([
                { id: "personal",    label: "Personal Info",      icon: User },
                { id: "employment",  label: "Employment Details",  icon: Briefcase },
              ] as { id: Tab; label: string; icon: React.ElementType }[]).map(t => (
                <button key={t.id} type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-1 py-3 mr-5 text-sm border-b-2 font-medium transition-colors ${
                    tab === t.id
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}>
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="px-6 py-5 max-h-[55vh] overflow-y-auto space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {tab === "personal" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                      <input value={form.firstName} onChange={e => set("firstName", e.target.value)}
                        placeholder="Juan" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                      <input value={form.lastName} onChange={e => set("lastName", e.target.value)}
                        placeholder="dela Cruz" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Middle Name</label>
                    <input value={form.middleName} onChange={e => set("middleName", e.target.value)}
                      placeholder="Santos" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                      placeholder="juan@company.com" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                      placeholder="+63 9XX XXX XXXX" className={inputCls} />
                  </div>
                </div>
              )}

              {tab === "employment" && (
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Position / Job Title <span className="text-red-500">*</span></label>
                    <input value={form.position} onChange={e => set("position", e.target.value)}
                      placeholder="e.g. HR Manager, Software Engineer" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Department</label>
                    <input list="dept-list" value={form.department}
                      onChange={e => set("department", e.target.value)}
                      placeholder="e.g. Finance, Operations" className={inputCls} />
                    <datalist id="dept-list">
                      {DEPARTMENTS.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Employment Type</label>
                      <select value={form.employmentType} onChange={e => set("employmentType", e.target.value)}
                        className={inputCls}>
                        <option value="PROBATIONARY">Probationary</option>
                        <option value="REGULAR">Regular</option>
                        <option value="CONTRACTUAL">Contractual</option>
                        <option value="PART_TIME">Part-time</option>
                        <option value="INTERN">Intern</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Date Hired <span className="text-red-500">*</span></label>
                      <input type="date" value={form.hireDate} onChange={e => set("hireDate", e.target.value)}
                        className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Basic Salary (₱) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">₱</span>
                      <input type="number" min="0" step="0.01"
                        value={form.basicSalary} onChange={e => set("basicSalary", e.target.value)}
                        placeholder="0.00"
                        className={`${inputCls} pl-7`} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex gap-1">
                {(["personal", "employment"] as Tab[]).map((t, i) => (
                  <span key={t} className={`w-6 h-1.5 rounded-full transition-colors ${tab === t ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {tab === "personal" ? (
                  <button type="button" onClick={() => setTab("employment")}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => setTab("personal")}
                      className="px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors">
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? "Creating…" : "Create Employee"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
