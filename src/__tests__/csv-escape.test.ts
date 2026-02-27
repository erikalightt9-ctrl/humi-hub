// Test CSV field escaping logic (extracted from export route)
function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

describe("escapeCsvField", () => {
  it("returns empty string for null", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("returns plain string as-is when no special chars", () => {
    expect(escapeCsvField("John Doe")).toBe("John Doe");
  });

  it("wraps in quotes when value contains a comma", () => {
    expect(escapeCsvField("Manila, Philippines")).toBe('"Manila, Philippines"');
  });

  it("escapes double quotes by doubling them", () => {
    expect(escapeCsvField('He said "hello"')).toBe('"He said ""hello"""');
  });

  it("wraps in quotes when value contains newline", () => {
    const multiline = "Line 1\nLine 2";
    expect(escapeCsvField(multiline)).toBe('"Line 1\nLine 2"');
  });

  it("handles empty string", () => {
    expect(escapeCsvField("")).toBe("");
  });

  it("handles numeric-like strings", () => {
    expect(escapeCsvField("12345")).toBe("12345");
  });
});
