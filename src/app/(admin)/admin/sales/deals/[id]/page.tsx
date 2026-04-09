"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2, AlertCircle, ArrowLeft, FileText,
  PhoneCall, AtSign, Calendar, CheckSquare, Square,
  Plus, CheckCircle,
} from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface Activity {
  id: string;
  activityType: string;
  subject: string;
  body: string | null;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isDone: boolean;
}

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number | null;
  expectedCloseDate: string | null;
  notes: string | null;
  invoiceId: string | null;
  contact: Contact | null;
  activities: Activity[];
  tasks: Task[];
}

const STAGES = ["NEW_LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  NEW_LEAD:    "New Lead",
  QUALIFIED:   "Qualified",
  PROPOSAL:    "Proposal",
  NEGOTIATION: "Negotiation",
  WON:         "Won",
  LOST:        "Lost",
};

const STAGE_STYLES: Record<Stage, string> = {
  NEW_LEAD:    "bg-slate-100 text-slate-600",
  QUALIFIED:   "bg-blue-100 text-blue-700",
  PROPOSAL:    "bg-indigo-100 text-indigo-700",
  NEGOTIATION: "bg-amber-100 text-amber-700",
  WON:         "bg-green-100 text-green-700",
  LOST:        "bg-red-100 text-red-600",
};

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  NOTE:    <FileText className="h-4 w-4 text-slate-500" />,
  CALL:    <PhoneCall className="h-4 w-4 text-green-600" />,
  EMAIL:   <AtSign className="h-4 w-4 text-blue-600" />,
  MEETING: <Calendar className="h-4 w-4 text-purple-600" />,
};

const ACTIVITY_TYPES = ["NOTE", "CALL", "EMAIL", "MEETING"];

