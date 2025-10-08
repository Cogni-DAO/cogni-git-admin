export function detectProvider(_headers: Record<string, string>, _body: unknown): "alchemy" | null {
  // MVP: Hardcoded to Alchemy only
  // TODO: Use headers and body for actual provider detection
  console.debug('Provider detection (hardcoded):', { headers: Object.keys(_headers), bodyType: typeof _body });
  return "alchemy";
}