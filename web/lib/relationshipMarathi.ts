/** English relationship labels used in Family link UI → display Marathi on family tab */
const RELATIONSHIP_MARATHI: Record<string, string> = {
  Wife: 'पत्नी',
  Son: 'मुलगा',
  Daughter: 'मुलगी',
  Father: 'वडील',
  Mother: 'आई',
  Other: 'इतर',
};

export function relationshipToMarathi(english: string | null | undefined): string | null {
  if (!english || typeof english !== 'string') return null;
  const key = english.trim();
  return RELATIONSHIP_MARATHI[key] ?? null;
}
