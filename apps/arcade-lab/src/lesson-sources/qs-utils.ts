/** Verbatim source block from aetherlab monolith (id=src-qs-utils). */
export default "export function calculateAverage(numbers: number[]): number {\n  let total = 0;\n  for (const num of numbers) {\n    total += num;\n  }\n  return total / numbers.length;\n}\n\nexport function getUserName(user: { name: string } | null): string {\n  return user!.name.toUpperCase();\n}\n" as string;
