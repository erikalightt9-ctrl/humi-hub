import { Globe, Palette, Server, CreditCard } from "lucide-react";

const capabilities = [
  {
    icon: Globe,
    title: "Dedicated Platform per Company",
    description: "Each client gets their own isolated environment with separate data, users, and branding.",
  },
  {
    icon: Palette,
    title: "White-Label Capability",
    description: "Remove our branding entirely — use your logo, colors, and domain for a fully branded experience.",
  },
  {
    icon: Server,
    title: "Multi-Tenant Architecture",
    description: "Enterprise-grade isolation ensures data security while sharing infrastructure for cost efficiency.",
  },
  {
    icon: CreditCard,
    title: "Flexible Licensing",
    description: "Offer subscription-based or one-time purchase options to match your business model.",
  },
] as const;

export function MultiTenantSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div>
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
              SaaS-Ready
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for Scale — Perfect for Growing Training Businesses
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Whether you manage one training center or a hundred, our
              multi-tenant architecture grows with you. Each organization gets
              its own branded platform with full data isolation.
            </p>

            <div className="space-y-5">
              {capabilities.map((c) => (
                <div key={c.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <c.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Visual */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <div className="space-y-4">
              {[
                { name: "Acme Training Co.", domain: "acme.yourdomain.com", students: 340, color: "bg-blue-500" },
                { name: "Global Skills Academy", domain: "globalskills.yourdomain.com", students: 890, color: "bg-purple-500" },
                { name: "TechPro Institute", domain: "techpro.yourdomain.com", students: 215, color: "bg-emerald-500" },
              ].map((tenant) => (
                <div key={tenant.name} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${tenant.color} flex items-center justify-center`}>
                        <span className="text-white font-bold text-xs">{tenant.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tenant.name}</p>
                        <p className="text-xs text-gray-400">{tenant.domain}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{tenant.students}</p>
                      <p className="text-[10px] text-gray-500">students</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Each tenant has isolated data, branding, and user management
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
