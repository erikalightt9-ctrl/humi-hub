import { enrollmentSchema } from "@/lib/validations/enrollment.schema";

// Fixed future courseId for all tests
const BASE_VALID: Record<string, unknown> = {
  fullName: "Juan Dela Cruz",
  dateOfBirth: "2000-01-01",
  email: "juan@example.com",
  contactNumber: "+63 912 345 6789",
  address: "123 Main St, Barangay 1, Manila, Metro Manila, 1000",
  educationalBackground: "Bachelor of Science in Information Technology, 2022",
  workExperience: "2 years as customer service representative",
  employmentStatus: "EMPLOYED_FULL_TIME",
  technicalSkills: ["Microsoft Word", "Excel"],
  toolsFamiliarity: ["SLACK", "ZOOM"],
  whyEnroll:
    "I want to enroll because I am looking to transition into the virtual assistant industry to leverage my administrative skills and expand my remote work opportunities. This program aligns perfectly with my career goals.",
  courseId: "clz1234567890abcdefghijk",
};

describe("enrollmentSchema", () => {
  describe("valid data", () => {
    it("accepts a fully valid submission", () => {
      const result = enrollmentSchema.safeParse(BASE_VALID);
      expect(result.success).toBe(true);
    });

    it("lowercases email", () => {
      const result = enrollmentSchema.safeParse({ ...BASE_VALID, email: "JUAN@EXAMPLE.COM" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe("juan@example.com");
    });

    it("accepts empty workExperience", () => {
      const result = enrollmentSchema.safeParse({ ...BASE_VALID, workExperience: "" });
      expect(result.success).toBe(true);
    });

    it("accepts empty toolsFamiliarity", () => {
      const result = enrollmentSchema.safeParse({ ...BASE_VALID, toolsFamiliarity: [] });
      expect(result.success).toBe(true);
    });
  });

  describe("fullName validation", () => {
    it("rejects single character name", () => {
      const result = enrollmentSchema.safeParse({ ...BASE_VALID, fullName: "J" });
      expect(result.success).toBe(false);
    });

    it("rejects name over 100 chars", () => {
      const result = enrollmentSchema.safeParse({ ...BASE_VALID, fullName: "A".repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe("dateOfBirth validation", () => {
    it("rejects age < 16", () => {
      const young = new Date();
      young.setFullYear(young.getFullYear() - 15);
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        dateOfBirth: young.toISOString().split("T")[0],
      });
      expect(result.success).toBe(false);
    });

    it("rejects age > 80", () => {
      const old = new Date();
      old.setFullYear(old.getFullYear() - 81);
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        dateOfBirth: old.toISOString().split("T")[0],
      });
      expect(result.success).toBe(false);
    });

    it("accepts age 16", () => {
      const just16 = new Date();
      just16.setFullYear(just16.getFullYear() - 16);
      just16.setDate(just16.getDate() - 1);
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        dateOfBirth: just16.toISOString().split("T")[0],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects invalid email", () => {
      const result = enrollmentSchema.safeParse({ ...BASE_VALID, email: "not-an-email" });
      expect(result.success).toBe(false);
    });
  });

  describe("contactNumber validation", () => {
    it("rejects letters in phone number", () => {
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        contactNumber: "abc1234",
      });
      expect(result.success).toBe(false);
    });

    it("accepts international format", () => {
      const result = enrollmentSchema.safeParse({ ...BASE_VALID, contactNumber: "+1 800 555-1234" });
      expect(result.success).toBe(true);
    });
  });

  describe("whyEnroll validation", () => {
    it("rejects responses under 100 chars", () => {
      const result = enrollmentSchema.safeParse({ ...BASE_VALID, whyEnroll: "Too short" });
      expect(result.success).toBe(false);
    });

    it("rejects responses over 2000 chars", () => {
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        whyEnroll: "A".repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("technicalSkills validation", () => {
    it("rejects more than 20 skills", () => {
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        technicalSkills: Array.from({ length: 21 }, (_, i) => `Skill ${i}`),
      });
      expect(result.success).toBe(false);
    });

    it("accepts exactly 20 skills", () => {
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        technicalSkills: Array.from({ length: 20 }, (_, i) => `Skill ${i}`),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("employmentStatus validation", () => {
    it("rejects invalid employment status", () => {
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        employmentStatus: "INTERN",
      });
      expect(result.success).toBe(false);
    });

    it("accepts FREELANCER", () => {
      const result = enrollmentSchema.safeParse({
        ...BASE_VALID,
        employmentStatus: "FREELANCER",
      });
      expect(result.success).toBe(true);
    });
  });
});
