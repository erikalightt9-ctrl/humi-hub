// Unit tests for enrollment service with mocked repositories and mailer

jest.mock("@/lib/repositories/enrollment.repository");
jest.mock("@/lib/services/notification.service");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimitAttempt: {
      count: jest.fn(),
      create: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
  },
}));

import { processEnrollment } from "@/lib/services/enrollment.service";
import * as repo from "@/lib/repositories/enrollment.repository";
import * as notificationService from "@/lib/services/notification.service";
import { prisma } from "@/lib/prisma";

const mockCreateEnrollment = repo.createEnrollment as jest.MockedFunction<typeof repo.createEnrollment>;
const mockCountByEmail = repo.countEnrollmentsByEmail as jest.MockedFunction<typeof repo.countEnrollmentsByEmail>;
const mockSendEmail = notificationService.sendEnrollmentConfirmationWithPayment as jest.MockedFunction<typeof notificationService.sendEnrollmentConfirmationWithPayment>;
const mockRateLimitCount = prisma.rateLimitAttempt.count as jest.MockedFunction<typeof prisma.rateLimitAttempt.count>;
const mockRateLimitCreate = prisma.rateLimitAttempt.create as jest.MockedFunction<typeof prisma.rateLimitAttempt.create>;
const mockCourseFind = prisma.course.findUnique as jest.MockedFunction<typeof prisma.course.findUnique>;

const VALID_DATA = {
  fullName: "Juan Dela Cruz",
  dateOfBirth: "2000-01-01",
  email: "juan@example.com",
  contactNumber: "+63 912 345 6789",
  address: "123 Main St, Barangay 1, Manila, Metro Manila, 1000",
  educationalBackground: "BS Information Technology, 2022",
  workExperience: "2 years customer service",
  employmentStatus: "EMPLOYED_FULL_TIME" as const,
  technicalSkills: ["Word", "Excel"],
  toolsFamiliarity: ["SLACK" as const],
  whyEnroll:
    "I want to enroll because I am looking to build a career as a virtual assistant and leverage my administrative skills to support international clients effectively while working remotely.",
  courseId: "clz1234567890abcdefghijk",
  courseTier: "BASIC" as const,
};

const MOCK_ENROLLMENT = {
  id: "cle1234567890",
  ...VALID_DATA,
  status: "PENDING" as const,
  dateOfBirth: new Date("2000-01-01"),
  ipAddress: "127.0.0.1",
  emailConfirmedAt: null,
  statusUpdatedAt: null,
  statusUpdatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: under rate limit and no existing enrollments
  (mockRateLimitCount as jest.Mock).mockResolvedValue(0);
  (mockRateLimitCreate as jest.Mock).mockResolvedValue({});
  mockCountByEmail.mockResolvedValue(0);
  mockCreateEnrollment.mockResolvedValue(MOCK_ENROLLMENT as never);
  // Default course tier pricing (used by getCourseTierPricing)
  (mockCourseFind as jest.Mock).mockResolvedValue({
    priceBasic: 5000,
    priceProfessional: 8000,
    priceAdvanced: 12000,
  });
  (mockSendEmail as jest.Mock).mockResolvedValue(undefined);
});

describe("processEnrollment", () => {
  it("returns success and creates enrollment for valid data", async () => {
    const result = await processEnrollment(VALID_DATA, "127.0.0.1");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.enrollment.id).toBe("cle1234567890");
    }
    expect(mockCreateEnrollment).toHaveBeenCalledTimes(1);
  });

  it("sends confirmation email after successful enrollment", async () => {
    await processEnrollment(VALID_DATA, "127.0.0.1");
    // Wait for async fire-and-forget
    await new Promise((r) => setTimeout(r, 10));
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it("returns RATE_LIMITED when attempts >= max", async () => {
    // count must be > RATE_LIMIT_MAX (5) because attempt is recorded BEFORE checking.
    // So count=6 means 6 total in window including the current one → blocked.
    (mockRateLimitCount as jest.Mock).mockResolvedValue(6);
    const result = await processEnrollment(VALID_DATA, "192.168.1.1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("RATE_LIMITED");
    }
    expect(mockCreateEnrollment).not.toHaveBeenCalled();
  });

  it("returns EMAIL_LIMIT_REACHED when email has too many enrollments", async () => {
    mockCountByEmail.mockResolvedValue(6); // exceeds MAX_ENROLLMENTS_PER_EMAIL (5)
    const result = await processEnrollment(VALID_DATA, "127.0.0.1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("EMAIL_LIMIT_REACHED");
    }
    expect(mockCreateEnrollment).not.toHaveBeenCalled();
  });

  it("records a rate limit attempt on each call", async () => {
    await processEnrollment(VALID_DATA, "10.0.0.1");
    expect(mockRateLimitCreate).toHaveBeenCalledWith({
      data: { ip: "10.0.0.1", endpoint: "enrollment" },
    });
  });

  it("strips HTML from text fields before saving", async () => {
    const maliciousData = {
      ...VALID_DATA,
      fullName: "<script>alert(1)</script>Juan",
      address: "<b>123 Main St</b>, Manila, Philippines, 1000",
    };
    await processEnrollment(maliciousData, "127.0.0.1");
    const callArgs = mockCreateEnrollment.mock.calls[0][0];
    expect(callArgs.fullName).not.toContain("<script>");
    expect(callArgs.address).not.toContain("<b>");
  });
});
