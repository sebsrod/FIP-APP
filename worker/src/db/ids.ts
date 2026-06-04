/** Random, collision-resistant identifiers (crypto.randomUUID runs in Workers and Node 18+). */
export function newId(prefix?: string): string {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}
