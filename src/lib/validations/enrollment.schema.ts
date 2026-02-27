import { z } from "zod";

const EMPLOYMENT_STATUSES = [
  "EMPLOYED_FULL_TIME",
  "EMPLOYED_PART_TIME",
  "SELF_EMPLOYED",
  "UNEMPLOYED",
  "STUDENT",
  "FREELANCER",
] as const;

const TOOL_FAMILIARITY_VALUES = [
  "QUICKBOOKS",
  "CRM",
  "EHR",
  "MICROSOFT_OFFICE",
  "GOOGLE_WORKSPACE",
  "SLACK",
  "ZOOM",
  "TRELLO",
  "ASANA",
  "SALESFORCE",
  "HUBSPOT",
  "OTHER",
] as const;

export const enrollmentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long"),
  dateOfBirth: z.string().refine((val) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    const ageMs = Date.now() - date.getTime();
    const age = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 16 && age <= 80;
  }, "Must be between 16 and 80 years old"),
  email: z.string().email("Invalid email address").toLowerCase(),
  contactNumber: z
    .string()
    .regex(/^\+?[0-9\s\-]{7,20}$/, "Invalid contact number format"),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address is too long"),
  educationalBackground: z
    .string()
    .min(10, "Please provide more detail about your educational background")
    .max(1000, "Educational background is too long"),
  workExperience: z.string().max(2000, "Work experience description is too long"),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES, {
    error: "Please select a valid employment status",
  }),
  technicalSkills: z
    .array(z.string().min(1).max(50))
    .max(20, "You can add up to 20 technical skills"),
  toolsFamiliarity: z.array(z.enum(TOOL_FAMILIARITY_VALUES)),
  whyEnroll: z
    .string()
    .min(100, "Please write at least 100 characters explaining why you want to enroll")
    .max(2000, "Response is too long"),
  courseId: z.string().cuid("Invalid course selection"),
});

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
export type EmploymentStatusValue = (typeof EMPLOYMENT_STATUSES)[number];
export type ToolFamiliarityValue = (typeof TOOL_FAMILIARITY_VALUES)[number];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatusValue, string> = {
  EMPLOYED_FULL_TIME: "Employed Full-Time",
  EMPLOYED_PART_TIME: "Employed Part-Time",
  SELF_EMPLOYED: "Self-Employed",
  UNEMPLOYED: "Unemployed",
  STUDENT: "Student",
  FREELANCER: "Freelancer",
};

export const TOOL_FAMILIARITY_LABELS: Record<ToolFamiliarityValue, string> = {
  QUICKBOOKS: "QuickBooks",
  CRM: "CRM Software",
  EHR: "EHR / EMR Systems",
  MICROSOFT_OFFICE: "Microsoft Office",
  GOOGLE_WORKSPACE: "Google Workspace",
  SLACK: "Slack",
  ZOOM: "Zoom",
  TRELLO: "Trello",
  ASANA: "Asana",
  SALESFORCE: "Salesforce",
  HUBSPOT: "HubSpot",
  OTHER: "Other",
};
