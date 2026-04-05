import {
  GraduationCap,
  Users,
  Landmark,
  Megaphone,
  Package,
  TrendingUp,
  Monitor,
  CheckCircle2,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Users,
  Landmark,
  Megaphone,
  Package,
  TrendingUp,
  Monitor,
};

interface ModulePlaceholderProps {
  module: string;
  iconName: string;
  description: string;
  features: string[];
}

export function ModulePlaceholder({
  module,
  iconName,
  description,
  features,
}: ModulePlaceholderProps) {
  const Icon = ICON_MAP[iconName] ?? Package;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 bg-indigo-100 rounded-2xl mb-4">
        <Icon className="h-10 w-10 text-indigo-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{module} Module</h1>
      <p className="text-sm text-slate-500 max-w-md mb-8">{description}</p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full text-left">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Planned Features
        </p>
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        This module is enabled for your workspace. Full functionality coming soon.
      </p>
    </div>
  );
}
