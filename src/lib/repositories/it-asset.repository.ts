/**
 * IT Asset Management — Repository Layer
 */
import { prisma } from "@/lib/prisma";
import type { ItAssetStatus, ItAssetCondition } from "@prisma/client";
import { Prisma } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Asset Tag Generator                                                */
/* ------------------------------------------------------------------ */

export async function generateAssetTag(organizationId: string): Promise<string> {
  const count = await prisma.itAsset.count({ where: { organizationId } });
  const seq   = String(count + 1).padStart(5, "0");
  return `IT-${seq}`;
}

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

export function listCategories(organizationId: string) {
  return prisma.itAssetCategory.findMany({
    where:   { organizationId },
    orderBy: { name: "asc" },
  });
}

export function createCategory(organizationId: string, name: string, depreciationYears = 5) {
  return prisma.itAssetCategory.create({
    data: { organizationId, name, depreciationYears },
  });
}

/* ------------------------------------------------------------------ */
/*  Assets — List                                                      */
/* ------------------------------------------------------------------ */

interface ListAssetsOpts {
  status?:   ItAssetStatus;
  category?: string;
  location?: string;
  search?:   string;
  limit?:    number;
  offset?:   number;
}

export async function listAssets(organizationId: string, opts: ListAssetsOpts = {}) {
  const where: Prisma.ItAssetWhereInput = { organizationId };
  if (opts.status)   where.status     = opts.status;
  if (opts.category) where.categoryId = opts.category;
  if (opts.location) where.location   = opts.location;
  if (opts.search) {
    where.OR = [
      { assetName:    { contains: opts.search, mode: "insensitive" } },
      { assetTag:     { contains: opts.search, mode: "insensitive" } },
      { brand:        { contains: opts.search, mode: "insensitive" } },
      { serialNumber: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.itAsset.findMany({
      where,
      include: {
        category:   { select: { name: true } },
        assignedTo: { select: { firstName: true, lastName: true, position: true } },
      },
      orderBy: { createdAt: "desc" },
      take: opts.limit  ?? 50,
      skip: opts.offset ?? 0,
    }),
    prisma.itAsset.count({ where }),
  ]);

  return { data, total };
}

/* ------------------------------------------------------------------ */
/*  Assets — Dashboard Stats                                           */
/* ------------------------------------------------------------------ */

export async function getAssetStats(organizationId: string) {
  const [total, byStatus, byCondition] = await Promise.all([
    prisma.itAsset.count({ where: { organizationId } }),
    prisma.itAsset.groupBy({
      by:    ["status"],
      where: { organizationId },
      _count: true,
    }),
    prisma.itAsset.groupBy({
      by:    ["condition"],
      where: { organizationId },
      _count: true,
    }),
  ]);

  const statusMap:    Record<string, number> = {};
  const conditionMap: Record<string, number> = {};
  byStatus.forEach((s)    => { statusMap[s.status]       = s._count; });
  byCondition.forEach((c) => { conditionMap[c.condition]  = c._count; });

  return {
    total,
    available:   statusMap.AVAILABLE    ?? 0,
    assigned:    statusMap.ASSIGNED     ?? 0,
    inRepair:    statusMap.IN_REPAIR    ?? 0,
    forDisposal: statusMap.FOR_DISPOSAL ?? 0,
    retired:     statusMap.RETIRED      ?? 0,
    conditionMap,
  };
}

/* ------------------------------------------------------------------ */
/*  Assets — CRUD                                                      */
/* ------------------------------------------------------------------ */

export interface CreateAssetInput {
  assetName:     string;
  categoryId?:   string;
  brand?:        string;
  model?:        string;
  serialNumber?: string;
  specs?:        Record<string, unknown>;
  purchaseDate?: Date;
  purchaseCost?: number;
  supplier?:     string;
  warrantyStart?: Date;
  warrantyEnd?:  Date;
  condition?:    ItAssetCondition;
  location?:     string;
  notes?:        string;
}

export async function createAsset(organizationId: string, input: CreateAssetInput) {
  const assetTag = await generateAssetTag(organizationId);

  const asset = await prisma.itAsset.create({
    data: {
      organizationId,
      assetTag,
      assetName:    input.assetName,
      categoryId:   input.categoryId ?? null,
      brand:        input.brand      ?? null,
      model:        input.model      ?? null,
      serialNumber: input.serialNumber ?? null,
      specs:        input.specs as import("@prisma/client").Prisma.InputJsonValue ?? undefined,
      purchaseDate: input.purchaseDate ?? null,
      purchaseCost: input.purchaseCost != null ? new Prisma.Decimal(input.purchaseCost) : null,
      supplier:     input.supplier   ?? null,
      warrantyStart: input.warrantyStart ?? null,
      warrantyEnd:  input.warrantyEnd ?? null,
      condition:    input.condition   ?? "NEW",
      location:     input.location   ?? null,
      notes:        input.notes      ?? null,
    },
    include: {
      category:   { select: { name: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  await logHistory(asset.id, "created", { newStatus: "AVAILABLE" });

  return asset;
}

export function getAssetById(organizationId: string, id: string) {
  return prisma.itAsset.findFirst({
    where: { id, organizationId },
    include: {
      category:   { select: { id: true, name: true, depreciationYears: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, position: true, email: true, department: true } },
    },
  });
}

export async function updateAsset(
  organizationId: string,
  id: string,
  data: Partial<CreateAssetInput> & { status?: ItAssetStatus; condition?: ItAssetCondition }
) {
  const current = await prisma.itAsset.findFirst({ where: { id, organizationId } });
  if (!current) return null;

  const updateData: Prisma.ItAssetUpdateInput = {};
  if (data.assetName !== undefined)    updateData.assetName    = data.assetName;
  if (data.categoryId !== undefined)   updateData.category     = data.categoryId ? { connect: { id: data.categoryId } } : { disconnect: true };
  if (data.brand !== undefined)        updateData.brand        = data.brand;
  if (data.model !== undefined)        updateData.model        = data.model;
  if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
  if (data.specs !== undefined)        updateData.specs        = data.specs as import("@prisma/client").Prisma.InputJsonValue ?? undefined;
  if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate;
  if (data.purchaseCost !== undefined) updateData.purchaseCost = data.purchaseCost != null ? new Prisma.Decimal(data.purchaseCost) : null;
  if (data.supplier !== undefined)     updateData.supplier     = data.supplier;
  if (data.warrantyStart !== undefined) updateData.warrantyStart = data.warrantyStart;
  if (data.warrantyEnd !== undefined)  updateData.warrantyEnd  = data.warrantyEnd;
  if (data.condition !== undefined)    updateData.condition     = data.condition;
  if (data.location !== undefined)     updateData.location      = data.location;
  if (data.notes !== undefined)        updateData.notes         = data.notes;

  if (data.status !== undefined && data.status !== current.status) {
    updateData.status = data.status;
    await logHistory(id, "status_changed", {
      previousStatus: current.status,
      newStatus:      data.status,
    });
  }

  return prisma.itAsset.update({
    where: { id },
    data:  updateData,
    include: {
      category:   { select: { name: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Assets — Assignment                                                */
/* ------------------------------------------------------------------ */

export async function assignAsset(
  organizationId: string,
  assetId: string,
  employeeId: string,
  performedById?: string
) {
  const asset = await prisma.itAsset.findFirst({ where: { id: assetId, organizationId } });
  if (!asset) throw new Error("Asset not found");
  if (asset.status === "RETIRED") throw new Error("Cannot assign a retired asset");

  const updated = await prisma.itAsset.update({
    where: { id: assetId },
    data: {
      assignedToId: employeeId,
      assignedDate: new Date(),
      status:       "ASSIGNED",
    },
    include: {
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  await logHistory(assetId, "assigned", {
    previousStatus: asset.status,
    newStatus:      "ASSIGNED",
    assignedToId:   employeeId,
    performedById,
  });

  return updated;
}

export async function returnAsset(
  organizationId: string,
  assetId: string,
  performedById?: string,
  remarks?: string
) {
  const asset = await prisma.itAsset.findFirst({ where: { id: assetId, organizationId } });
  if (!asset) throw new Error("Asset not found");

  const updated = await prisma.itAsset.update({
    where: { id: assetId },
    data: {
      assignedToId: null,
      assignedDate: null,
      status:       "AVAILABLE",
    },
  });

  await logHistory(assetId, "returned", {
    previousStatus: "ASSIGNED",
    newStatus:      "AVAILABLE",
    assignedToId:   asset.assignedToId,
    performedById,
    remarks,
  });

  return updated;
}

/* ------------------------------------------------------------------ */
/*  History / Audit Trail                                              */
/* ------------------------------------------------------------------ */

interface LogOpts {
  previousStatus?: string;
  newStatus?:      string;
  assignedToId?:   string | null;
  performedById?:  string | null;
  remarks?:        string;
}

function logHistory(assetId: string, action: string, opts: LogOpts = {}) {
  return prisma.itAssetHistoryLog.create({
    data: {
      assetId,
      action,
      previousStatus: opts.previousStatus ?? null,
      newStatus:      opts.newStatus      ?? null,
      assignedToId:   opts.assignedToId   ?? null,
      performedById:  opts.performedById  ?? null,
      remarks:        opts.remarks        ?? null,
    },
  });
}

export function getAssetHistory(assetId: string) {
  return prisma.itAssetHistoryLog.findMany({
    where:   { assetId },
    include: {
      assignedTo:  { select: { firstName: true, lastName: true } },
      performedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/* ------------------------------------------------------------------ */
/*  Maintenance Records                                                */
/* ------------------------------------------------------------------ */

export function listMaintenance(assetId: string) {
  return prisma.itMaintenanceRecord.findMany({
    where:   { assetId },
    orderBy: { reportedDate: "desc" },
  });
}

export async function createMaintenance(
  organizationId: string,
  assetId: string,
  input: { issueDescription: string; vendor?: string; cost?: number; notes?: string }
) {
  const asset = await prisma.itAsset.findFirst({ where: { id: assetId, organizationId } });
  if (!asset) throw new Error("Asset not found");

  const prevStatus = asset.status;

  const [record] = await Promise.all([
    prisma.itMaintenanceRecord.create({
      data: {
        assetId,
        issueDescription: input.issueDescription,
        vendor:           input.vendor ?? null,
        cost:             input.cost != null ? new Prisma.Decimal(input.cost) : null,
        notes:            input.notes ?? null,
      },
    }),
    prisma.itAsset.update({
      where: { id: assetId },
      data:  { status: "IN_REPAIR" },
    }),
  ]);

  await logHistory(assetId, "repair_started", {
    previousStatus: prevStatus,
    newStatus:      "IN_REPAIR",
    remarks:        input.issueDescription,
  });

  return record;
}

export async function resolveMaintenance(
  organizationId: string,
  recordId: string,
  opts: { cost?: number; notes?: string } = {}
) {
  const record = await prisma.itMaintenanceRecord.findUnique({
    where:   { id: recordId },
    include: { asset: true },
  });
  if (!record || record.asset.organizationId !== organizationId) throw new Error("Record not found");

  const updated = await prisma.itMaintenanceRecord.update({
    where: { id: recordId },
    data: {
      status:       "RESOLVED",
      resolvedDate: new Date(),
      cost:         opts.cost != null ? new Prisma.Decimal(opts.cost) : record.cost,
      notes:        opts.notes ?? record.notes,
    },
  });

  // If no other pending maintenance, move asset back to available/assigned
  const pendingCount = await prisma.itMaintenanceRecord.count({
    where: { assetId: record.assetId, status: { not: "RESOLVED" }, id: { not: recordId } },
  });

  if (pendingCount === 0) {
    const newStatus = record.asset.assignedToId ? "ASSIGNED" : "AVAILABLE";
    await prisma.itAsset.update({
      where: { id: record.assetId },
      data:  { status: newStatus },
    });

    await logHistory(record.assetId, "repaired", {
      previousStatus: "IN_REPAIR",
      newStatus,
    });
  }

  return updated;
}
