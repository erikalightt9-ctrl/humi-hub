"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enrollmentSchema, type EnrollmentFormData } from "@/lib/validations/enrollment.schema";
import { ProgressBar } from "./ProgressBar";
import { StepPersonal } from "./StepPersonal";
import { StepTrainerSelect } from "./StepTrainerSelect";
import { StepScheduleSelect } from "./StepScheduleSelect";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import type { Course } from "@prisma/client";

const TOTAL_STEPS = 6;
const STEP_LABELS = ["Personal", "Trainer", "Schedule", "Professional", "Statement", "Review"];
const STORAGE_KEY = "va_enrollment_draft";

const STEP_FIELDS: Record<number, (keyof EnrollmentFormData)[]> = {
  1: ["fullName", "dateOfBirth", "email", "contactNumber", "address"],
  2: [], // trainer selection is optional
  3: [], // schedule selection is optional
  4: ["educationalBackground", "workExperience", "employmentStatus"],
  5: ["whyEnroll"],
  6: [],
};

interface EnrollmentFormProps {
  courses: Pick<Course, "id" | "title" | "slug">[];
}

export function EnrollmentForm({ courses }: EnrollmentFormProps) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

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
      trainerId: undefined,
      scheduleId: undefined,
    },
    mode: "onTouched",
  });

  const { control, reset } = form;

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
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  // Validate entire form before showing confirmation
  const handleSubmitClick = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      setStatus("error");
      setErrorMsg("Please go back and fill in all required fields before submitting.");
      return;
    }
    setShowConfirmDialog(true);
  };

  // Actually submit after user confirms
  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);
    setStatus("submitting");
    setErrorMsg("");

    try {
      const data = form.getValues();
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
      setEnrollmentId(json.data?.id ?? null);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("A network error occurred. Please check your connection and try again.");
    }
  };

  // Prevent Enter key from triggering form submission
  const preventFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Success screen
  if (status === "success") {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enrollment Submitted Successfully!</h2>
          <p className="text-gray-600 mt-3 max-w-md mx-auto">
            Your enrollment has been successfully submitted. Please wait for confirmation from the admin.
            A confirmation email has been sent to your email address.
          </p>
        </div>
        {enrollmentId && (
          <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
            <p className="text-sm text-gray-500">Enrollment Reference</p>
            <p className="font-mono text-sm text-gray-800 mt-1 break-all">{enrollmentId}</p>
          </div>
        )}
        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => window.location.assign("/enrollment-status/" + (enrollmentId ?? ""))}
          >
            Track Status
          </Button>
          {enrollmentId && (
            <Button
              className="bg-blue-700 hover:bg-blue-800"
              onClick={() => window.location.assign(`/pay/${enrollmentId}`)}
            >
              Proceed to Payment
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={preventFormSubmit} noValidate>
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} />

        {/* Course selector — shown on step 1 */}
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
          {step === 2 && <StepTrainerSelect form={form} />}
          {step === 3 && <StepScheduleSelect form={form} />}
          {step === 4 && <StepProfessional form={form} />}
          {step === 5 && <StepEssay form={form} />}
          {step === 6 && <StepReview form={form} courses={courses} />}
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

          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={goNext} className="bg-blue-700 hover:bg-blue-800 gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmitClick}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Enrollment Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm that all the information you provided is accurate and complete.
              Once submitted, you will receive a confirmation email with next steps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back & Review</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Yes, Submit Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
