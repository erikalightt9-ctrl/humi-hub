"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enrollmentSchema, type EnrollmentFormData } from "@/lib/validations/enrollment.schema";
import { ProgressBar } from "./ProgressBar";
import { StepPersonal } from "./StepPersonal";
import { StepProfessional } from "./StepProfessional";
import { StepEssay } from "./StepEssay";
import { StepReview } from "./StepReview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Course } from "@prisma/client";

const STEP_LABELS = ["Personal", "Professional", "Statement", "Review"];
const STORAGE_KEY = "va_enrollment_draft";

const STEP_FIELDS: Record<number, (keyof EnrollmentFormData)[]> = {
  1: ["fullName", "dateOfBirth", "email", "contactNumber", "address"],
  2: ["educationalBackground", "workExperience", "employmentStatus"],
  3: ["whyEnroll"],
  4: [],
};

interface EnrollmentFormProps {
  courses: Pick<Course, "id" | "title" | "slug">[];
}

export function EnrollmentForm({ courses }: EnrollmentFormProps) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      email: "",
      contactNumber: "",
      address: "",
      educationalBackground: "",
      workExperience: "",
      employmentStatus: undefined,
      technicalSkills: [],
      toolsFamiliarity: [],
      whyEnroll: "",
      courseId: courses[0]?.id ?? "",
    },
    mode: "onTouched",
  });

  const { handleSubmit, control, getValues, reset } = form;

  // Persist to sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        reset(parsed);
      } catch {
        // ignore corrupted draft
      }
    }
  }, [reset]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, 4));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: EnrollmentFormData) => {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.status === 409) {
        setStatus("error");
        setErrorMsg("An enrollment with this email already exists. Please use a different email.");
        return;
      }
      if (res.status === 429) {
        setStatus("error");
        setErrorMsg("Too many attempts from your connection. Please try again in 15 minutes.");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Submission failed. Please try again.");
        return;
      }

      sessionStorage.removeItem(STORAGE_KEY);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("A network error occurred. Please check your connection and try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Thank you for applying! A confirmation email has been sent to{" "}
          <strong>{getValues("email")}</strong>. Our admissions team will review your application
          and get back to you within 3–5 business days.
        </p>
        <p className="text-sm text-gray-500">
          Reference your email for your application ID. Questions? Contact us at{" "}
          <a href="mailto:info@vatrainingcenter.com" className="text-blue-600 underline">
            info@vatrainingcenter.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <ProgressBar currentStep={step} totalSteps={4} stepLabels={STEP_LABELS} />

      {/* Course selector — always visible */}
      {step === 1 && (
        <div className="mb-6 space-y-1">
          <Label>Select Course *</Label>
          <Controller
            control={control}
            name="courseId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a program" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.courseId && (
            <p className="text-red-500 text-xs">{form.formState.errors.courseId.message}</p>
          )}
        </div>
      )}

      {/* Step panels */}
      <div className="mb-8">
        {step === 1 && <StepPersonal form={form} />}
        {step === 2 && <StepProfessional form={form} />}
        {step === 3 && <StepEssay form={form} />}
        {step === 4 && <StepReview form={form} courses={courses} />}
      </div>

      {/* Error banner */}
      {status === "error" && (
        <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goPrev}
          disabled={step === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        {step < 4 ? (
          <Button type="button" onClick={goNext} className="bg-blue-700 hover:bg-blue-800 gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={status === "submitting"}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
