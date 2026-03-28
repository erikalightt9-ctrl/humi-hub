"use client";

import { useState } from "react";

interface ContactContent {
  title?: string;
  description?: string;
  showForm?: boolean;
}

interface ContactSectionProps {
  content: ContactContent;
}

interface FormState {
  name: string;
  email: string;
  message: string;
}

const INITIAL_FORM_STATE: FormState = { name: "", email: "", message: "" };

function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to send message. Please try again.");
      }

      setSubmitted(true);
      setForm(INITIAL_FORM_STATE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-700">
          Message sent! We&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-gray-700">
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-gray-700">
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-gray-700">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          placeholder="How can we help you?"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary, #3B82F6)" }}
      >
        {submitting ? "Sending\u2026" : "Send Message"}
      </button>
    </form>
  );
}

export default function ContactSection({ content }: ContactSectionProps) {
  const { title, description, showForm } = content;

  return (
    <section className="w-full bg-white px-4 py-16">
      <div className="mx-auto max-w-2xl">
        {title && (
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            {title}
          </h2>
        )}

        {description && (
          <p className="mb-8 text-center text-base text-gray-600">{description}</p>
        )}

        {showForm && <ContactForm />}
      </div>
    </section>
  );
}
