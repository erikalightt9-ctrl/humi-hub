"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EnrollmentFormData } from "@/lib/validations/enrollment.schema";

interface StepEssayProps {
  form: UseFormReturn<EnrollmentFormData>;
}

export function StepEssay({ form }: StepEssayProps) {
  const { register, control, formState: { errors } } = form;
  const whyEnroll = useWatch({ control, name: "whyEnroll" }) ?? "";
  const charCount = whyEnroll.length;
  const MIN = 100;
  const MAX = 2000;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Personal Statement</h2>
        <p className="text-sm text-gray-500 mt-1">
          Help us understand your motivation for enrolling.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="whyEnroll">
          Why do you want to enroll in this program? *
        </Label>
        <p className="text-xs text-gray-500">
          Minimum 100 characters. Share your goals, motivation, and what you hope to achieve.
        </p>
        <Textarea
          id="whyEnroll"
          placeholder="I want to enroll because..."
          rows={8}
          {...register("whyEnroll")}
        />
        <div className="flex items-center justify-between mt-1">
          <div>
            {errors.whyEnroll && (
              <p className="text-red-500 text-xs">{errors.whyEnroll.message}</p>
            )}
          </div>
          <span
            className={`text-xs font-medium ${
              charCount < MIN
                ? "text-amber-600"
                : charCount > MAX
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {charCount} / {MAX}
          </span>
        </div>
      </div>

      {charCount >= MIN && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          Great! Your statement meets the minimum requirement. Continue to review your application.
        </div>
      )}
    </div>
  );
}
