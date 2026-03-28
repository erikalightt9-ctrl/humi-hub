jest.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: {
      count: jest.fn(),
    },
    course: {
      findMany: jest.fn(),
    },
  },
}));

import { getAnalyticsStats } from "@/lib/repositories/admin.repository";
import { prisma } from "@/lib/prisma";

const mockEnrollmentCount = prisma.enrollment.count as jest.MockedFunction<typeof prisma.enrollment.count>;
const mockCourseFindMany = prisma.course.findMany as jest.MockedFunction<typeof prisma.course.findMany>;

beforeEach(() => jest.clearAllMocks());

describe("getAnalyticsStats", () => {
  it("returns correct stats with enrolled courses", async () => {
    (mockEnrollmentCount as jest.Mock)
      .mockResolvedValueOnce(10) // totalEnrollments
      .mockResolvedValueOnce(4)  // pendingCount
      .mockResolvedValueOnce(5)  // approvedCount
      .mockResolvedValueOnce(1)  // rejectedCount
      .mockResolvedValueOnce(3); // recentEnrollments

    (mockCourseFindMany as jest.Mock).mockResolvedValue([
      { slug: "MEDICAL_VA", title: "Medical VA", _count: { enrollments: 5 } },
      { slug: "REAL_ESTATE_VA", title: "Real Estate VA", _count: { enrollments: 3 } },
      { slug: "US_BOOKKEEPING_VA", title: "US Bookkeeping VA", _count: { enrollments: 2 } },
    ]);

    const stats = await getAnalyticsStats("test-tenant-id");

    expect(stats.totalEnrollments).toBe(10);
    expect(stats.pendingCount).toBe(4);
    expect(stats.approvedCount).toBe(5);
    expect(stats.rejectedCount).toBe(1);
    expect(stats.recentEnrollments).toBe(3);
    expect(stats.enrollmentsByCourse).toHaveLength(3);
    expect(stats.enrollmentsByCourse[0].slug).toBe("MEDICAL_VA");
    expect(stats.enrollmentsByCourse[0].count).toBe(5);
  });

  it("returns zeros when no enrollments", async () => {
    (mockEnrollmentCount as jest.Mock).mockResolvedValue(0);
    (mockCourseFindMany as jest.Mock).mockResolvedValue([]);

    const stats = await getAnalyticsStats("test-tenant-id");

    expect(stats.totalEnrollments).toBe(0);
    expect(stats.enrollmentsByCourse).toHaveLength(0);
  });
});
