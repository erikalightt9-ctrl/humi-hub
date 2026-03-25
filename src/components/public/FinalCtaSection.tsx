import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
          Start Your Training Platform Today
        </h2>
        <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
          Launch your branded training center in minutes. Manage students,
          courses, payments, and analytics in one place — no technical skills
          required.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-base px-8 py-6 shadow-lg"
          >
            <Link href="/contact">
              Start Your Training Platform Today <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-8 py-6"
          >
            <Link href="/contact">
              <Play className="mr-2 h-4 w-4" />
              Book a Demo
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
