"use client";

import { useEffect, useState, useRef } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Globe,
} from "lucide-react";

type RevenueType =
  | "PLATFORM_FEE"
  | "TENANT_SUBSCRIPTION"
  | "ENROLLMENT_PAYMENT"
  | "TRAINER_EARNING"
  | "REFUND"
  | "MANUAL";

interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorRole: string;
  reason?: string | null;
  createdAt: string;
}

interface RevenueRecord {
  id: string;
  type: RevenueType;
  amount: number;
  currency: string;
  description?: string | null;
  userId?: string | null;
  userType?: string | null;
  tenantId?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  auditLogs: AuditLog[];
}

const REVENUE_TYPES: RevenueType[] = [
  "PLATFORM_FEE",
  "TENANT_SUBSCRIPTION",
  "ENROLLMENT_PAYMENT",
  "TRAINER_EARNING",
  "REFUND",
  "MANUAL",
];

const TYPE_LABELS: Record<RevenueType, string> = {
  PLATFORM_FEE: "Platform Fee",
  TENANT_SUBSCRIPTION: "Tenant Subscription",
  ENROLLMENT_PAYMENT: "Enrollment Payment",
  TRAINER_EARNING: "Trainer Earning",
  REFUND: "Refund",
  MANUAL: "Manual",
};

