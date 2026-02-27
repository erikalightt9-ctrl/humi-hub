import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const highlights = [
  "Industry-certified instructors",
  "Hands-on practical training",
  "Job placement assistance",
  "Flexible payment options",
];

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-block bg-blue-600/40 text-blue-100 text-sm font-medium px-4 py-1 rounded-full mb-6">
            #1 Virtual Assistant Training in the Philippines
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
            Launch Your Virtual Assistant Career Today
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-xl">
            Join thousands of Filipino professionals who have transformed their careers through our
            specialized Medical VA, Real Estate VA, and US Bookkeeping VA programs.
          </p>
          <ul className="space-y-2 mb-8">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-blue-100 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-bold">
              <Link href="/enroll">
                Enroll Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-blue-800/50"
            >
              <Link href="/courses">View Courses</Link>
            </Button>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-4">
          {[
            { label: "Graduates", value: "2,400+" },
            { label: "Courses", value: "3" },
            { label: "Hiring Partners", value: "150+" },
            { label: "Satisfaction Rate", value: "98%" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="text-blue-200 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
