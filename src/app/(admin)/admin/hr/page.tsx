import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export default function HRPage() {
  return (
    <ModulePlaceholder
      module="HR"
      iconName="Users"
      description="Manage employee records, payroll, attendance, leave requests, and HR workflows."
      features={[
        "Employee directory & profiles",
        "Payroll management",
        "Attendance & time tracking",
        "Leave & PTO management",
        "Performance reviews",
        "Onboarding workflows",
      ]}
    />
  );
}
