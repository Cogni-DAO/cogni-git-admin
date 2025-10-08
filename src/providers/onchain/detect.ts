export function detectProvider(headers: Record<string, string>, body: unknown): "alchemy" | null {
  // MVP: Hardcoded to Alchemy only
  return "alchemy";
}