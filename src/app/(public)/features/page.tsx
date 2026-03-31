import Link from "next/link";
import {
  Users, BookOpen, GraduationCap, BarChart3, Sparkles,
  FolderOpen, CheckSquare, CalendarDays, Globe, Shield,
  Zap, ArrowRight, Building2, Lock, Palette, Award,
  MessageSquare, Bell, FileText, TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const PILLARS = [
  {
    icon: Building2,
    color: "bg-blue-100 text-blue-700",
    title: "True Multi-Tenancy",
    description:
      "Each organization gets a fully isolated environment — courses, students, settings, and data are never shared between tenants.",
  },
  {
    icon: Palette,
    color: "bg-purple-100 text-purple-700",
    title: "White-Label Branding",
    description:
      "Custom domain, your logo, your colors. Students see your brand, not ours. Full white-label from day one.",
  },
  {
    icon: Shield,
    color: "bg-green-100 text-green-700",
    title: "Role-Based Access",
    description:
      "Admin, Trainer, Student — each role sees exactly what they need. Strict permission enforcement at every layer.",
  },
  {
    icon: Zap,
    color: "bg-amber-100 text-amber-600",
    title: "Instant Provisioning",
    description:
      "Sign up → platform is live in seconds. No waiting, no setup calls. Your subdomain is ready immediately after signup.",
  },
] as const;

const MODULE_GROUPS = [
  {
    group: "Training Management",
    color: "border-blue-200",
    headerColor: "bg-blue-50 text-blue-700",
    modules: [
      { icon: BookOpen,      label: "Course Builder",      desc: "Create structured courses with lessons, videos, quizzes, and resources." },
      { icon: GraduationCap, label: "Trainer Portal",      desc: "Trainers manage schedules, submit materials, and track student progress." },
      { icon: Users,         label: "Student Management",  desc: "Enroll, monitor, and communicate with all your students in one place." },
      { icon: Award,         label: "Certificates",        desc: "Auto-generate verifiable certificates on course completion." },
    ],
  },
  {
    group: "Operations & Productivity",
    color: "border-green-200",
    headerColor: "bg-green-50 text-green-700",
    modules: [
      { icon: CheckSquare,   label: "Task Management",     desc: "Assign tasks with priorities, due dates, and kanban status tracking." },
      { icon: CalendarDays,  label: "Calendar",            desc: "View all sessions, deadlines, and events in a unified calendar." },
      { icon: FolderOpen,    label: "File Manager",        desc: "Upload, organize, and share training materials and documents." },
      { icon: MessageSquare, label: "Messaging",           desc: "Internal messaging between admins, trainers, and students." },
    ],
  },
  {
    group: "AI-Powered Tools",
    color: "border-pink-200",
    headerColor: "bg-pink-50 text-pink-700",
    modules: [
      { icon: Sparkles,      label: "Content Summarizer",  desc: "Paste any text — AI condenses it into clear, actionable bullet points." },
      { icon: FileText,      label: "Grammar Checker",     desc: "AI reviews and corrects grammar, style, and tone instantly." },
      { icon: Sparkles,      label: "Quiz Generator",      desc: "Enter a topic and AI generates multiple-choice quiz questions automatically." },
      { icon: Sparkles,      label: "Session Summaries",   desc: "AI summarizes training sessions and extracts key learnings." },
    ],
  },
  {
    group: "Analytics & Reporting",
    color: "border-purple-200",
    headerColor: "bg-purple-50 text-purple-700",
    modules: [
      { icon: BarChart3,     label: "Enrollment Analytics", desc: "Track enrollment trends, completion rates, and monthly growth." },
      { icon: TrendingUp,    label: "Completion Reports",   desc: "See who finished what and when. Export to CSV for offline analysis." },
      { icon: BarChart3,     label: "Course Performance",   desc: "Identify top-performing courses and spot drop-off points." },
      { icon: Users,         label: "Seat Usage",           desc: "Monitor plan seat utilization with real-time usage bar." },
    ],
  },
  {
    group: "Platform & Settings",
    color: "border-slate-200",
    headerColor: "bg-slate-50 text-slate-700",
    modules: [
      { icon: Globe,         label: "Website Builder",      desc: "Customize your public-facing portal with your branding and colors." },
      { icon: Palette,       label: "Theme Studio",         desc: "Pick primary and secondary colors, fonts, logos, and banners." },
      { icon: Bell,          label: "Announcements",        desc: "Broadcast important updates to your entire organization." },
      { icon: Lock,          label: "Feature Flags",        desc: "Enable or disable features per tenant via the super admin panel." },
    ],
  },
] as const;

const COMPARISON = [
  { label: "Traditional LMS",       items: ["Single tenant", "Shared data risk", "Manual setup", "No white-label", "Limited AI"] },
  { label: "HUMI Hub Training Platform", items: ["True multi-tenant", "Fully isolated data", "Instant provisioning", "Full white-label", "AI tools built-in"] },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FeaturesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-20 pb-28 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="h-3 w-3" />
          Shopify-style multi-tenant LMS
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 max-w-3xl mx-auto">
          Everything your training business needs — in one platform
        </h1>
        <p className="text-blue-200 text-lg max-w-xl mx-auto mb-8">
          From course delivery to AI tools, from analytics to white-label branding — HUMI Hub gives
          you the full stack to run and scale your training center.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/start-trial"
            className="inline-flex items-center gap-2 bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-400 transition-colors"
          >
            Create Your Platform <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 border border-blue-400/50 text-blue-200 font-medium px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Core pillars */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Built for multi-tenant scale</h2>
        <p className="text-center text-gray-500 text-sm mb-12">The foundation that makes HUMI Hub different from every other LMS.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className={`inline-flex p-2.5 rounded-xl ${p.color} mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Module groups */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Complete feature set</h2>
          <p className="text-center text-gray-500 text-sm mb-12">20+ modules across 5 categories — all included, no plugins needed.</p>

          <div className="space-y-8">
            {MODULE_GROUPS.map((group) => (
              <div key={group.group} className={`bg-white rounded-2xl border-2 ${group.color} overflow-hidden`}>
                <div className={`px-6 py-3 ${group.headerColor} font-semibold text-sm`}>
                  {group.group}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y divide-gray-100">
                  {group.modules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <div key={mod.label} className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="font-semibold text-sm text-gray-900">{mod.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{mod.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HUMI Hub vs Traditional */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">HUMI Hub vs Traditional LMS</h2>
        <p className="text-center text-gray-500 text-sm mb-12">Why training businesses are switching to HUMI Hub.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {COMPARISON.map((col, i) => (
            <div
              key={col.label}
              className={`rounded-2xl p-6 border ${i === 0 ? "bg-gray-50 border-gray-200" : "bg-blue-600 border-blue-500"}`}
            >
              <h3 className={`font-bold mb-4 ${i === 0 ? "text-gray-500" : "text-white"}`}>{col.label}</h3>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${i === 0 ? "bg-gray-300" : "bg-amber-400"}`} />
                    <span className={`text-sm ${i === 0 ? "text-gray-500 line-through" : "text-blue-100"}`}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Up and running in minutes</h2>
        <p className="text-slate-400 text-sm mb-12">No technical setup. No IT department needed.</p>
        <div className="flex flex-wrap justify-center gap-8 max-w-3xl mx-auto mb-12">
          {[
            { step: "01", label: "Sign up", desc: "Create your account and organization name." },
            { step: "02", label: "Customize", desc: "Add your logo, colors, and subdomain." },
            { step: "03", label: "Add content", desc: "Upload courses, invite trainers and students." },
            { step: "04", label: "Launch", desc: "Share your portal link and start training." },
          ].map((s) => (
            <div key={s.step} className="text-left max-w-[160px]">
              <div className="text-3xl font-black text-blue-500 mb-1">{s.step}</div>
              <p className="font-semibold text-white text-sm mb-1">{s.label}</p>
              <p className="text-xs text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
        <Link
          href="/start-trial"
          className="inline-flex items-center gap-2 bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-400 transition-colors"
        >
          Create Your Training Platform <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