const TYPE_COLORS: Record<RevenueType, string> = {
  PLATFORM_FEE: "bg-blue-900/40 text-blue-300",
  TENANT_SUBSCRIPTION: "bg-purple-900/40 text-purple-300",
  ENROLLMENT_PAYMENT: "bg-green-900/40 text-green-300",
  TRAINER_EARNING: "bg-yellow-900/40 text-yellow-300",
  REFUND: "bg-red-900/40 text-red-300",
  MANUAL: "bg-gray-700/60 text-gray-300",
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface CreateFormData {
  type: RevenueType;
  amount: string;
  currency: string;
  description: string;
  userId: string;
  userType: string;
  tenantId: string;
  referenceId: string;
  referenceType: string;
}

interface EditFormData {
  type: RevenueType;
  amount: string;
  currency: string;
  description: string;
  reason: string;
}

const defaultCreateForm: CreateFormData = {
  type: "MANUAL",
  amount: "",
  currency: "PHP",
  description: "",
  userId: "",
  userType: "",
  tenantId: "",
  referenceId: "",
  referenceType: "",
};

const defaultEditForm: EditFormData = {
  type: "MANUAL",
  amount: "",
  currency: "PHP",
  description: "",
  reason: "",
};

export default function SuperadminRevenuePage() {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RevenueRecord | null>(
    null
  );

  // Forms
  const [createForm, setCreateForm] =
    useState<CreateFormData>(defaultCreateForm);
  const [editForm, setEditForm] = useState<EditFormData>(defaultEditForm);
  const [deleteReason, setDeleteReason] = useState("");

  // Import
  const [importResult, setImportResult] = useState<{
    created: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/revenue?page=${p}&limit=50`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setRecords(json.data.records);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, []);

  // Platform-wide summary calculations
  const platformFeeTotal = records
    .filter((r) => r.type === "PLATFORM_FEE")
    .reduce((s, r) => s + Number(r.amount), 0);
  const subscriptionTotal = records
    .filter((r) => r.type === "TENANT_SUBSCRIPTION")
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalRevenue = records.reduce(
    (sum, r) => (r.type !== "REFUND" ? sum + Number(r.amount) : sum),
    0
  );
  const refundsTotal = records
    .filter((r) => r.type === "REFUND")
    .reduce((s, r) => s + Number(r.amount), 0);

  // Unique tenants
  const tenantCount = new Set(
    records.filter((r) => r.tenantId).map((r) => r.tenantId)
  ).size;

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          amount: parseFloat(createForm.amount),
          tenantId: createForm.tenantId || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccessMsg("Record created successfully");
      setShowCreate(false);
      setCreateForm(defaultCreateForm);
      fetchRecords(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create record");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (record: RevenueRecord) => {
    setSelectedRecord(record);
    setEditForm({
      type: record.type,
      amount: String(record.amount),
      currency: record.currency,
      description: record.description ?? "",
      reason: "",
    });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/revenue/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          amount: parseFloat(editForm.amount),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccessMsg("Record updated successfully");
      setShowEdit(false);
      setSelectedRecord(null);
      fetchRecords(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update record");
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (record: RevenueRecord) => {
    setSelectedRecord(record);
    setDeleteReason("");
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/revenue/${selectedRecord.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason || "Deleted by superadmin" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSuccessMsg("Record deleted successfully");
      setShowDelete(false);
      setSelectedRecord(null);
      fetchRecords(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/revenue/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/revenue/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setImportResult(json.data);
      fetchRecords(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
    setImportResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0f1623] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">
              Platform Revenue — All Tenants
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Platform-wide revenue across all tenants and users
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e2d45] hover:bg-[#263a59] text-gray-300 rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-[#1e2d45] hover:bg-[#263a59] text-gray-300 rounded-lg text-sm cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Import
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Notifications */}
      {(error || successMsg || importResult) && (
        <div className="mb-4 space-y-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/40 border border-red-800 rounded-lg text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={clearMessages} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-green-900/40 border border-green-800 rounded-lg text-green-300 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {successMsg}
              <button onClick={clearMessages} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {importResult && (
            <div className="p-3 bg-blue-900/40 border border-blue-800 rounded-lg text-sm">
              <p className="text-blue-300 font-medium">
                Import complete: {importResult.created} records created
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-1 text-red-300 list-disc list-inside">
                  {importResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li>...and {importResult.errors.length - 5} more errors</li>
                  )}
                </ul>
              )}
              <button
                onClick={clearMessages}
                className="mt-1 text-blue-400 text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a2535] rounded-xl p-5 border border-[#243047]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Platform Revenue</span>
            <div className="p-2 bg-blue-900/40 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatAmount(totalRevenue, "PHP")}
          </p>
          <p className="text-xs text-gray-500 mt-1">All tenants, excl. refunds</p>
        </div>
        <div className="bg-[#1a2535] rounded-xl p-5 border border-[#243047]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Platform Fees</span>
            <div className="p-2 bg-purple-900/40 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatAmount(platformFeeTotal, "PHP")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {records.filter((r) => r.type === "PLATFORM_FEE").length} records
          </p>
        </div>
        <div className="bg-[#1a2535] rounded-xl p-5 border border-[#243047]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Subscriptions</span>
            <div className="p-2 bg-green-900/40 rounded-lg">
              <BarChart2 className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatAmount(subscriptionTotal, "PHP")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {tenantCount} active tenants
          </p>
        </div>
        <div className="bg-[#1a2535] rounded-xl p-5 border border-[#243047]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Total Refunds</span>
            <div className="p-2 bg-red-900/40 rounded-lg">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatAmount(refundsTotal, "PHP")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {records.filter((r) => r.type === "REFUND").length} refunds
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a2535] rounded-xl border border-[#243047] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#243047] bg-[#152030]">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Type
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Description
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Tenant
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  User
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Created
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-gray-500"
                  >
                    No revenue records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-[#1e2d45] hover:bg-[#1e2d45]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[record.type]}`}
                      >
                        {TYPE_LABELS[record.type]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white">
                      {formatAmount(Number(record.amount), record.currency)}
                    </td>
                    <td className="py-3 px-4 text-gray-300 max-w-[160px] truncate">
                      {record.description ?? (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs font-mono">
                      {record.tenantId ? (
                        record.tenantId.slice(0, 8) + "..."
                      ) : (
                        <span className="text-gray-600">Platform</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {record.userId ? (
                        <span>
                          {record.userType && (
                            <span className="text-gray-500">
                              {record.userType}:{" "}
                            </span>
                          )}
                          {record.userId.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-900/30 text-green-400">
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(record)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDelete(record)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#243047]">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} ({total} records)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchRecords(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs bg-[#152030] text-gray-400 rounded disabled:opacity-40 hover:bg-[#1e2d45] transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchRecords(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs bg-[#152030] text-gray-400 rounded disabled:opacity-40 hover:bg-[#1e2d45] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1a2535] rounded-xl p-6 w-full max-w-md border border-[#243047] shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                Add Revenue Record
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Type
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      type: e.target.value as RevenueType,
                    })
                  }
                  className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {REVENUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.amount}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={createForm.currency}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        currency: e.target.value,
                      })
                    }
                    placeholder="PHP"
                    className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Tenant ID{" "}
                  <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={createForm.tenantId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, tenantId: e.target.value })
                  }
                  placeholder="Leave blank for platform-level"
                  className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional description"
                  className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={createForm.userId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, userId: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    User Type
                  </label>
                  <input
                    type="text"
                    value={createForm.userType}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        userType: e.target.value,
                      })
                    }
                    placeholder="e.g. student"
                    className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !createForm.amount}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {submitting ? "Creating..." : "Create Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1a2535] rounded-xl p-6 w-full max-w-md border border-[#243047] shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                Edit Revenue Record
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Type
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      type: e.target.value as RevenueType,
                    })
                  }
                  className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {REVENUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, amount: e.target.value })
                    }
                    className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={editForm.currency}
                    onChange={(e) =>
                      setEditForm({ ...editForm, currency: e.target.value })
                    }
                    className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Reason for edit{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reason: e.target.value })
                  }
                  placeholder="Describe why you are editing this record"
                  className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              {selectedRecord.tenantId && (
                <div className="p-2 bg-[#0f1623] rounded text-xs text-gray-500">
                  Tenant: {selectedRecord.tenantId}
                </div>
              )}
              {selectedRecord.auditLogs.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Recent changes:</p>
                  <ul className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedRecord.auditLogs.slice(0, 3).map((log) => (
                      <li key={log.id} className="text-xs text-gray-500">
                        <span className="text-gray-400 font-medium">
                          {log.action}
                        </span>{" "}
                        by {log.actorRole} on {formatDate(log.createdAt)}
                        {log.reason && (
                          <span className="text-gray-600">
                            {" "}
                            — {log.reason}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={submitting || !editForm.reason}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1a2535] rounded-xl p-6 w-full max-w-sm border border-[#243047] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-900/40 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Delete Record
              </h2>
            </div>
            {selectedRecord.tenantId && (
              <p className="text-xs text-gray-500 mb-3">
                Tenant: {selectedRecord.tenantId}
              </p>
            )}
            <p className="text-sm text-gray-400 mb-4">
              This will soft-delete the record (history preserved). You can
              provide a reason below.
            </p>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason for deletion"
                className="w-full bg-[#152030] border border-[#243047] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {submitting ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
