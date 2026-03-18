import {
  Star,
  Award,
  Users,
  Briefcase,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const trainerStats = [
  { icon: Award, value: "50+", label: "Certified Trainers" },
  { icon: Star, value: "4.8/5", label: "Average Rating" },
  { icon: Users, value: "2,400+", label: "Students Trained" },
  { icon: Briefcase, value: "15+", label: "Industry Specializations" },
] as const;

/* ------------------------------------------------------------------ */
/*  TrainersSection                                                    */
/* ------------------------------------------------------------------ */

export function TrainersSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Expert Trainers
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Learn From{" "}
            <span className="text-blue-700">Industry Leaders</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Our trainers are active industry professionals who bring real-world
            expertise to every session.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trainerStats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100"
            >
              <stat.icon className="h-5 w-5 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-gray-900">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
