"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactFormData) => {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Server error");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 text-lg mb-2">Message Sent!</h3>
        <p className="text-gray-600 text-sm">
          Thank you for reaching out. Our team will get back to you within 1–2 business days.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setStatus("idle")}
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="Your name" {...register("name")} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" placeholder="What is this about?" {...register("subject")} />
        {errors.subject && <p className="text-red-500 text-xs">{errors.subject.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Your message..."
          rows={5}
          {...register("message")}
        />
        {errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-blue-700 hover:bg-blue-800"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
