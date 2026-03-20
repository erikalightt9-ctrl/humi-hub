import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorClass?: string;
  subtitle?: string;
}

export function AnalyticsCard({
  title,
  value,
  icon: Icon,
  colorClass = "text-blue-600 bg-blue-100",
  subtitle,
}: AnalyticsCardProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
