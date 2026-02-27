"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillTagInput } from "./SkillTagInput";
import { ToolCheckboxGroup } from "./ToolCheckboxGroup";
import {
  EMPLOYMENT_STATUS_LABELS,
  type EnrollmentFormData,
  type ToolFamiliarityValue,
} from "@/lib/validations/enrollment.schema";

interface StepProfessionalProps {
  form: UseFormReturn<EnrollmentFormData>;
}

export function StepProfessional({ form }: StepProfessionalProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Professional Background</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about your experience and skills.</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="educationalBackground">Educational Background *</Label>
        <Textarea
          id="educationalBackground"
          placeholder="Degree, institution, year graduated..."
          rows={3}
          {...register("educationalBackground")}
        />
        {errors.educationalBackground && (
          <p className="text-red-500 text-xs">{errors.educationalBackground.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="workExperience">Work Experience</Label>
        <Textarea
          id="workExperience"
          placeholder="Describe your previous roles and responsibilities..."
          rows={4}
          {...register("workExperience")}
        />
        {errors.workExperience && (
          <p className="text-red-500 text-xs">{errors.workExperience.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Employment Status *</Label>
        <Controller
          control={control}
          name="employmentStatus"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your current employment status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.employmentStatus && (
          <p className="text-red-500 text-xs">{errors.employmentStatus.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Technical Skills</Label>
        <p className="text-xs text-gray-500">Press Enter or comma to add each skill (max 20)</p>
        <Controller
          control={control}
          name="technicalSkills"
          render={({ field }) => (
            <SkillTagInput value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.technicalSkills && (
          <p className="text-red-500 text-xs">{errors.technicalSkills.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tools Familiarity</Label>
        <p className="text-xs text-gray-500">Select all tools you have experience with</p>
        <Controller
          control={control}
          name="toolsFamiliarity"
          render={({ field }) => (
            <ToolCheckboxGroup
              value={field.value as ToolFamiliarityValue[]}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
}
