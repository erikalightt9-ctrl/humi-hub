import type { Metadata } from "next";
import { ContactForm } from "@/components/public/ContactForm";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with VA Training Center. We are here to answer your questions about our training programs.",
};

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "info@vatrainingcenter.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+63 912 345 6789",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Manila, Philippines",
  },
  {
    icon: Clock,
    label: "Office Hours",
    value: "Mon–Fri, 8:00 AM – 5:00 PM PHT",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Get in Touch</h1>
          <p className="text-blue-100 text-lg">
            Have questions about our programs? We would love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-6">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{item.label}</p>
                    <p className="text-gray-900 font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <details>
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-blue-700">
                    How long does the application process take?
                  </summary>
                  <p className="mt-2 pl-3">Our team reviews applications within 3–5 business days.</p>
                </details>
                <details>
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-blue-700">
                    Are there payment installment options?
                  </summary>
                  <p className="mt-2 pl-3">
                    Yes, we offer flexible installment plans. Contact us for details.
                  </p>
                </details>
                <details>
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-blue-700">
                    Can I enroll in more than one program?
                  </summary>
                  <p className="mt-2 pl-3">
                    Absolutely! Many students complete multiple programs to broaden their VA skill
                    set.
                  </p>
                </details>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
