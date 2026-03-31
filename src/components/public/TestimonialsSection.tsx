import { Star, Quote } from "lucide-react";
import { getPublishedTestimonials } from "@/lib/repositories/testimonial.repository";

/* ------------------------------------------------------------------ */
/*  Star Rating (static, server-rendered)                              */
/* ------------------------------------------------------------------ */

function StarRating({ rating }: { readonly rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TestimonialsSection (server component)                             */
/* ------------------------------------------------------------------ */

export async function TestimonialsSection() {
  const testimonials = await getPublishedTestimonials();

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-400 font-semibold text-sm uppercase tracking-wide mb-2">
            Success Stories
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            What Our <span className="text-blue-400">Graduates</span> Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Hear from real professionals who transformed their careers through
            HUMI Hub.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Quote icon */}
              <div className="bg-amber-900/40 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <Quote className="h-5 w-5 text-amber-400" />
              </div>

              {/* Star rating */}
              <div className="mb-3">
                <StarRating rating={testimonial.rating} />
              </div>

              {/* Content */}
              <p className="text-sm text-gray-600 leading-relaxed italic mb-4">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="border-t border-gray-200 pt-4">
                <p className="font-semibold text-gray-900 text-sm">
                  {testimonial.name}
                </p>
                <p className="text-xs text-gray-500">
                  {testimonial.role} at {testimonial.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
