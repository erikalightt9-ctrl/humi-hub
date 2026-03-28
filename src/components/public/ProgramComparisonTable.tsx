/* ------------------------------------------------------------------ */
/*  Program comparison — dynamic, driven by courses from the database  */
/*  Desktop: horizontal table   Mobile: stacked cards                  */
/* ------------------------------------------------------------------ */

/** Matches the Prisma Decimal interface without importing from internal paths */
type Decimal = { toString(): string };

interface ComparisonCourse {
  readonly id: string;
  readonly title: string;
  readonly durationWeeks: number;
  readonly price: Decimal | string;
  readonly priceBasic: Decimal | string;
  readonly priceProfessional: Decimal | string;
  readonly priceAdvanced: Decimal | string;
  readonly currency: string;
}

interface ProgramComparisonTableProps {
  readonly courses: ReadonlyArray<ComparisonCourse>;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function formatPrice(price: Decimal | string, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const amount = parseFloat(price.toString());
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------ */
/*  Row definitions                                                    */
/* ------------------------------------------------------------------ */

type RowKey = "duration" | "basePrice" | "basicTier" | "professionalTier" | "advancedTier";

interface Row {
  readonly key: RowKey;
  readonly label: string;
  getValue(course: ComparisonCourse): string;
}

const ROWS: ReadonlyArray<Row> = [
  {
    key: "duration",
    label: "Duration",
    getValue: (c) => plural(c.durationWeeks, "week"),
  },
  {
    key: "basePrice",
    label: "Price",
    getValue: (c) => formatPrice(c.price, c.currency),
  },
  {
    key: "basicTier",
    label: "Basic Tier",
    getValue: (c) => formatPrice(c.priceBasic, c.currency),
  },
  {
    key: "professionalTier",
    label: "Professional Tier",
    getValue: (c) => formatPrice(c.priceProfessional, c.currency),
  },
  {
    key: "advancedTier",
    label: "Advanced Tier",
    getValue: (c) => formatPrice(c.priceAdvanced, c.currency),
  },
];

const COLUMN_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-violet-600",
  "bg-rose-600",
] as const;

/* ------------------------------------------------------------------ */
/*  Desktop table                                                      */
/* ------------------------------------------------------------------ */

function DesktopTable({ courses }: { courses: ReadonlyArray<ComparisonCourse> }) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-500 w-1/5">
              Feature
            </th>
            {courses.map((course, i) => (
              <th key={course.id} className="text-left py-3 px-4 font-bold text-gray-900">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${COLUMN_COLORS[i % COLUMN_COLORS.length]} mr-2`}
                />
                {course.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-700">{row.label}</td>
              {courses.map((course) => (
                <td key={course.id} className="py-3 px-4 text-gray-600">
                  {row.getValue(course)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile cards                                                       */
/* ------------------------------------------------------------------ */

function MobileCards({ courses }: { courses: ReadonlyArray<ComparisonCourse> }) {
  return (
    <div className="md:hidden space-y-6">
      {courses.map((course, i) => (
        <div
          key={course.id}
          className="rounded-xl border border-gray-200 overflow-hidden"
        >
          <div
            className={`${COLUMN_COLORS[i % COLUMN_COLORS.length]} text-white px-4 py-3 font-bold text-sm`}
          >
            {course.title}
          </div>
          <div className="divide-y divide-gray-100">
            {ROWS.map((row) => (
              <div key={row.key} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="font-medium text-gray-500">{row.label}</span>
                <span className="text-gray-900 text-right">{row.getValue(course)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */

export function ProgramComparisonTable({ courses }: ProgramComparisonTableProps) {
  return (
    <div>
      <DesktopTable courses={courses} />
      <MobileCards courses={courses} />
    </div>
  );
}
