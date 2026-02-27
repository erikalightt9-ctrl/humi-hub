import Link from "next/link";
import { CheckCircle2, Clock, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Course } from "@prisma/client";

interface CourseDetailPageProps {
  course: Course;
}

export function CourseDetailPage({ course }: CourseDetailPageProps) {
  const priceNum = parseFloat(course.price.toString());

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-blue-700 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Training Program
          </div>
          <h1 className="text-4xl font-extrabold mb-4">{course.title}</h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-2xl">
            {course.description}
          </p>
          <div className="flex flex-wrap gap-4 mb-8 text-sm">
            <span className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Clock className="h-4 w-4 text-blue-300" />
              {course.durationWeeks} weeks
            </span>
            <span className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <DollarSign className="h-4 w-4 text-blue-300" />
              ₱{priceNum.toLocaleString()} total
            </span>
          </div>
          <Button asChild size="lg" className="bg-white text-blue-900 font-bold hover:bg-blue-50">
            <Link href="/enroll">
              Enroll Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">What You Will Learn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {course.outcomes.map((outcome, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Program Investment</h2>
            <div className="text-5xl font-extrabold text-blue-700 my-4">
              ₱{priceNum.toLocaleString()}
            </div>
            <p className="text-gray-500 text-sm mb-6">
              {course.durationWeeks}-week program · One-time payment · Flexible installment available
            </p>
            <ul className="text-sm text-gray-600 text-left space-y-2 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Complete course materials and resources
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Certificate of completion
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Job placement assistance
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Lifetime community access
              </li>
            </ul>
            <Button asChild size="lg" className="w-full bg-blue-700 hover:bg-blue-800">
              <Link href="/enroll">Apply Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
