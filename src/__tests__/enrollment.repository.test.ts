jest.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import {
  createEnrollment,
  findEnrollmentByEmail,
  findEnrollmentById,
  listEnrollments,
  updateEnrollmentStatus,
  getAllEnrollmentsForExport,
} from "@/lib/repositories/enrollment.repository";
import { prisma } from "@/lib/prisma";

const mockPrisma = prisma.enrollment as jest.Mocked<typeof prisma.enrollment>;

const MOCK_ENROLLMENT = {
  id: "cle001",
  status: "PENDING" as const,
  fullName: "Juan Dela Cruz",
  dateOfBirth: new Date("2000-01-01"),
  email: "juan@example.com",
  contactNumber: "+63 912 345 6789",
  address: "123 Main St, Manila",
  educationalBackground: "BS IT",
  workExperience: "2 years",
  employmentStatus: "EMPLOYED_FULL_TIME" as const,
  technicalSkills: ["Word"],
  toolsFamiliarity: ["SLACK" as const],
  whyEnroll: "I want to grow my career",
  courseId: "course001",
  ipAddress: "127.0.0.1",
  emailConfirmedAt: null,
  statusUpdatedAt: null,
  statusUpdatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe("createEnrollment", () => {
  it("calls prisma.enrollment.create with correct data", async () => {
    (mockPrisma.create as jest.Mock).mockResolvedValue(MOCK_ENROLLMENT);
    const result = await createEnrollment({
      fullName: "Juan Dela Cruz",
      dateOfBirth: "2000-01-01",
      email: "juan@example.com",
      contactNumber: "+63 912 345 6789",
      address: "123 Main St, Manila",
      educationalBackground: "BS IT",
      workExperience: "2 years",
      employmentStatus: "EMPLOYED_FULL_TIME",
      technicalSkills: ["Word"],
      toolsFamiliarity: ["SLACK"],
      whyEnroll: "I want to grow",
      courseId: "course001",
      ipAddress: "127.0.0.1",
    });
    expect(mockPrisma.create).toHaveBeenCalledTimes(1);
    expect(result.email).toBe("juan@example.com");
  });
});

describe("findEnrollmentByEmail", () => {
  it("returns enrollment when found", async () => {
    (mockPrisma.findUnique as jest.Mock).mockResolvedValue(MOCK_ENROLLMENT);
    const result = await findEnrollmentByEmail("juan@example.com");
    expect(result?.email).toBe("juan@example.com");
  });

  it("returns null when not found", async () => {
    (mockPrisma.findUnique as jest.Mock).mockResolvedValue(null);
    const result = await findEnrollmentByEmail("notexist@example.com");
    expect(result).toBeNull();
  });
});

describe("findEnrollmentById", () => {
  it("returns enrollment with course when found", async () => {
    const withCourse = { ...MOCK_ENROLLMENT, course: { id: "course001", slug: "MEDICAL_VA", title: "Medical VA" } };
    (mockPrisma.findUnique as jest.Mock).mockResolvedValue(withCourse);
    const result = await findEnrollmentById("cle001");
    expect(result?.id).toBe("cle001");
    expect(result?.course.title).toBe("Medical VA");
  });
});

describe("listEnrollments", () => {
  it("returns paginated results", async () => {
    const withCourse = { ...MOCK_ENROLLMENT, course: { id: "course001", slug: "MEDICAL_VA", title: "Medical VA" } };
    (mockPrisma.findMany as jest.Mock).mockResolvedValue([withCourse]);
    (mockPrisma.count as jest.Mock).mockResolvedValue(1);

    const result = await listEnrollments({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });

  it("applies status filter", async () => {
    (mockPrisma.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.count as jest.Mock).mockResolvedValue(0);

    await listEnrollments({ status: "APPROVED", page: 1, limit: 20 });
    const whereArg = (mockPrisma.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg.status).toBe("APPROVED");
  });

  it("applies search filter", async () => {
    (mockPrisma.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.count as jest.Mock).mockResolvedValue(0);

    await listEnrollments({ search: "juan", page: 1, limit: 20 });
    const whereArg = (mockPrisma.findMany as jest.Mock).mock.calls[0][0].where;
    expect(whereArg.OR).toBeDefined();
  });

  it("calculates correct pagination skip", async () => {
    (mockPrisma.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.count as jest.Mock).mockResolvedValue(25);

    await listEnrollments({ page: 2, limit: 10 });
    const skipArg = (mockPrisma.findMany as jest.Mock).mock.calls[0][0].skip;
    expect(skipArg).toBe(10);
  });
});

describe("updateEnrollmentStatus", () => {
  it("updates status and sets statusUpdatedAt and statusUpdatedBy", async () => {
    (mockPrisma.update as jest.Mock).mockResolvedValue({ ...MOCK_ENROLLMENT, status: "APPROVED" });
    const result = await updateEnrollmentStatus("cle001", "APPROVED", "admin001");
    const updateArgs = (mockPrisma.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.status).toBe("APPROVED");
    expect(updateArgs.data.statusUpdatedBy).toBe("admin001");
    expect(updateArgs.data.statusUpdatedAt).toBeInstanceOf(Date);
    expect(result.status).toBe("APPROVED");
  });
});

describe("getAllEnrollmentsForExport", () => {
  it("returns all enrollments ordered by createdAt desc", async () => {
    (mockPrisma.findMany as jest.Mock).mockResolvedValue([]);
    await getAllEnrollmentsForExport();
    const orderByArg = (mockPrisma.findMany as jest.Mock).mock.calls[0][0].orderBy;
    expect(orderByArg).toEqual({ createdAt: "desc" });
  });
});
