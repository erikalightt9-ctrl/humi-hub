import { UseFormReturn, useWatch } from "react-hook-form";
import {
  EMPLOYMENT_STATUS_LABELS,
  TOOL_FAMILIARITY_LABELS,
  type EnrollmentFormData,
} from "@/lib/validations/enrollment.schema";
import type { Course } from "@prisma/client";

interface StepReviewProps {
  form: UseFormReturn<EnrollmentFormData>;
  courses: Pick<Course, "id" | "title">[];
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500 col-span-1">{label}</dt>
      <dd className="text-sm text-gray-900 col-span-2 break-words">{value}</dd>
    </div>
  );
}

export function StepReview({ form, courses }: StepReviewProps) {
  const data = useWatch({ control: form.control });
  const course = courses.find((c) => c.id === data.courseId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review Your Application</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please review all details before submitting.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Personal Information
        </h3>
        <dl>
          <ReviewRow label="Full Name" value={data.fullName || "—"} />
          <ReviewRow label="Date of Birth" value={data.dateOfBirth || "—"} />
          <ReviewRow label="Email" value={data.email || "—"} />
          <ReviewRow label="Contact No." value={data.contactNumber || "—"} />
          <ReviewRow label="Address" value={data.address || "—"} />
        </dl>
      </div>

      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Professional Background
        </h3>
        <dl>
          <ReviewRow label="Education" value={data.educationalBackground || "—"} />
          <ReviewRow label="Work Experience" value={data.workExperience || "—"} />
          <ReviewRow
            label="Employment"
            value={
              data.employmentStatus
                ? EMPLOYMENT_STATUS_LABELS[data.employmentStatus]
                : "—"
            }
          />
          <ReviewRow
            label="Technical Skills"
            value={
              data.technicalSkills?.length
                ? data.technicalSkills.join(", ")
                : "None added"
            }
          />
          <ReviewRow
            label="Tools"
            value={
              data.toolsFamiliarity?.length
                ? data.toolsFamiliarity
                    .map((t) => TOOL_FAMILIARITY_LABELS[t as keyof typeof TOOL_FAMILIARITY_LABELS])
                    .join(", ")
                : "None selected"
            }
          />
        </dl>
      </div>

      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          Personal Statement & Course
        </h3>
        <dl>
          <ReviewRow
            label="Why Enroll"
            value={<span className="whitespace-pre-wrap">{data.whyEnroll || "—"}</span>}
          />
          <ReviewRow
            label="Course Selected"
            value={course?.title ?? "—"}
          />
        </dl>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        By submitting this application you confirm that all information provided is accurate and
        complete. You will receive a confirmation email after submission.
      </div>
    </div>
  );
}
