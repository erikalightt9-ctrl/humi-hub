import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusDropdown } from "./StatusDropdown";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { EnrollmentWithCourse } from "@/lib/repositories/enrollment.repository";

interface EnrolleesTableProps {
  enrollments: EnrollmentWithCourse[];
}

export function EnrolleesTable({ enrollments }: EnrolleesTableProps) {
  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">No enrollments found</p>
        <p className="text-sm mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((e) => (
            <TableRow key={e.id} className="hover:bg-gray-50">
              <TableCell className="font-medium text-gray-900">{e.fullName}</TableCell>
              <TableCell className="text-gray-600 text-sm">{e.email}</TableCell>
              <TableCell className="text-gray-600 text-sm">{e.course.title}</TableCell>
              <TableCell>
                <StatusDropdown enrollmentId={e.id} currentStatus={e.status} />
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {new Date(e.createdAt).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/enrollees/${e.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
