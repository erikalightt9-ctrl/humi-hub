import Link from "next/link";
import { Clock, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface CourseCardProps {
  title: string;
  description: string;
  durationWeeks: number;
  price: number | string;
  slug: string;
  href: string;
}

export function CourseCard({ title, description, durationWeeks, price, href }: CourseCardProps) {
  const priceNum = typeof price === "string" ? parseFloat(price) : price;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg text-gray-900 leading-snug">{title}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {durationWeeks} weeks
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            ₱{priceNum.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{description}</p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={href}>Learn More</Link>
        </Button>
        <Button asChild size="sm" className="flex-1 bg-blue-700 hover:bg-blue-800">
          <Link href="/enroll">
            Enroll <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
