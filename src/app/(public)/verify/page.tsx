import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { VerifyForm } from "@/components/public/VerifyForm";

export const metadata: Metadata = {
  title: "Verify Certificate",
  description:
    "Verify the authenticity of a HUMI Hub certificate. Enter a certificate number to confirm a graduate's credentials.",
};

export default function VerifyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center bg-blue-800 rounded-full p-3 mb-4">
            <ShieldCheck className="h-8 w-8 text-blue-300" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Verify a Certificate</h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-xl mx-auto">
            Confirm the authenticity of a HUMI Hub graduate&apos;s certificate.
            Enter the certificate number to view the holder&apos;s credentials.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 px-4">
        <VerifyForm />
      </section>

      {/* Info Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Where to Find the Certificate Number</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            The certificate number is printed at the bottom of each HUMI Hub certificate.
            It starts with a unique identifier (e.g., &quot;cm9...&quot;). You can also ask the certificate
            holder to share their certificate number or public portfolio link for verification.
          </p>
        </div>
      </section>
    </div>
  );
}
