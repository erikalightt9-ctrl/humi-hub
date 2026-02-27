import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EnrollmentFormData } from "@/lib/validations/enrollment.schema";

interface StepPersonalProps {
  form: UseFormReturn<EnrollmentFormData>;
}

export function StepPersonal({ form }: StepPersonalProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about yourself.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" placeholder="Juan Dela Cruz" {...register("fullName")} />
          {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-xs">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="contactNumber">Contact Number *</Label>
          <Input id="contactNumber" placeholder="+63 912 345 6789" {...register("contactNumber")} />
          {errors.contactNumber && (
            <p className="text-red-500 text-xs">{errors.contactNumber.message}</p>
          )}
        </div>

        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="address">Complete Address *</Label>
          <Textarea
            id="address"
            placeholder="House/Unit No., Street, Barangay, City, Province, ZIP"
            rows={3}
            {...register("address")}
          />
          {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
        </div>
      </div>
    </div>
  );
}