const fmt = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [deal, setDeal]           = useState<Deal | null>(null);
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [editForm, setEditForm]   = useState({
    title: "", value: "", stage: "" as Stage, probability: "",
    expectedCloseDate: "", contactId: "", notes: "",
  });
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [converting, setConverting] = useState(false);
  const [convertMsg, setConvertMsg] = useState<string | null>(null);

  const [actForm, setActForm]     = useState({ activityType: "NOTE", subject: "", body: "" });
  const [savingAct, setSavingAct] = useState(false);
  const [actError, setActError]   = useState<string | null>(null);

  const [taskForm, setTaskForm]   = useState({ title: "", description: "", dueDate: "" });
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dealRes, contactsRes] = await Promise.all([
        fetch(`/api/admin/sales/deals/${id}`),
        fetch("/api/admin/sales/contacts?limit=200"),
      ]);
      const dealJson     = await dealRes.json();
      const contactsJson = await contactsRes.json();
      if (!dealJson.success) throw new Error(dealJson.error);
      const d = dealJson.data;
      setDeal(d);
      setEditForm({
        title:             d.title,
        value:             String(d.value),
        stage:             d.stage,
        probability:       String(d.probability ?? ""),
        expectedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.split("T")[0] : "",
        contactId:         d.contact?.id ?? "",
        notes:             d.notes ?? "",
      });
      if (contactsJson.success) setContacts(contactsJson.data.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deal");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const saveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const body = {
        title:             editForm.title,
        value:             parseFloat(editForm.value) || 0,
        stage:             editForm.stage,
        probability:       editForm.probability ? parseInt(editForm.probability) : null,
        expectedCloseDate: editForm.expectedCloseDate || null,
        contactId:         editForm.contactId || null,
        notes:             editForm.notes || null,
      };
      const res  = await fetch(`/api/admin/sales/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const moveStage = async (newStage: Stage) => {
    setEditForm((f) => ({ ...f, stage: newStage }));
    try {
      const res  = await fetch(`/api/admin/sales/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to move stage");
    }
  };

  const convertInvoice = async () => {
    setConverting(true);
    setConvertMsg(null);
    try {
      const res  = await fetch(`/api/admin/sales/deals/${id}/convert-invoice`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setConvertMsg(`Invoice created: ${json.data.invoiceNumber ?? json.data.invoiceId}`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to convert to invoice");
    } finally {
      setConverting(false);
    }
  };

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAct(true);
    setActError(null);
    try {
      const res  = await fetch("/api/admin/sales/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...actForm, dealId: id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setActForm({ activityType: "NOTE", subject: "", body: "" });
      load();
    } catch (e) {
      setActError(e instanceof Error ? e.message : "Failed to log activity");
    } finally {
      setSavingAct(false);
    }
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTask(true);
    setTaskError(null);
    try {
      const res  = await fetch("/api/admin/sales/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskForm, dealId: id, dueDate: taskForm.dueDate || null }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTaskForm({ title: "", description: "", dueDate: "" });
      setShowTaskForm(false);
      load();
    } catch (e) {
      setTaskError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setSavingTask(false);
    }
  };

  const toggleTask = async (taskId: string, isDone: boolean) => {
    try {
      const res  = await fetch(`/api/admin/sales/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !isDone }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error ?? "Deal not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/sales/deals"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Pipeline
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-900">{deal.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_STYLES[deal.stage as Stage] ?? "bg-slate-100 text-slate-600"}`}>
              {STAGE_LABELS[deal.stage as Stage] ?? deal.stage}
            </span>
            {deal.invoiceId && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700">
                Invoice Created
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-indigo-700">{fmt(Number(deal.value))}</p>
        </div>
        {deal.stage === "WON" && !deal.invoiceId && (
          <div>
            {convertMsg ? (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="h-4 w-4" /> {convertMsg}
              </div>
            ) : (
              <button
                onClick={convertInvoice}
                disabled={converting}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {converting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Convert to Invoice
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Stage Move */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 mr-1">Move to:</span>
        {STAGES.filter((s) => s !== deal.stage).map((s) => (
          <button
            key={s}
            onClick={() => moveStage(s)}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors hover:opacity-80 ${STAGE_STYLES[s]}`}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Edit Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Deal Details</h2>
        {saveError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{saveError}</span>
          </div>
        )}
        <form onSubmit={saveDeal} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
            <input
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Value (₱)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editForm.value}
              onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
            <select
              value={editForm.stage}
              onChange={(e) => setEditForm({ ...editForm, stage: e.target.value as Stage })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Probability (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={editForm.probability}
              onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Expected Close Date</label>
            <input
              type="date"
              value={editForm.expectedCloseDate}
              onChange={(e) => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contact</label>
            <select
              value={editForm.contactId}
              onChange={(e) => setEditForm({ ...editForm, contactId: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— No contact —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Activities */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Activities</h2>
        {deal.activities.length === 0 ? (
          <p className="text-sm text-slate-400 mb-4">No activities yet.</p>
        ) : (
          <div className="space-y-3 mb-5">
            {deal.activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="mt-0.5">{ACTIVITY_ICON[act.activityType] ?? <FileText className="h-4 w-4 text-slate-400" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{act.subject}</p>
                  {act.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{act.body}</p>}
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(act.createdAt).toLocaleDateString("en-PH")}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Log Activity</h3>
          {actError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{actError}</span>
            </div>
          )}
          <form onSubmit={submitActivity} className="space-y-3">
            <div className="flex gap-3">
              <select
                value={actForm.activityType}
                onChange={(e) => setActForm({ ...actForm, activityType: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                required
                placeholder="Subject *"
                value={actForm.subject}
                onChange={(e) => setActForm({ ...actForm, subject: e.target.value })}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <textarea
              placeholder="Notes / details..."
              value={actForm.body}
              onChange={(e) => setActForm({ ...actForm, body: e.target.value })}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingAct}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingAct && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Log Activity
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Tasks</h2>
          <button
            onClick={() => setShowTaskForm((v) => !v)}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>

        {showTaskForm && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            {taskError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{taskError}</span>
              </div>
            )}
            <form onSubmit={submitTask} className="space-y-3">
              <input
                required
                placeholder="Task title *"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-3">
                <input
                  placeholder="Description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingTask && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        )}

        {deal.tasks.length === 0 ? (
          <p className="text-sm text-slate-400">No tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {deal.tasks.map((task) => {
              const isOverdue = !task.isDone && task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <div key={task.id} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(task.id, task.isDone)}
                    className={`mt-0.5 flex-shrink-0 ${task.isDone ? "text-green-600" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {task.isDone
                      ? <CheckSquare className="h-4 w-4" />
                      : <Square className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-500">{task.description}</p>
                    )}
                  </div>
                  {task.dueDate && (
                    <span className={`text-xs shrink-0 ${isOverdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
                      {new Date(task.dueDate).toLocaleDateString("en-PH")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
