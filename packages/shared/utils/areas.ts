export const KARACHI_AREAS = [
  "Defence Phase V",
  "Defence Phase VI",
  "Defence Phase VII",
  "Defence Phase VIII",
  "Clifton",
  "Clifton Block 2",
  "Clifton Block 5",
  "Clifton Block 9",
  "Gulshan-e-Iqbal",
  "Gulistan-e-Johar",
  "Gulshan-e-Hadeed",
  "North Nazimabad",
  "North Karachi",
  "Nazimabad",
  "PECHS",
  "PECHS Block 2",
  "PECHS Block 6",
  "Malir",
  "Malir Halt",
  "Malir Cantt",
  "Korangi",
  "Korangi Industrial Area",
  "Saddar",
  "Burns Garden",
  "Bahadurabad",
  "Tariq Road",
  "Scheme 33",
  "Gizri",
  "Orangi Town",
  "SITE Area",
  "SITE Industrial Area",
  "Surjani Town",
  "North Korangi",
  "Shah Faisal Colony",
  "Federal B Area",
  "Buffer Zone",
  "Kiaa Chaari",
  "Landhi",
  "Steel Town",
  "Ibrahim Hyderi",
  "Baldia Town",
  "Manghopir",
];

/**
 * Extract the major neighborhood from a full address string.
 * e.g. "House no. D 32, D Extension, Alfalah Housing Society, Malir Halt"
 *   → "Malir Halt"
 */
export function normalizeResidency(full: string): string {
  const parts = full
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || full;
}
